import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography, Card, Button, AnimatedMoodIcon, DailyChallenge, VideoBackground, Header } from '@/components/common';
import { useJournal } from '@/contexts/JournalContext';
import theme, { TIME_PERIODS } from '@/constants/theme';
import { getEmotionById } from '@/constants/emotions';
import { getCurrentTimePeriod, TimePeriod } from '@/utils/dateTime';
import { LinearGradient } from 'expo-linear-gradient';
import { StreakSummary } from '@/components/home/StreakSummary';
import { RecentBadges } from '@/components/home/RecentBadges';

const getEmotionDisplay = (entry: any) => {
  const emotion = entry.initial_emotion ? getEmotionById(entry.initial_emotion) : null;
  
  if (emotion) {
    return {
      label: emotion.label,
      color: emotion.color
    };
  }
  
  // Fallback for old data
  return {
    label: 'Neutral',
    color: theme.COLORS.ui.textSecondary
  };
};

const getEmotionEmoji = (entry: any) => {
  if (entry.initial_emotion) {
    const emotion = getEmotionById(entry.initial_emotion);
    if (emotion) {
      switch (emotion.id) {
        case 'happy': return '😊';
        case 'sad': return '😢';
        case 'angry': return '😠';
        case 'scared': return '😨';
        case 'optimistic': return '🌟';
        case 'peaceful': return '😌';
        case 'powerful': return '💪';
        case 'proud': return '🦁';
        default: return '😐';
      }
    }
  }
  return '😐';
};

