import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography, Card, Button, AnimatedMoodIcon, DailyChallenge, VideoBackground, Header } from '@/components/common';
import { useJournal } from '@/contexts/JournalContext';
import theme, { TIME_PERIODS } from '@/constants/theme';
import { getEmotionById } from '@/constants/emotions';
import { getCurrentTimePeriod } from '@/utils/dateTime';
import { LinearGradient } from 'expo-linear-gradient';

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

export default function HomeScreen() {
  const router = useRouter();
  const { getRecentEntries, getLatestEntryForPeriod } = useJournal();
  const currentPeriod = getCurrentTimePeriod();
  const periodDetails = TIME_PERIODS[currentPeriod];
  const todayEntry = getLatestEntryForPeriod(currentPeriod);
  const recentEntries = getRecentEntries(3);

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const rotateAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log('HomeScreen mounted - starting animations');
    
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
            duration: 30000, // 30 seconds per rotation
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
  }, []);

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
        </Card>

        <Card style={styles.challengeCard} variant="glow">
          <View style={styles.challengeHeader}>
            <Typography variant="h2" style={styles.cardTitle} glow="medium">
              Daily Challenge
            </Typography>
            <Typography variant="body" style={styles.points}>
              Level 2 • 125 pts
            </Typography>
          </View>
          <Typography variant="body" style={styles.cardDescription}>
            Create a short story about your emotional journey today
          </Typography>
        </Card>

        <Animated.View style={{ opacity: fadeAnim }}>
          {todayEntry ? (
            <Card variant="elevated" style={styles.checkInCard}>
              <Typography variant="h2" style={styles.cardTitle}>
                {periodDetails.label} Check-in
              </Typography>
              <View style={styles.todayMood}>
                <View style={[styles.moodIconContainer, { backgroundColor: getEmotionDisplay(todayEntry).color }]}>
                  <Typography style={styles.moodIcon}>
                    {getEmotionEmoji(todayEntry)}
                  </Typography>
                </View>
                <View style={styles.todayMoodText}>
                  <Typography 
                    variant="h3" 
                    color={getEmotionDisplay(todayEntry).color}
                  >
                    {getEmotionDisplay(todayEntry).label}
                  </Typography>
                  <Typography 
                    variant="body" 
                    style={styles.gratitudePreview}
                  >
                    {todayEntry.gratitude.length > 50 
                      ? todayEntry.gratitude.substring(0, 50) + '...'
                      : todayEntry.gratitude}
                  </Typography>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.viewEntryButton}
                onPress={() => router.push(`/(app)/journal/${todayEntry.id}`)}
              >
                <Typography style={styles.viewEntryText}>
                  View full entry →
                </Typography>
              </TouchableOpacity>
            </Card>
          ) : (
            <Card variant="elevated" style={styles.checkInCard}>
              <Typography variant="h2" style={styles.cardTitle}>
                {periodDetails.label} Check-in
              </Typography>
              <Typography 
                variant="body" 
                style={styles.cardSubtitle}
              >
                Take a moment to reflect on how you're feeling
              </Typography>
              <TouchableOpacity 
                style={styles.startCheckInButton}
                onPress={() => router.push('/(app)/check-in')}
              >
                <View style={styles.startCheckInContent}>
                  <Typography style={styles.startCheckInText}>
                    Start {periodDetails.label.toLowerCase()} check-in
                  </Typography>
                  <Typography style={styles.startCheckInEmoji}>
                    ✨
                  </Typography>
                </View>
              </TouchableOpacity>
            </Card>
          )}
          <DailyChallenge style={styles.challengeCard} />
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim }}>
          <Card style={styles.recentEntriesCard}>
            <View style={styles.cardHeader}>
              <Typography variant="h3">Recent Entries</Typography>
              <Button
                title="View All"
                variant="secondary"
                onPress={() => router.push('/(app)/journal')}
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
                      <Typography variant="body" color={getEmotionDisplay(entry).color}>
                        {getEmotionDisplay(entry).label}
                      </Typography>
                      <Typography variant="caption" color={theme.COLORS.ui.textSecondary}>
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
                  >
                    {entry.gratitude.length > 30 
                      ? entry.gratitude.substring(0, 30) + '...'
                      : entry.gratitude}
                  </Typography>
                </TouchableOpacity>
              ))
            ) : (
              <Typography variant="body" color={theme.COLORS.ui.textSecondary}>
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
  },
  greetingSection: {
    paddingHorizontal: theme.SPACING.lg,
    marginBottom: theme.SPACING.xl,
  },
  greeting: {
    marginBottom: theme.SPACING.xs,
    textAlign: 'center',
  },
  dateText: {
    textAlign: 'center',
    fontSize: theme.FONTS.sizes.lg,
  },
  checkInCard: {
    marginHorizontal: theme.SPACING.lg,
    marginBottom: theme.SPACING.lg,
    padding: theme.SPACING.xl,
  },
  challengeCard: {
    marginHorizontal: theme.SPACING.lg,
    padding: theme.SPACING.xl,
  },
  cardTitle: {
    marginBottom: theme.SPACING.md,
    textAlign: 'left',
  },
  cardDescription: {
    marginBottom: theme.SPACING.lg,
    color: theme.COLORS.ui.textSecondary,
  },
  checkInButton: {
    marginTop: theme.SPACING.md,
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
    padding: theme.SPACING.lg,
    backgroundColor: theme.COLORS.ui.background,
    borderRadius: theme.BORDER_RADIUS.lg,
    shadowColor: theme.COLORS.ui.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: `${theme.COLORS.ui.border}30`,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.SPACING.lg,
  },
  entryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: `${theme.COLORS.ui.border}20`,
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
    backgroundColor: `${theme.COLORS.primary.green}10`,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: theme.SPACING.md,
  },
  entryPreview: {
    flex: 1,
    marginLeft: theme.SPACING.md,
    color: theme.COLORS.ui.textSecondary,
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
}); 