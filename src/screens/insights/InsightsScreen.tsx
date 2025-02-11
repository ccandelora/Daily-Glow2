import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Typography, Card, AnimatedMoodIcon } from '@/components/common';
import { useJournal } from '@/contexts/JournalContext';
import theme from '@/constants/theme';

const DAYS_IN_WEEK = 7;
const screenWidth = Dimensions.get('window').width;

export const InsightsScreen = () => {
  const { entries } = useJournal();

  const stats = useMemo(() => {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - DAYS_IN_WEEK * 24 * 60 * 60 * 1000);
    const recentEntries = entries.filter(entry => entry.date >= lastWeek);

    // Calculate mood distribution
    const moodCounts = entries.reduce((acc, entry) => {
      acc[entry.mood] = (acc[entry.mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate streak
    let currentStreak = 0;
    let date = new Date();
    while (true) {
      const entry = entries.find(e => e.date.toDateString() === date.toDateString());
      if (!entry) break;
      currentStreak++;
      date.setDate(date.getDate() - 1);
    }

    // Calculate completion rate
    const completionRate = (recentEntries.length / DAYS_IN_WEEK) * 100;

    return {
      moodCounts,
      currentStreak,
      completionRate: Math.round(completionRate),
      totalEntries: entries.length,
    };
  }, [entries]);

  const renderMoodDistribution = () => {
    const total = Object.values(stats.moodCounts).reduce((a, b) => a + b, 0);
    if (total === 0) return null;

    return (
      <View style={styles.moodDistribution}>
        {['great', 'good', 'okay', 'bad'].map(mood => {
          const count = stats.moodCounts[mood] || 0;
          const percentage = Math.round((count / total) * 100);
          const width = Math.max((percentage / 100) * (screenWidth - theme.SPACING.lg * 4), 30);

          return (
            <View key={mood} style={styles.moodRow}>
              <View style={styles.moodLabel}>
                <AnimatedMoodIcon
                  color={theme.COLORS.primary[
                    mood === 'great' ? 'green' :
                    mood === 'good' ? 'blue' :
                    mood === 'okay' ? 'yellow' : 'red'
                  ]}
                  size={24}
                >
                  <Typography>
                    {mood === 'great' ? '😊' :
                     mood === 'good' ? '🙂' :
                     mood === 'okay' ? '😐' : '😕'}
                  </Typography>
                </AnimatedMoodIcon>
                <Typography style={styles.moodText}>
                  {mood.charAt(0).toUpperCase() + mood.slice(1)}
                </Typography>
              </View>
              <View style={styles.percentageBar}>
                <View
                  style={[
                    styles.percentageFill,
                    {
                      width,
                      backgroundColor: theme.COLORS.primary[
                        mood === 'great' ? 'green' :
                        mood === 'good' ? 'blue' :
                        mood === 'okay' ? 'yellow' : 'red'
                      ],
                    },
                  ]}
                />
                <Typography style={styles.percentageText}>
                  {percentage}%
                </Typography>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Typography variant="h1" style={styles.title}>
          Insights
        </Typography>
      </View>

      <View style={styles.content}>
        <View style={styles.statsRow}>
          <Card style={styles.statsCard}>
            <Typography variant="h1" style={styles.statNumber}>
              {stats.currentStreak}
            </Typography>
            <Typography variant="body" color={theme.COLORS.ui.textSecondary}>
              Day Streak
            </Typography>
          </Card>
          <Card style={styles.statsCard}>
            <Typography variant="h1" style={styles.statNumber}>
              {stats.completionRate}%
            </Typography>
            <Typography variant="body" color={theme.COLORS.ui.textSecondary}>
              Weekly Rate
            </Typography>
          </Card>
        </View>

        <Card style={styles.moodCard}>
          <Typography variant="h3" style={styles.cardTitle}>
            Mood Distribution
          </Typography>
          {renderMoodDistribution()}
        </Card>

        <Card style={styles.insightsCard}>
          <Typography variant="h3" style={styles.cardTitle}>
            Your Journey
          </Typography>
          <Typography variant="body" color={theme.COLORS.ui.textSecondary}>
            {stats.totalEntries === 0 ? (
              "Start your journey by completing your first check-in!"
            ) : (
              `You've logged ${stats.totalEntries} entries so far. Keep going! Regular check-ins help build self-awareness and emotional intelligence.`
            )}
          </Typography>
        </Card>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.ui.background,
  },
  header: {
    padding: theme.SPACING.lg,
  },
  title: {
    marginBottom: theme.SPACING.md,
  },
  content: {
    padding: theme.SPACING.lg,
    paddingTop: 0,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: theme.SPACING.lg,
  },
  statsCard: {
    flex: 1,
    alignItems: 'center' as const,
    padding: theme.SPACING.lg,
    marginHorizontal: theme.SPACING.md,
  },
  streakCard: {
    marginLeft: 0,
  },
  completionCard: {
    marginRight: 0,
  },
  statNumber: {
    marginBottom: theme.SPACING.xs,
  },
  moodCard: {
    marginBottom: theme.SPACING.lg,
    padding: theme.SPACING.lg,
  },
  cardTitle: {
    marginBottom: theme.SPACING.lg,
  },
  moodDistribution: {
    marginTop: theme.SPACING.md,
  },
  moodRow: {
    marginBottom: theme.SPACING.md,
  },
  moodLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.SPACING.xs,
  },
  moodText: {
    marginLeft: theme.SPACING.sm,
  },
  percentageBar: {
    height: 24,
    backgroundColor: theme.COLORS.ui.card,
    borderRadius: theme.BORDER_RADIUS.sm,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  percentageFill: {
    height: '100%',
    borderRadius: theme.BORDER_RADIUS.sm,
  },
  percentageText: {
    position: 'absolute',
    right: theme.SPACING.sm,
    color: theme.COLORS.ui.text,
  },
  insightsCard: {
    padding: theme.SPACING.lg,
  },
}); 