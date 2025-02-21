import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography } from './Typography';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { useChallenges } from '@/contexts/ChallengesContext';
import { useAppState } from '@/contexts/AppStateContext';
import theme from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface DailyChallengeProps {
  onComplete?: () => void;
  style?: StyleProp<ViewStyle>;
}

const typeIcons = {
  mood: 'heart-outline',
  gratitude: 'happy-outline',
  mindfulness: 'leaf-outline',
  creative: 'brush-outline',
} as const;

const getPromptForType = (type: string) => {
  switch (type) {
    case 'mood':
      return 'Describe your current mood and feelings...';
    case 'gratitude':
      return 'Share what you\'re grateful for today...';
    case 'mindfulness':
      return 'Describe your mindfulness experience...';
    case 'creative':
      return 'Share your creative response...';
    default:
      return 'Share your thoughts...';
  }
};

const getMinLengthForType = (type: string) => {
  return type === 'creative' ? 20 : 10;
};

export const DailyChallenge: React.FC<DailyChallengeProps> = ({ onComplete, style }) => {
  const { dailyChallenge, userStats, completeChallenge, refreshDailyChallenge, userChallenges } = useChallenges();
  const { showError } = useAppState();
  const [completionText, setCompletionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localPoints, setLocalPoints] = useState(0);
  const [completedToday, setCompletedToday] = useState(0);
  const [showLimitMessage, setShowLimitMessage] = useState(false);
  const router = useRouter();

  useEffect(() => {
    console.log('DailyChallenge state:', {
      hasDailyChallenge: !!dailyChallenge,
      dailyChallengeId: dailyChallenge?.id,
      completedToday,
      showLimitMessage,
      userChallengesCount: userChallenges.length
    });
  }, []);

  useEffect(() => {
    if (userStats?.total_points !== undefined) {
      setLocalPoints(userStats.total_points);
      
      // Count completed challenges for today using local timezone
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of day in local timezone
      
      const completedCount = userChallenges.filter(challenge => {
        if (!challenge.completed_at) return false;
        
        // Convert UTC timestamp to local date for comparison
        const completionDate = new Date(challenge.completed_at);
        const localCompletionDate = new Date(
          completionDate.getFullYear(),
          completionDate.getMonth(),
          completionDate.getDate()
        );
        
        const isCompleted = challenge.status === 'completed';
        const isToday = localCompletionDate.getTime() === today.getTime();
        
        return isCompleted && isToday;
      }).length;
      
      setCompletedToday(completedCount);
      setShowLimitMessage(completedCount >= 2);
    }
  }, [userStats, userChallenges]);

  // Single useEffect for refresh logic
  useEffect(() => {
    const setupMidnightRefresh = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const timeUntilMidnight = tomorrow.getTime() - now.getTime();
      
      // Only refresh if we don't have a challenge
      if (!dailyChallenge) {
        refreshDailyChallenge();
      }
      
      return setTimeout(() => {
        refreshDailyChallenge();
        setupMidnightRefresh();
      }, timeUntilMidnight);
    };

    const timer = setupMidnightRefresh();
    return () => clearTimeout(timer);
  }, [dailyChallenge]); // Only re-run if dailyChallenge changes

  if (showLimitMessage) {
    return (
      <View style={styles.glowContainer}>
        <Card style={styles.container}>
          <View style={styles.completionContent}>
            <Ionicons 
              name="checkmark-circle-outline" 
              size={48} 
              color={theme.COLORS.primary.green}
              style={styles.completionIcon}
            />
            <Typography variant="h2" style={styles.completionTitle}>
              Daily Challenges Complete!
            </Typography>
            <Typography style={styles.completionMessage}>
              Great job! You've completed your daily challenges. Come back tomorrow for new challenges and more opportunities to earn points.
            </Typography>
            <View style={styles.completionPoints}>
              <Typography variant="h1" style={styles.completionPointsValue}>
                {localPoints}
              </Typography>
              <Typography style={styles.completionPointsLabel}>
                Total Points
              </Typography>
            </View>
            <Button
              title="View Your Achievements"
              onPress={() => router.push('/(app)/achievements')}
              variant="secondary"
              style={styles.completionButton}
            />
          </View>
        </Card>
      </View>
    );
  }

  if (!dailyChallenge) {
    return (
      <View style={styles.glowContainer}>
        <Card style={styles.container}>
          <Typography variant="body" style={styles.limitMessage}>
            No challenges available right now. Please check back later.
          </Typography>
        </Card>
      </View>
    );
  }

  const handleComplete = async () => {
    if (completedToday >= 2) {
      setShowLimitMessage(true);
      return;
    }

    try {
      setIsSubmitting(true);
      
      const minLength = getMinLengthForType(dailyChallenge.type);
      if (!completionText.trim() || completionText.length < minLength) {
        showError(`Please provide a response with at least ${minLength} characters`);
        return;
      }

      await completeChallenge(dailyChallenge.id, completionText.trim());
      await refreshDailyChallenge();
      setCompletionText('');
      onComplete?.();
    } catch (error) {
      if (error instanceof Error && error.message.includes('Daily challenge limit reached')) {
        setShowLimitMessage(true);
      } else {
        showError(error instanceof Error ? error.message : 'Failed to complete challenge');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStreak = userStats?.current_streak ?? 0;
  const level = userStats?.level ?? 1;

  return (
    <View style={styles.glowContainer}>
      <Card style={[styles.container, style]}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Ionicons 
              name={typeIcons[dailyChallenge.type as keyof typeof typeIcons]} 
              size={24} 
              color={theme.COLORS.primary.green}
            />
            <Typography variant="h3" style={styles.title}>
              Daily Challenge
            </Typography>
          </View>
          <View style={styles.challengeStats}>
            <Typography variant="caption" color={theme.COLORS.ui.textSecondary}>
              Level {level}
            </Typography>
            <Typography 
              variant="h3" 
              color={theme.COLORS.primary.green}
              style={styles.pointsText}
            >
              {localPoints} pts
            </Typography>
          </View>
        </View>

        <Typography variant="h3" style={styles.challengeTitle}>
          {dailyChallenge.title}
        </Typography>
        
        <Typography 
          variant="body" 
          style={{ color: theme.COLORS.ui.textSecondary }}
        >
          {dailyChallenge.description}
        </Typography>

        <Input
          multiline
          value={completionText}
          onChangeText={setCompletionText}
          placeholder={getPromptForType(dailyChallenge.type)}
          style={styles.input}
          maxLength={500}
        />

        <View style={styles.footer}>
          <View style={styles.pointsContainer}>
            <Ionicons 
              name="star-outline" 
              size={16} 
              color={theme.COLORS.primary.green}
            />
            <Typography 
              variant="body"
              style={styles.points}
              color={theme.COLORS.primary.green}
            >
              {dailyChallenge.points} points
            </Typography>
          </View>
          <Button
            title="Complete Challenge"
            onPress={handleComplete}
            style={styles.button}
            disabled={isSubmitting}
          />
        </View>

        {currentStreak > 0 && (
          <View style={styles.streakContainer}>
            <Ionicons 
              name="flame-outline" 
              size={16} 
              color={theme.COLORS.primary.red}
            />
            <Typography 
              variant="caption" 
              style={{ color: theme.COLORS.primary.red }}
            >
              {currentStreak} day streak!
            </Typography>
          </View>
        )}
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  glowContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: theme.SPACING.lg,
    paddingHorizontal: theme.SPACING.lg,
  },
  container: {
    width: '100%',
    padding: theme.SPACING.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.SPACING.md,
    width: '100%',
    flexWrap: 'wrap',
    gap: theme.SPACING.md,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.SPACING.sm,
    flex: 1,
    minWidth: 150,
  },
  title: {
    marginLeft: theme.SPACING.xs,
    flexShrink: 1,
  },
  challengeStats: {
    alignItems: 'flex-end',
    minWidth: 100,
    flexShrink: 0,
  },
  challengeTitle: {
    marginBottom: theme.SPACING.sm,
  },
  description: {
    marginBottom: theme.SPACING.lg,
  },
  input: {
    height: 120,
    marginBottom: theme.SPACING.lg,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.SPACING.xs,
  },
  points: {
    fontWeight: theme.FONTS.weights.semibold,
    fontSize: theme.FONTS.sizes.md,
  },
  button: {
    flex: 1,
    marginLeft: theme.SPACING.md,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.SPACING.md,
    paddingTop: theme.SPACING.md,
    borderTopWidth: 1,
    borderTopColor: theme.COLORS.ui.border,
  },
  pointsText: {
    fontWeight: theme.FONTS.weights.bold,
    color: theme.COLORS.primary.green,
    marginTop: theme.SPACING.xs,
    textAlign: 'right',
    minWidth: 100,
    flexWrap: 'wrap',
    flexShrink: 0,
  },
  limitContainer: {
    padding: theme.SPACING.lg,
    alignItems: 'center',
    width: '100%',
  },
  limitHeader: {
    alignItems: 'center',
    marginBottom: theme.SPACING.xl,
    width: '100%',
  },
  limitTitle: {
    textAlign: 'center',
    color: theme.COLORS.primary.green,
    marginTop: theme.SPACING.md,
    fontSize: theme.FONTS.sizes.xxl,
    paddingHorizontal: theme.SPACING.md,
    width: '100%',
    flexWrap: 'wrap',
  },
  limitMessage: {
    textAlign: 'center',
    color: theme.COLORS.ui.textSecondary,
    marginBottom: theme.SPACING.xl,
    lineHeight: 24,
    paddingHorizontal: theme.SPACING.lg,
    width: '100%',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: theme.SPACING.xl,
    paddingHorizontal: theme.SPACING.lg,
  },
  pointsDisplay: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: theme.SPACING.lg,
    width: '100%',
    maxWidth: 200,
  },
  pointsValue: {
    color: theme.COLORS.primary.green,
    fontSize: theme.FONTS.sizes.xxxl,
    fontWeight: theme.FONTS.weights.bold,
    textAlign: 'center',
    width: '100%',
    flexShrink: 0,
    minWidth: 150,
    paddingHorizontal: theme.SPACING.md,
  },
  pointsLabel: {
    color: theme.COLORS.ui.textSecondary,
    marginTop: theme.SPACING.xs,
    textAlign: 'center',
    width: '100%',
  },
  streakDisplay: {
    alignItems: 'center',
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: theme.COLORS.ui.border,
    paddingLeft: theme.SPACING.lg,
  },
  streakValue: {
    color: theme.COLORS.primary.red,
    marginTop: theme.SPACING.xs,
    fontSize: theme.FONTS.sizes.xxl,
    fontWeight: theme.FONTS.weights.bold,
  },
  streakLabel: {
    color: theme.COLORS.ui.textSecondary,
  },
  achievementsButton: {
    marginTop: 0,
    paddingVertical: theme.SPACING.md,
    width: '100%',
  },
  completionContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: theme.BORDER_RADIUS.lg,
  },
  completionContent: {
    padding: theme.SPACING.xl,
    alignItems: 'center',
    paddingVertical: theme.SPACING.xl * 1.5,
  },
  completionIcon: {
    marginBottom: theme.SPACING.lg,
  },
  completionTitle: {
    color: theme.COLORS.primary.green,
    fontSize: 28,
    fontWeight: theme.FONTS.weights.semibold,
    textAlign: 'center',
    marginBottom: theme.SPACING.md,
  },
  completionMessage: {
    color: theme.COLORS.ui.textSecondary,
    textAlign: 'center',
    marginBottom: theme.SPACING.xl * 1.5,
    lineHeight: 24,
    fontSize: theme.FONTS.sizes.md,
  },
  completionPoints: {
    alignItems: 'center',
    marginBottom: theme.SPACING.xl * 1.5,
  },
  completionPointsValue: {
    color: theme.COLORS.primary.green,
    fontSize: 72,
    fontWeight: theme.FONTS.weights.bold,
    textAlign: 'center',
    marginBottom: theme.SPACING.xs,
    lineHeight: 80,
  },
  completionPointsLabel: {
    color: theme.COLORS.ui.textSecondary,
    textAlign: 'center',
    fontSize: theme.FONTS.sizes.lg,
  },
  completionButton: {
    width: '100%',
    paddingVertical: theme.SPACING.md,
    marginTop: theme.SPACING.md,
  },
}); 