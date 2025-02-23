import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
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

export const DailyChallenge: React.FC<DailyChallengeProps> = ({ onComplete }) => {
  const { dailyChallenge, userStats, completeChallenge, refreshDailyChallenge, userChallenges } = useChallenges();
  const { showError } = useAppState();
  const [completionText, setCompletionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localPoints, setLocalPoints] = useState(0);
  const [completedToday, setCompletedToday] = useState(0);
  const [showLimitMessage, setShowLimitMessage] = useState(false);
  const router = useRouter();

  // Add glow animation
  const glowAnim = React.useRef(new Animated.Value(0)).current;
  const rotateAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log('DailyChallenge state:', {
      hasDailyChallenge: !!dailyChallenge,
      dailyChallengeId: dailyChallenge?.id,
      completedToday,
      showLimitMessage,
      userChallengesCount: userChallenges.length
    });
    
    // Create a continuous pulsing animation
    const pulseGlow = () => {
      Animated.parallel([
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 3000,
            useNativeDriver: true,
          })
        ]),
        Animated.loop(
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 15000,
            useNativeDriver: true,
          })
        )
      ]).start(() => pulseGlow());
    };

    pulseGlow();
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
        <Animated.View style={[
          styles.glowEffect,
          {
            opacity: glowAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.3, 0.5, 0.3],
            }),
            transform: [
              {
                scale: glowAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [1, 1.1, 1],
                }),
              },
              {
                rotate: rotateAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          }
        ]}>
          <LinearGradient
            colors={[
              theme.COLORS.primary.green,
              theme.COLORS.primary.blue,
              theme.COLORS.primary.yellow,
              theme.COLORS.primary.green,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          />
        </Animated.View>
        <Card style={styles.container}>
          <View style={styles.limitContainer}>
            <View style={styles.limitHeader}>
              <Ionicons 
                name="checkmark-circle-outline" 
                size={48} 
                color={theme.COLORS.primary.green}
              />
              <Typography variant="h2" style={styles.limitTitle}>
                Daily Challenges Complete!
              </Typography>
            </View>
            <Typography variant="body" style={styles.limitMessage}>
              Great job! You've completed your daily challenges. Come back tomorrow for new challenges and more opportunities to earn points.
            </Typography>
            <View style={styles.statsContainer}>
              <View style={styles.pointsDisplay}>
                <Typography variant="h2" style={styles.pointsValue}>
                  {localPoints}
                </Typography>
                <Typography variant="body" style={styles.pointsLabel}>
                  Total Points
                </Typography>
              </View>
              {userStats?.current_streak && userStats.current_streak > 0 && (
                <View style={styles.streakDisplay}>
                  <Ionicons 
                    name="flame" 
                    size={24} 
                    color={theme.COLORS.primary.red}
                  />
                  <Typography variant="h3" style={styles.streakValue}>
                    {userStats.current_streak}
                  </Typography>
                  <Typography variant="caption" style={styles.streakLabel}>
                    Day Streak
                  </Typography>
                </View>
              )}
            </View>
            <Button
              title="View Your Achievements"
              onPress={() => router.push('/(app)/achievements')}
              variant="secondary"
              style={styles.achievementsButton}
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
      <Animated.View style={[
        styles.glowEffect,
        {
          opacity: glowAnim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0.3, 0.5, 0.3],
          }),
          transform: [
            {
              scale: glowAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [1, 1.1, 1],
              }),
            },
            {
              rotate: rotateAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }),
            },
          ],
        }
      ]}>
        <LinearGradient
          colors={[
            theme.COLORS.primary.green,
            theme.COLORS.primary.blue,
            theme.COLORS.primary.yellow,
            theme.COLORS.primary.green,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        />
      </Animated.View>
      <Card style={styles.container}>
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
          style={styles.description}
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
              color={theme.COLORS.primary.yellow}
            />
            <Typography 
              variant="caption" 
              style={[styles.points, { color: theme.COLORS.primary.yellow }]}
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
    position: 'relative',
    width: '100%',
    alignItems: 'center',
    marginVertical: theme.SPACING.lg,
    paddingHorizontal: theme.SPACING.lg,
  },
  glowEffect: {
    position: 'absolute',
    top: -50,
    left: -50,
    right: -50,
    bottom: -50,
    borderRadius: theme.BORDER_RADIUS.lg * 3,
    overflow: 'hidden',
    zIndex: -1,
  },
  gradient: {
    width: '200%',
    height: '200%',
    opacity: 0.6,
    position: 'absolute',
    top: '-50%',
    left: '-50%',
  },
  container: {
    width: '100%',
    padding: theme.SPACING.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.SPACING.md,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.SPACING.sm,
  },
  title: {
    marginLeft: theme.SPACING.xs,
  },
  challengeStats: {
    alignItems: 'flex-end',
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
    gap: 8,
  },
  points: {
    marginLeft: theme.SPACING.xs,
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
  },
  limitContainer: {
    padding: theme.SPACING.lg,
    alignItems: 'center',
  },
  limitHeader: {
    alignItems: 'center',
    marginBottom: theme.SPACING.xl,
  },
  limitTitle: {
    textAlign: 'center',
    color: theme.COLORS.primary.green,
    marginTop: theme.SPACING.md,
    fontSize: theme.FONTS.sizes.xxl,
  },
  limitMessage: {
    textAlign: 'center',
    color: theme.COLORS.ui.textSecondary,
    marginBottom: theme.SPACING.xl,
    lineHeight: 24,
    paddingHorizontal: theme.SPACING.md,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    marginBottom: theme.SPACING.xl,
  },
  pointsDisplay: {
    alignItems: 'center',
    flex: 1,
  },
  pointsValue: {
    color: theme.COLORS.primary.green,
    fontSize: theme.FONTS.sizes.xxxl,
    fontWeight: theme.FONTS.weights.bold,
  },
  pointsLabel: {
    color: theme.COLORS.ui.textSecondary,
    marginTop: theme.SPACING.xs,
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
}); 