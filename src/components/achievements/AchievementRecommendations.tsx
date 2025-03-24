import React, { useMemo, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Pressable, ActivityIndicator } from 'react-native';
import { Typography, Card, ProgressBar } from '@/components/common';
import { FontAwesome6 } from '@expo/vector-icons';
import { useAchievements } from '@/contexts/AchievementsContext';
import { useBadges } from '@/contexts/BadgeContext';
import { useCheckInStreak } from '@/contexts/CheckInStreakContext';
import { useJournal } from '@/contexts/JournalContext';
import { useMood } from '@/contexts/MoodContext';
import { useNotifications } from '@/contexts/NotificationsContext';
import { useBadgeService } from '@/hooks/useBadgeService';
import theme from '@/constants/theme';
import { getCompatibleIconName } from '@/utils/iconUtils';

interface RecommendationItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  priority: number;
  progress?: number;
  action?: () => void;
}

export const AchievementRecommendations: React.FC = () => {
  console.log('Rendering AchievementRecommendations');
  const { achievements, userAchievements } = useAchievements();
  const { streaks, overallStreak } = useCheckInStreak();
  const { entries: journalEntries } = useJournal();
  const { moods: userMoods } = useMood();
  const { badges, userBadges } = useBadges();
  
  // Calculate next streak goal
  const nextStreakGoal = useMemo(() => {
    const currentStreak = overallStreak || 0;
    const streakAchievements = achievements
      .filter(a => a.requires_streak && a.requires_streak > 0)
      .sort((a, b) => (a.requires_streak || 0) - (b.requires_streak || 0));
    const nextGoal = streakAchievements.find(a => a.requires_streak && a.requires_streak > currentStreak);
    return nextGoal;
  }, [achievements, overallStreak]);
  
  // Check if user has journaling achievements
  const hasJournalingActivity = journalEntries && journalEntries.length > 0;
  
  // Check if user has tracked moods
  const hasMoodTracking = userMoods && userMoods.length > 0;
  
  // Try to use notifications if available
  let showAchievementNotification = (id: string) => {};
  let showBadgeNotification = (name: string) => {};
  
  try {
    const notificationsContext = useNotifications();
    if (notificationsContext) {
      showAchievementNotification = notificationsContext.showAchievementNotification;
      showBadgeNotification = notificationsContext.showBadgeNotification;
    }
  } catch (error) {
    console.log('NotificationsContext not available in AchievementRecommendations, notifications will be disabled');
  }
  
  const badgeService = useBadgeService();
  
  // Calculate recommendations based on user's current progress
  const recommendations = React.useMemo(() => {
    const items: RecommendationItem[] = [];
    
    // Current stats
    const currentStreak = overallStreak || 0;
    const morningStreak = streaks?.morning || 0;
    const afternoonStreak = streaks?.afternoon || 0;
    const eveningStreak = streaks?.evening || 0;
    const journalCount = journalEntries.length;
    const moodCount = userMoods.length;
    
    // Create a set of earned achievements and badges for quick lookup
    const earnedAchievementIds = new Set(userAchievements.map(ua => ua.achievement_id));
    const earnedBadgeIds = new Set(userBadges.map(ub => ub.badge_id));
    
    // Check streak achievements
    const streakAchievements = achievements
      .filter(a => a.requires_streak && !earnedAchievementIds.has(a.id))
      .sort((a, b) => (a.requires_streak || 0) - (b.requires_streak || 0));
    
    if (streakAchievements.length > 0) {
      const nextStreakAchievement = streakAchievements[0];
      const daysRequired = nextStreakAchievement.requires_streak || 0;
      
      items.push({
        id: `streak-${nextStreakAchievement.id}`,
        title: `${nextStreakAchievement.name}`,
        description: `Continue your daily check-ins for ${daysRequired - currentStreak} more days to earn this achievement!`,
        icon: nextStreakAchievement.icon_name || 'fire',
        color: theme.COLORS.primary.orange,
        priority: 1,
        progress: daysRequired > 0 ? Math.min(1, currentStreak / daysRequired) : 0,
        action: () => {
          if (earnedAchievementIds.has(nextStreakAchievement.id)) {
            showAchievementNotification(nextStreakAchievement.id);
          }
        }
      });
    }
    
    // Add time-of-day streak recommendations
    
    // Morning streak recommendation
    if (morningStreak < 7) {
      items.push({
        id: 'morning-streak',
        title: 'Morning Streak Challenge',
        description: `Check in during mornings for ${7 - morningStreak} more days to build your morning streak!`,
        icon: 'sun',
        color: theme.COLORS.primary.orange,
        priority: 2,
        progress: Math.min(1, morningStreak / 7)
      });
    }
    
    // Afternoon streak recommendation
    if (afternoonStreak < 7) {
      items.push({
        id: 'afternoon-streak',
        title: 'Afternoon Streak Challenge',
        description: `Check in during afternoons for ${7 - afternoonStreak} more days to build your afternoon streak!`,
        icon: 'cloud-sun',
        color: theme.COLORS.primary.blue,
        priority: 2,
        progress: Math.min(1, afternoonStreak / 7)
      });
    }
    
    // Evening streak recommendation
    if (eveningStreak < 7) {
      items.push({
        id: 'evening-streak',
        title: 'Evening Streak Challenge',
        description: `Check in during evenings for ${7 - eveningStreak} more days to build your evening streak!`,
        icon: 'moon',
        color: theme.COLORS.primary.purple,
        priority: 2,
        progress: Math.min(1, eveningStreak / 7)
      });
    }
    
    // Full day streak recommendation (all time periods) if at least one period has a decent streak
    if (Math.max(morningStreak, afternoonStreak, eveningStreak) >= 3 && 
        (morningStreak < 3 || afternoonStreak < 3 || eveningStreak < 3)) {
      items.push({
        id: 'full-day-streak',
        title: 'Complete Day Challenge',
        description: 'Try to check in during all time periods (morning, afternoon, and evening) to maximize your progress!',
        icon: 'clock',
        color: theme.COLORS.primary.teal,
        priority: 1,
        progress: (Math.min(1, morningStreak / 3) + Math.min(1, afternoonStreak / 3) + Math.min(1, eveningStreak / 3)) / 3
      });
    }
    
    // Check unearned consistency badges
    const consistencyBadges = badges
      .filter(b => b.category === 'consistency' && !earnedBadgeIds.has(b.id))
      .sort((a, b) => {
        // Sort by tier "Bronze" < "Silver" < "Gold" < "Platinum"
        const tierOrder = { Bronze: 1, Silver: 2, Gold: 3, Platinum: 4 };
        const tierA = a.name.includes('Bronze') ? 1 : 
                      a.name.includes('Silver') ? 2 : 
                      a.name.includes('Gold') ? 3 : 
                      a.name.includes('Platinum') ? 4 : 5;
        const tierB = b.name.includes('Bronze') ? 1 : 
                      b.name.includes('Silver') ? 2 : 
                      b.name.includes('Gold') ? 3 : 
                      b.name.includes('Platinum') ? 4 : 5;
        return tierA - tierB;
      });
    
    if (consistencyBadges.length > 0) {
      const nextConsistencyBadge = consistencyBadges[0];
      
      items.push({
        id: `badge-${nextConsistencyBadge.id}`,
        title: `${nextConsistencyBadge.name}`,
        description: `Maintain consistent check-ins to earn this badge!`,
        icon: 'award',
        color: theme.COLORS.primary.green,
        priority: 2,
        progress: Math.min(0.5, currentStreak / 21),
        action: () => {
          if (earnedBadgeIds.has(nextConsistencyBadge.id)) {
            showBadgeNotification(nextConsistencyBadge.name);
          }
        }
      });
    }
    
    // Journal recommendation
    if (journalCount < 5) {
      items.push({
        id: 'journal-start',
        title: 'Start Journaling',
        description: `Journal your thoughts daily to track your emotional growth and earn badges!`,
        icon: 'book',
        color: theme.COLORS.primary.purple,
        priority: 3,
        progress: Math.min(1, journalCount / 5)
      });
    } else if (journalCount < 20) {
      items.push({
        id: 'journal-continue',
        title: 'Keep Journaling',
        description: `You're doing great! Continue journaling regularly to earn the Journal Master badge.`,
        icon: 'book',
        color: theme.COLORS.primary.purple,
        priority: 3,
        progress: Math.min(1, journalCount / 20)
      });
    }
    
    // Mood tracking recommendation - only show if mood context is available
    if (userMoods.length > 0 && moodCount < 10) {
      items.push({
        id: 'mood-track',
        title: 'Track Your Moods',
        description: `Record your moods during check-ins to unlock mood pattern insights and badges!`,
        icon: 'face-smile',
        color: theme.COLORS.primary.teal,
        priority: 4,
        progress: Math.min(1, moodCount / 10)
      });
    } else if (userMoods.length > 0 && moodCount < 30) {
      items.push({
        id: 'mood-continue',
        title: 'Continue Mood Tracking',
        description: `Great job tracking your moods! Keep going to unlock the Emotional Awareness badge.`,
        icon: 'face-smile',
        color: theme.COLORS.primary.teal,
        priority: 4,
        progress: Math.min(1, moodCount / 30)
      });
    }
    
    // Basic check-in recommendation if no streak
    if (currentStreak === 0) {
      items.push({
        id: 'start-checkin',
        title: 'Start Your Daily Check-in',
        description: 'Complete your first check-in to begin your wellness journey and earn your first badge!',
        icon: 'check-circle',
        color: theme.COLORS.primary.blue,
        priority: 0,
        progress: 0
      });
    }
    
    // Sort by priority
    return items.sort((a, b) => a.priority - b.priority);
  }, [achievements, userAchievements, badges, userBadges, overallStreak, streaks, journalEntries.length, userMoods.length]);
  
  if (recommendations.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Typography variant="body" style={styles.emptyText} color={theme.COLORS.ui.textSecondary}>
          You're making great progress! Check back later for more recommendations.
        </Typography>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Typography variant="h2" style={styles.title} glow="medium">
        Recommendations for You
      </Typography>
      
      {nextStreakGoal && (
        <Card style={styles.recommendationCard} variant="glow">
          <View style={styles.iconContainer}>
            <FontAwesome6 name={getCompatibleIconName("trophy")} size={24} color={theme.COLORS.primary.orange} />
          </View>
          <View style={styles.textContainer}>
            <Typography variant="h3" style={styles.recommendationTitle} color={theme.COLORS.primary.orange}>
              {nextStreakGoal.name}
            </Typography>
            <Typography variant="body" style={styles.recommendationDescription}>
              Continue your daily check-ins for {(nextStreakGoal.requires_streak || 0) - (overallStreak || 0)} more 
              days to earn this achievement!
            </Typography>
            <View style={styles.progressBackground}>
              <ProgressBar 
                progress={(overallStreak || 0) / (nextStreakGoal.requires_streak || 1)} 
                color={theme.COLORS.primary.orange}
                style={styles.progressBar}
                height={6}
              />
            </View>
          </View>
        </Card>
      )}
      
      {!hasJournalingActivity && (
        <Card style={styles.recommendationCard} variant="default">
          <View style={styles.iconContainer}>
            <FontAwesome6 name={getCompatibleIconName("book")} size={24} color={theme.COLORS.primary.purple} />
          </View>
          <View style={styles.textContainer}>
            <Typography variant="h3" style={styles.recommendationTitle} color={theme.COLORS.primary.purple}>
              Start Journaling
            </Typography>
            <Typography variant="body" style={styles.recommendationDescription}>
              Journal your thoughts daily to track your emotional growth and earn badges!
            </Typography>
            <View style={styles.progressBackground}>
              <ProgressBar 
                progress={0} 
                color={theme.COLORS.primary.purple}
                style={styles.progressBar}
                height={6}
              />
            </View>
          </View>
        </Card>
      )}
      
      {!hasMoodTracking && (
        <Card style={styles.recommendationCard} variant="default">
          <View style={styles.iconContainer}>
            <FontAwesome6 name={getCompatibleIconName("face-smile")} size={24} color={theme.COLORS.primary.teal} />
          </View>
          <View style={styles.textContainer}>
            <Typography variant="h3" style={styles.recommendationTitle} color={theme.COLORS.primary.teal}>
              Track Your Moods
            </Typography>
            <Typography variant="body" style={styles.recommendationDescription}>
              Record your moods during check-ins to unlock mood insights and achievements!
            </Typography>
            <View style={styles.progressBackground}>
              <ProgressBar 
                progress={0} 
                color={theme.COLORS.primary.teal}
                style={styles.progressBar}
                height={6}
              />
            </View>
          </View>
        </Card>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    color: theme.COLORS.ui.text,
  },
  recommendationCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    backgroundColor: 'rgba(38, 20, 60, 0.85)',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 18,
    marginBottom: 4,
  },
  recommendationDescription: {
    fontSize: 14,
    marginBottom: 12,
    color: theme.COLORS.ui.textSecondary,
  },
  progressBackground: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    borderRadius: 3,
  },
  emptyContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
  },
}); 