const formatTime = (hour: number) => {
  const period = hour >= 12 ? 'PM' : 'AM';
  const standardHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${standardHour}:00 ${period}`;
};

export default function HomeScreen() {
  const router = useRouter();
  const { getRecentEntries, getLatestEntryForPeriod, getTodayEntries } = useJournal();
  const currentPeriod = getCurrentTimePeriod();
  const periodDetails = TIME_PERIODS[currentPeriod];
  const todayEntry = getLatestEntryForPeriod(currentPeriod);
  const recentEntries = getRecentEntries(3);
  const [nextPeriod, setNextPeriod] = React.useState<TimePeriod | null>(null);

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const rotateAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkNextPeriod();
    
    // Fade in content
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Continuous rotation
    const startRotation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 30000,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          })
        ])
      ).start();
    };

    startRotation();
  }, [todayEntry]);

  const checkNextPeriod = () => {
    const todayEntries = getTodayEntries();
    const completedPeriods = new Set(todayEntries.map(entry => entry.time_period));

    if (todayEntry) {
      if (currentPeriod === 'EVENING' && completedPeriods.has('EVENING')) {
        // After evening check-in, next check-in is tomorrow morning
        setNextPeriod('MORNING');
      } else if (currentPeriod === 'MORNING' && !completedPeriods.has('AFTERNOON')) {
        setNextPeriod('AFTERNOON');
      } else if (!completedPeriods.has('EVENING')) {
        setNextPeriod('EVENING');
      } else {
        // All periods completed for today
        setNextPeriod(null);
      }
    } else {
      // If we haven't completed the current period, it's the next one
      setNextPeriod(currentPeriod);
    }
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <View style={styles.container}>
      <VideoBackground />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        <Header showBranding={true} />
        
        <View style={styles.greetingSection}>
          <Typography 
            variant="h2" 
            style={styles.greeting}
            glow="medium"
          >
            {periodDetails.greeting}
          </Typography>
          <Typography 
            variant="body" 
            style={styles.dateText}
            color={theme.COLORS.ui.textSecondary}
            glow="soft"
          >
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            })}
          </Typography>
        </View>

        <Card style={styles.checkInCard} variant="glow">
          {todayEntry ? (
            <>
              <Typography variant="h2" style={styles.cardTitle} glow="medium">
                Check-in Complete
              </Typography>
              <Typography variant="body" style={styles.cardDescription}>
                {nextPeriod ? (
                  nextPeriod === 'MORNING' ? 
                  `You've completed your ${periodDetails.label.toLowerCase()} check-in. Come back tomorrow morning between ${formatTime(TIME_PERIODS.MORNING.range.start)} - ${formatTime(TIME_PERIODS.MORNING.range.end)} for your next check-in!` :
                  `You've completed your ${periodDetails.label.toLowerCase()} check-in. Your next check-in will be available between ${formatTime(TIME_PERIODS[nextPeriod].range.start)} - ${formatTime(TIME_PERIODS[nextPeriod].range.end)}.`
                ) : (
                  `You've completed all check-ins for today. Come back tomorrow morning at ${formatTime(TIME_PERIODS.MORNING.range.start)}!`
                )}
              </Typography>
              {nextPeriod && (
                <Typography 
                  variant="body" 
                  style={StyleSheet.flatten([
                    styles.cardDescription, 
                    { color: theme.COLORS.primary.green }
                  ])}
                  glow="medium"
                >
                  Next check-in: {TIME_PERIODS[nextPeriod].label}
                </Typography>
              )}
            </>
          ) : (
            <>
              <Typography variant="h2" style={styles.cardTitle} glow="medium">
                {`${periodDetails.label} Check-in`}
              </Typography>
              <Typography variant="body" style={styles.cardDescription}>
                Take a moment to reflect on how you're feeling
              </Typography>
              <Button
                title={`Start ${periodDetails.label.toLowerCase()} check-in ✨`}
                onPress={() => router.push('/check-in')}
                variant="primary"
                style={styles.checkInButton}
              />
            </>
          )}
        </Card>

        <Card 
          style={StyleSheet.flatten([styles.checkInCard, styles.challengeCard])} 
          variant="glow"
        >
          <DailyChallenge />
        </Card>

        <StreakSummary />
        
        <RecentBadges />

        <Animated.View style={{ opacity: fadeAnim }}>
          <Card 
            style={styles.recentEntriesCard} 
            variant="glow"
          >
            <View>
              <Typography variant="h2" style={styles.cardTitle} glow="medium">
                Recent Entries
              </Typography>
              <Button
                title="View All"
                variant="secondary"
                onPress={() => router.push('/(app)/journal')}
                style={styles.viewAllButton}
                textStyle={{ color: theme.COLORS.primary.green }}
              />
            </View>
            {recentEntries.length > 0 ? (
              recentEntries.map(entry => (
                <TouchableOpacity 
                  key={entry.id} 
                  style={styles.entryItem}
                  onPress={() => router.push(`/(app)/journal/${entry.id}`)}
                >
                  <View style={styles.entryItemLeft}>
                    <Typography style={styles.entryIcon}>
                      {getEmotionEmoji(entry)}
                    </Typography>
                    <View>
                      <Typography 
                        variant="body" 
                        color={getEmotionDisplay(entry).color}
                        glow="soft"
                      >
                        {getEmotionDisplay(entry).label}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        color={theme.COLORS.ui.textSecondary}
                        glow="soft"
                      >
                        {entry.date.toLocaleDateString('en-US', { 
                          month: 'short',
                          day: 'numeric'
                        })}
                      </Typography>
                    </View>
                  </View>
                  <Typography 
                    variant="body" 
                    color={theme.COLORS.ui.textSecondary}
                    style={styles.entryPreview}
                    glow="soft"
                  >
                    {entry.gratitude.length > 30 
                      ? entry.gratitude.substring(0, 30) + '...'
                      : entry.gratitude}
                  </Typography>
                </TouchableOpacity>
              ))
            ) : (
              <Typography 
                variant="body" 
                color={theme.COLORS.ui.textSecondary}
                glow="soft"
              >
                No entries yet. Start your journey by doing a check-in.
              </Typography>
            )}
          </Card>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.ui.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: theme.SPACING.xl,
    paddingTop: 0,
    marginTop: -20,
  },
  greetingSection: {
    paddingHorizontal: theme.SPACING.lg,
    marginBottom: theme.SPACING.md,
    marginTop: -25,
  },
  greeting: {
    marginBottom: 0,
    textAlign: 'center',
  },
  dateText: {
    textAlign: 'center',
    fontSize: theme.FONTS.sizes.lg,
    marginBottom: theme.SPACING.sm,
  },
  checkInCard: {
    marginHorizontal: theme.SPACING.lg,
    marginBottom: theme.SPACING.md,
    marginTop: theme.SPACING.sm,
    padding: theme.SPACING.lg,
    backgroundColor: 'rgba(38, 20, 60, 0.85)',
  },
  challengeCard: {
    marginTop: theme.SPACING.md,
  },
  cardTitle: {
    marginBottom: theme.SPACING.sm,
    textAlign: 'left',
    color: theme.COLORS.ui.text,
    fontSize: theme.FONTS.sizes.xl,
  },
  cardDescription: {
    marginBottom: theme.SPACING.md,
    color: theme.COLORS.ui.textSecondary,
    fontSize: theme.FONTS.sizes.md,
  },
  checkInButton: {
    marginTop: theme.SPACING.md,
    backgroundColor: theme.COLORS.ui.accent,
    shadowColor: theme.COLORS.ui.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.SPACING.md,
  },
  points: {
    color: theme.COLORS.primary.green,
  },
  recentEntriesCard: {
    margin: theme.SPACING.lg,
    marginTop: theme.SPACING.md,
    padding: theme.SPACING.xl,
    backgroundColor: 'rgba(38, 20, 60, 0.85)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.SPACING.lg,
  },
  viewAllButton: {
    backgroundColor: 'rgba(65, 105, 225, 0.1)',
    borderColor: theme.COLORS.ui.accent,
    borderWidth: 1,
    width: '100%',
    marginBottom: theme.SPACING.lg,
    marginTop: theme.SPACING.md,
    shadowColor: theme.COLORS.ui.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  entryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: `${theme.COLORS.ui.border}30`,
    marginBottom: theme.SPACING.sm,
  },
  entryItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  entryIcon: {
    fontSize: 24,
    width: 40,
    height: 40,
    textAlign: 'center',
    lineHeight: 40,
    backgroundColor: `${theme.COLORS.primary.green}20`,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: theme.SPACING.md,
  },
  entryPreview: {
    flex: 1,
    marginLeft: theme.SPACING.md,
    fontSize: 14,
  },
  gratitudePreview: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: theme.SPACING.xs,
    color: theme.COLORS.ui.textSecondary,
  },
  viewEntryButton: {
    marginTop: theme.SPACING.md,
    paddingVertical: theme.SPACING.sm,
    alignItems: 'center',
  },
  viewEntryText: {
    color: theme.COLORS.primary.green,
    fontSize: 16,
    fontWeight: theme.FONTS.weights.medium,
  },
  startCheckInButton: {
    backgroundColor: theme.COLORS.primary.green,
    padding: theme.SPACING.lg,
    borderRadius: theme.BORDER_RADIUS.lg,
    marginTop: theme.SPACING.md,
  },
  startCheckInContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.SPACING.sm,
  },
  startCheckInText: {
    color: theme.COLORS.ui.background,
    fontSize: 16,
    fontWeight: theme.FONTS.weights.medium,
  },
  startCheckInEmoji: {
    fontSize: 20,
  },
  todayMood: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.SPACING.md,
  },
  moodIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: theme.SPACING.md,
  },
  moodIcon: {
    fontSize: 24,
    textAlign: 'center',
    lineHeight: 40,
  },
  todayMoodText: {
    flex: 1,
  },
  cardSubtitle: {
    marginBottom: theme.SPACING.md,
    color: theme.COLORS.ui.textSecondary,
  },
  pointsText: {
    marginBottom: theme.SPACING.md,
  },
  completeButton: {
    marginTop: theme.SPACING.md,
    marginBottom: theme.SPACING.lg,
  },
}); 