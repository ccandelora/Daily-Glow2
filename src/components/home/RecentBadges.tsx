import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Typography, Card } from '@/components/common';
import { useBadges, UserBadge } from '@/contexts/BadgeContext';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/constants/theme';
import { useRouter } from 'expo-router';

export const RecentBadges = () => {
  const { userBadges, badges, refreshBadges } = useBadges();
  const router = useRouter();
  
  useEffect(() => {
    refreshBadges();
  }, []);
  
  // Get the most recent 3 badges
  const recentBadges = [...userBadges]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);
  
  if (recentBadges.length === 0) {
    return null; // Don't show anything if there are no badges
  }
  
  const getBadgeIcon = (category: string) => {
    switch (category) {
      case 'beginner': return 'star-outline';
      case 'intermediate': return 'trophy-outline';
      case 'advanced': return 'ribbon-outline';
      case 'expert': return 'medal-outline';
      case 'master': return 'diamond-outline';
      default: return 'star-outline';
    }
  };
  
  const getBadgeColor = (category: string) => {
    switch (category) {
      case 'beginner': return theme.COLORS.primary.green;
      case 'intermediate': return theme.COLORS.primary.blue;
      case 'advanced': return theme.COLORS.primary.purple;
      case 'expert': return theme.COLORS.primary.orange;
      case 'master': return theme.COLORS.primary.yellow;
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
          onPress={() => router.push('/(app)/settings')}
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
          const badge = badges.find(b => b.id === userBadge.badge_id);
          if (!badge) return null;
          
          return (
            <View key={userBadge.id} style={styles.badgeItem}>
              <View 
                style={[
                  styles.badgeIcon, 
                  { backgroundColor: `${getBadgeColor(badge.category)}30` }
                ]}
              >
                <Ionicons 
                  name={getBadgeIcon(badge.category) as any} 
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
}); 