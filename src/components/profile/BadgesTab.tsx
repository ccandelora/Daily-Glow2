import React from 'react';
import { View, ScrollView, StyleSheet, Animated } from 'react-native';
import { Typography, Card } from '@/components/common';
import { useBadges } from '@/contexts/BadgeContext';
import theme from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

const BADGE_COLORS: Record<string, string> = {
  beginner: theme.COLORS.primary.green,
  intermediate: theme.COLORS.primary.blue,
  advanced: theme.COLORS.primary.purple,
  expert: theme.COLORS.primary.orange,
  master: theme.COLORS.ui.accent,
};

const BADGE_ICONS: Record<string, string> = {
  beginner: 'leaf-outline',
  intermediate: 'shield-outline',
  advanced: 'diamond-outline',
  expert: 'star-outline',
  master: 'crown-outline',
};

export const BadgesTab = () => {
  const { badges, userBadges } = useBadges();
  
  // Animation values
  const fadeIn = React.useRef(new Animated.Value(0)).current;
  
  React.useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const getBadgeColor = (category: string) => BADGE_COLORS[category] || theme.COLORS.ui.textSecondary;
  const getBadgeIcon = (category: string) => BADGE_ICONS[category] || 'medal-outline';

  const renderBadge = (badge: any, isEarned: boolean) => {
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
            <Ionicons 
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

  return (
    <ScrollView style={styles.container}>
      <Animated.View style={StyleSheet.flatten([styles.content, { opacity: fadeIn }])}>
        <Typography variant="h3" style={styles.subsectionTitle} glow="soft">
          Your Badges
        </Typography>
        
        {/* Earned badges */}
        {userBadges.length > 0 ? (
          userBadges.map(ub => 
            renderBadge(ub.badge, true)
          )
        ) : (
          <Typography variant="body" style={styles.emptyMessage}>
            You haven't earned any badges yet. Complete special activities to earn badges!
          </Typography>
        )}
        
        <Typography variant="h3" style={styles.subsectionTitle} glow="soft">
          Available Badges
        </Typography>
        
        {/* Available badges */}
        {badges
          .filter(b => !userBadges.some(ub => ub.badge_id === b.id))
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
}); 