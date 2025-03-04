import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Typography, Card } from '@/components/common';
import { useBadges, UserBadge, Badge } from '@/contexts/BadgeContext';
import { FontAwesome6 } from '@expo/vector-icons';
import theme from '@/constants/theme';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

export const RecentBadges = () => {
  const { userBadges, badges, refreshBadges, isLoading } = useBadges();
  const [localBadges, setLocalBadges] = useState<UserBadge[]>([]);
  const router = useRouter();
  
  useEffect(() => {
    console.log('RecentBadges component mounted, refreshing badges...');
    
    const loadBadges = async () => {
      try {
        // First try to refresh badges through the context
        await refreshBadges();
        
        console.log(`RecentBadges: After refresh - Found ${userBadges.length} user badges`);
        if (userBadges.length > 0) {
          console.log('User badges available:', userBadges.map(ub => 
            `${ub.badge?.name || 'Unknown'} (ID: ${ub.badge_id})`
          ).join(', '));
          setLocalBadges(userBadges);
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
              
              setLocalBadges(userBadgesWithDetails);
            } else {
              console.log('No user badges found directly');
              setLocalBadges([]);
            }
          }
        }
      } catch (error) {
        console.error('Error loading badges:', error);
      }
    };
    
    loadBadges();
  }, []);
  
  // Update local badges when userBadges changes
  useEffect(() => {
    if (userBadges.length > 0) {
      console.log(`RecentBadges: userBadges updated - Found ${userBadges.length} user badges`);
      setLocalBadges(userBadges);
    }
  }, [userBadges]);
  
  // Get the most recent 3 badges
  const recentBadges = [...localBadges]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);
  
  console.log(`RecentBadges: Displaying ${recentBadges.length} recent badges`);
  
  if (isLoading) {
    return (
      <Card style={styles.container} variant="glow">
        <View style={styles.header}>
          <Typography variant="h3" style={styles.title} glow="soft">
            Recent Badges
          </Typography>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.COLORS.primary.blue} />
          <Typography variant="caption" style={styles.loadingText}>
            Loading badges...
          </Typography>
        </View>
      </Card>
    );
  }
  
  if (recentBadges.length === 0) {
    console.log('RecentBadges: No badges to display, returning null');
    return null; // Don't show anything if there are no badges
  }
  
  const getBadgeIcon = (category: string) => {
    switch (category) {
      case 'beginner': return 'star';
      case 'intermediate': return 'trophy';
      case 'advanced': return 'award';
      case 'expert': return 'medal';
      case 'master': return 'gem';
      case 'completion': return 'medal'; // Added for completion badges like Welcome Badge
      case 'streak': return 'fire'; // Added for streak badges
      default: return 'star';
    }
  };
  
  const getBadgeColor = (category: string) => {
    switch (category) {
      case 'beginner': return theme.COLORS.primary.green;
      case 'intermediate': return theme.COLORS.primary.blue;
      case 'advanced': return theme.COLORS.primary.purple;
      case 'expert': return theme.COLORS.primary.orange;
      case 'master': return theme.COLORS.primary.yellow;
      case 'completion': return theme.COLORS.primary.green; // Added for completion badges
      case 'streak': return theme.COLORS.primary.orange; // Added for streak badges
      default: return theme.COLORS.primary.green;
    }
  };
  
  return (
    <Card style={styles.container} variant="glow">
      <View style={styles.header}>
        <Typography variant="h3" style={styles.title} glow="soft">
          Recent Badges
        </Typography>
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={() => router.push('/(app)/profile')}
        >
          <Typography variant="caption" color={theme.COLORS.primary.blue}>
            View All
          </Typography>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.badgesContainer}
      >
        {recentBadges.map(userBadge => {
          const badge = userBadge.badge || badges.find(b => b.id === userBadge.badge_id);
          if (!badge) {
            console.log(`RecentBadges: Could not find badge with ID ${userBadge.badge_id}`);
            return null;
          }
          
          console.log(`RecentBadges: Rendering badge ${badge.name} (${badge.category})`);
          
          return (
            <View key={userBadge.id} style={styles.badgeItem}>
              <View 
                style={[
                  styles.badgeIcon, 
                  { backgroundColor: `${getBadgeColor(badge.category)}30` }
                ]}
              >
                <FontAwesome6 
                  name={getBadgeIcon(badge.category)} 
                  size={24} 
                  color={getBadgeColor(badge.category)} 
                />
              </View>
              <Typography variant="caption" style={styles.badgeName}>
                {badge.name}
              </Typography>
              <Typography 
                variant="caption" 
                style={styles.badgeDate}
                color={theme.COLORS.ui.textSecondary}
              >
                {new Date(userBadge.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })}
              </Typography>
            </View>
          );
        })}
      </ScrollView>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: theme.SPACING.lg,
    marginBottom: theme.SPACING.lg,
    padding: theme.SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.SPACING.sm,
  },
  title: {
    fontSize: 18,
  },
  viewAllButton: {
    padding: theme.SPACING.xs,
  },
  badgesContainer: {
    paddingVertical: theme.SPACING.sm,
  },
  badgeItem: {
    alignItems: 'center',
    marginRight: theme.SPACING.lg,
    width: 80,
  },
  badgeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.SPACING.xs,
  },
  badgeName: {
    textAlign: 'center',
    fontSize: 12,
    marginBottom: 2,
  },
  badgeDate: {
    textAlign: 'center',
    fontSize: 10,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.SPACING.md,
  },
  loadingText: {
    marginTop: theme.SPACING.xs,
    color: theme.COLORS.ui.textSecondary,
  },
}); 