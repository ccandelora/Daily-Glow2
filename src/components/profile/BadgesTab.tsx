import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { Typography, Card } from '@/components/common';
import { useBadges, UserBadge, Badge } from '@/contexts/BadgeContext';
import theme from '@/constants/theme';
import { FontAwesome6 } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

const BADGE_COLORS: Record<string, string> = {
  beginner: theme.COLORS.primary.green,
  intermediate: theme.COLORS.primary.blue,
  advanced: theme.COLORS.primary.purple,
  expert: theme.COLORS.primary.orange,
  master: theme.COLORS.ui.accent,
  completion: theme.COLORS.primary.green,
  streak: theme.COLORS.primary.orange,
};

const BADGE_ICONS: Record<string, string> = {
  beginner: 'leaf',
  intermediate: 'shield',
  advanced: 'gem',
  expert: 'star',
  master: 'crown',
  completion: 'medal',
  streak: 'fire',
};

interface BadgesTabProps {
  updateParentBadgeCount?: (count: number) => void;
}

export const BadgesTab: React.FC<BadgesTabProps> = ({ updateParentBadgeCount }) => {
  const { badges, userBadges, refreshBadges, isLoading } = useBadges();
  const [localBadges, setLocalBadges] = useState<UserBadge[]>([]);
  const [localAllBadges, setLocalAllBadges] = useState<Badge[]>([]);
  const [isLocalLoading, setIsLocalLoading] = useState(true);
  
  // Animation values
  const fadeIn = React.useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    console.log('BadgesTab component mounted, refreshing badges...');
    
    const loadBadges = async () => {
      setIsLocalLoading(true);
      try {
        // First try to refresh badges through the context
        await refreshBadges();
        
        console.log(`BadgesTab: After refresh - Found ${userBadges.length} user badges`);
        if (userBadges.length > 0) {
          console.log('User badges available:', userBadges.map(ub => 
            `${ub.badge?.name || 'Unknown'} (ID: ${ub.badge_id})`
          ).join(', '));
          setLocalBadges(userBadges);
          
          // Log the actual badge count for debugging
          console.log('ACTUAL BADGE COUNT:', userBadges.length);
          
          // If we're given a callback function to update the parent component
          if (updateParentBadgeCount && typeof updateParentBadgeCount === 'function') {
            updateParentBadgeCount(userBadges.length);
          }
        } else {
          console.log('No user badges available after refresh, trying direct database query');
          
          // If no badges found, try to fetch directly from the database
          const { data: user } = await supabase.auth.getUser();
          if (user && user.user) {
            const userId = user.user.id;
            console.log(`Fetching badges directly for user: ${userId}`);
            
            const { data: directBadges, error: directError } = await supabase
              .from('user_badges')
              .select('id, badge_id, created_at, user_id')
              .eq('user_id', userId);
              
            if (directError) {
              console.error('Error fetching user badges directly:', directError);
            } else if (directBadges && directBadges.length > 0) {
              console.log(`Found ${directBadges.length} user badges directly`);
              
              // Now fetch the badge details for each badge
              const badgePromises = directBadges.map(async (userBadge) => {
                const { data: badgeData, error: badgeError } = await supabase
                  .from('badges')
                  .select('*')
                  .eq('id', userBadge.badge_id)
                  .single();
                  
                if (badgeError) {
                  console.error(`Error fetching badge details for badge_id ${userBadge.badge_id}:`, badgeError);
                  return { ...userBadge, badge: null };
                }
                
                return { ...userBadge, badge: badgeData };
              });
              
              const userBadgesWithDetails = await Promise.all(badgePromises);
              console.log(`Fetched details for ${userBadgesWithDetails.filter(ub => ub.badge).length} badges`);
              
              setLocalBadges(userBadgesWithDetails as UserBadge[]);
              
              // Update parent badge count with direct database results
              if (updateParentBadgeCount && typeof updateParentBadgeCount === 'function') {
                console.log('Updating parent badge count from direct database query:', directBadges.length);
                updateParentBadgeCount(directBadges.length);
              }
            } else {
              console.log('No user badges found directly');
              setLocalBadges([]);
            }
          }
        }
        
        // Also fetch all badges if needed
        if (badges.length === 0) {
          console.log('No badges in context, fetching all badges directly');
          const { data: allBadges, error: allBadgesError } = await supabase
            .from('badges')
            .select('*');
            
          if (allBadgesError) {
            console.error('Error fetching all badges:', allBadgesError);
          } else if (allBadges && allBadges.length > 0) {
            console.log(`Fetched ${allBadges.length} badges directly`);
            setLocalAllBadges(allBadges);
          }
        } else {
          setLocalAllBadges(badges);
        }
      } catch (error) {
        console.error('Error loading badges:', error);
      } finally {
        setIsLocalLoading(false);
        
        Animated.timing(fadeIn, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      }
    };
    
    loadBadges();
  }, []);
  
  // Update local badges when userBadges changes
  useEffect(() => {
    if (userBadges.length > 0) {
      console.log(`BadgesTab: userBadges updated - Found ${userBadges.length} user badges`);
      setLocalBadges(userBadges);
      
      // Also update parent component badge count if callback exists
      if (updateParentBadgeCount && typeof updateParentBadgeCount === 'function') {
        console.log('Updating parent badge count on userBadges change:', userBadges.length);
        updateParentBadgeCount(userBadges.length);
      }
    }
  }, [userBadges, updateParentBadgeCount]);
  
  // Update local all badges when badges changes
  useEffect(() => {
    if (badges.length > 0) {
      console.log(`BadgesTab: badges updated - Found ${badges.length} badges`);
      setLocalAllBadges(badges);
    }
  }, [badges]);

  const getBadgeColor = (category: string) => BADGE_COLORS[category] || theme.COLORS.ui.textSecondary;
  const getBadgeIcon = (category: string) => BADGE_ICONS[category] || 'medal';

  const renderBadge = (badge: any, isEarned: boolean) => {
    if (!badge) {
      console.log('Attempted to render undefined badge');
      return null;
    }
    
    console.log(`Rendering badge: ${badge.name} (${isEarned ? 'earned' : 'not earned'})`);
    
    const color = getBadgeColor(badge.category);
    const iconName = getBadgeIcon(badge.category);
    
    return (
      <Card 
        key={badge.id} 
        style={StyleSheet.flatten([
          styles.badgeCard,
          isEarned ? styles.earnedCard : styles.unearnedCard
        ])}
        variant={isEarned ? "glow" : "default"}
      >
        <View style={styles.badgeHeader}>
          <View 
            style={StyleSheet.flatten([
              styles.iconContainer, 
              {
                backgroundColor: isEarned ? `${color}20` : 'rgba(120, 120, 120, 0.1)',
                borderColor: isEarned ? color : 'rgba(120, 120, 120, 0.2)',
              }
            ])}
          >
            <FontAwesome6 
              name={iconName as any} 
              size={24} 
              color={isEarned ? color : 'rgba(120, 120, 120, 0.5)'} 
            />
          </View>
          <View style={styles.badgeInfo}>
            <Typography 
              variant="h3" 
              style={styles.badgeName}
              color={isEarned ? theme.COLORS.ui.text : theme.COLORS.ui.textSecondary}
              glow={isEarned ? "medium" : "none"}
            >
              {badge.name}
            </Typography>
            <Typography 
              variant="body" 
              style={styles.badgeDescription}
              color={isEarned ? theme.COLORS.ui.textSecondary : 'rgba(120, 120, 120, 0.6)'}
            >
              {badge.description}
            </Typography>
          </View>
        </View>
        <View style={styles.badgeFooter}>
          <Typography 
            variant="caption"
            color={isEarned ? color : 'rgba(120, 120, 120, 0.5)'}
            glow={isEarned ? "soft" : "none"}
          >
            {isEarned ? 'Earned' : 'Not yet earned'}
          </Typography>
          <Typography 
            variant="caption"
            color={isEarned ? theme.COLORS.primary.green : 'rgba(120, 120, 120, 0.5)'}
            glow={isEarned ? "soft" : "none"}
          >
            {badge.category.charAt(0).toUpperCase() + badge.category.slice(1)}
          </Typography>
        </View>
      </Card>
    );
  };

  if (isLoading || isLocalLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.COLORS.primary.blue} />
        <Typography variant="body" style={styles.loadingText}>
          Loading badges...
        </Typography>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Animated.View style={StyleSheet.flatten([styles.content, { opacity: fadeIn }])}>
        <Typography variant="h3" style={styles.subsectionTitle} glow="soft">
          Your Badges
        </Typography>
        
        {/* Earned badges */}
        {localBadges.length > 0 ? (
          localBadges.map(ub => {
            const badgeData = ub.badge || localAllBadges.find(b => b.id === ub.badge_id);
            if (!badgeData) {
              console.log(`Could not find badge with ID ${ub.badge_id}`);
              return null;
            }
            return renderBadge(badgeData, true);
          })
        ) : (
          <Typography variant="body" style={styles.emptyMessage}>
            You haven't earned any badges yet. Complete special activities to earn badges!
          </Typography>
        )}
        
        <Typography variant="h3" style={styles.subsectionTitle} glow="soft">
          Available Badges
        </Typography>
        
        {/* Available badges */}
        {localAllBadges
          .filter(b => !localBadges.some(ub => ub.badge_id === b.id))
          .map(badge => renderBadge(badge, false))
        }
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.ui.background,
  },
  content: {
    padding: theme.SPACING.lg,
  },
  subsectionTitle: {
    marginTop: theme.SPACING.xl,
    marginBottom: theme.SPACING.lg,
  },
  badgeCard: {
    marginBottom: theme.SPACING.md,
    padding: theme.SPACING.md,
  },
  earnedCard: {
    backgroundColor: 'rgba(38, 20, 60, 0.9)',
  },
  unearnedCard: {
    backgroundColor: 'rgba(38, 20, 60, 0.5)',
  },
  badgeHeader: {
    flexDirection: 'row',
    marginBottom: theme.SPACING.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginRight: theme.SPACING.md,
  },
  badgeInfo: {
    flex: 1,
  },
  badgeName: {
    fontSize: 18,
    marginBottom: theme.SPACING.xs,
  },
  badgeDescription: {
    fontSize: 14,
  },
  badgeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.SPACING.md,
  },
  emptyMessage: {
    textAlign: 'center',
    color: theme.COLORS.ui.textSecondary,
    marginVertical: theme.SPACING.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.SPACING.xl,
  },
  loadingText: {
    marginTop: theme.SPACING.md,
    color: theme.COLORS.ui.textSecondary,
  },
}); 