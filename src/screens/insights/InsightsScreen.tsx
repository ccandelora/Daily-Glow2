import React, { useMemo, useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, ActivityIndicator, ViewStyle, TouchableOpacity } from 'react-native';
import { Typography, Card, AnimatedMoodIcon, Button, AnimatedBackground, Header, VideoBackground } from '@/components/common';
import { useJournal } from '@/contexts/JournalContext';
import { useAppState } from '@/contexts/AppStateContext';
import theme from '@/constants/theme';
import { getEmotionById, primaryEmotions } from '@/constants/emotions';
import { generateInsights } from '@/utils/ai';

const DAYS_IN_WEEK = 7;
const screenWidth = Dimensions.get('window').width;

interface EmotionStats {
  id: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

type TimeFilter = 'week' | 'month' | 'all';

interface EmotionCategory {
  id: string;
  label: string;
  color: string;
  emotions: EmotionStats[];
  totalCount: number;
  percentage: number;
}

const calculateEmotionalGrowth = (journalEntries: any[]) => {
  if (journalEntries.length < 2) return 0;
  
  // Compare emotional states between first and last entries
  const firstEntry = journalEntries[journalEntries.length - 1];
  const lastEntry = journalEntries[0];
  
  return lastEntry.emotional_shift - firstEntry.emotional_shift;
};

export const InsightsScreen = () => {
  const { entries } = useJournal();
  const { setLoading } = useAppState();
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');

  const stats = useMemo(() => {
    const now = new Date();
    const getFilterDate = () => {
      switch (timeFilter) {
        case 'week':
          return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        case 'month':
          return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        default:
          return new Date(0); // all time
      }
    };

    const filterDate = getFilterDate();
    const filteredEntries = entries.filter(entry => entry.date >= filterDate);

    // Calculate both initial and secondary emotion distributions
    const emotionCounts: Record<string, number> = {};
    filteredEntries.forEach(entry => {
      emotionCounts[entry.initial_emotion] = (emotionCounts[entry.initial_emotion] || 0) + 1;
      if (entry.secondary_emotion) {
        emotionCounts[entry.secondary_emotion] = (emotionCounts[entry.secondary_emotion] || 0) + 1;
      }
    });

    const total = Object.values(emotionCounts).reduce((a, b) => a + b, 0);

    // Group emotions by primary categories
    const emotionCategories: EmotionCategory[] = primaryEmotions.map(category => {
      const categoryEmotions: EmotionStats[] = [
        // Include the primary emotion itself
        {
          id: category.id,
          label: category.label,
          count: emotionCounts[category.id] || 0,
          percentage: Math.round(((emotionCounts[category.id] || 0) / total) * 100),
          color: category.color,
        },
        // Include secondary emotions
        ...category.emotions.map(emotion => ({
          id: emotion.id,
          label: emotion.label,
          count: emotionCounts[emotion.id] || 0,
          percentage: Math.round(((emotionCounts[emotion.id] || 0) / total) * 100),
          color: emotion.color,
        }))
      ].filter(emotion => emotion.count > 0);

      const totalCount = categoryEmotions.reduce((sum, emotion) => sum + emotion.count, 0);
      const percentage = Math.round((totalCount / total) * 100);

      return {
        id: category.id,
        label: category.label,
        color: category.color,
        emotions: categoryEmotions.sort((a, b) => b.count - a.count),
        totalCount,
        percentage,
      };
    }).filter(category => category.totalCount > 0)
      .sort((a, b) => b.totalCount - a.totalCount);

    // Calculate streak
    let currentStreak = 0;
    let date = new Date();
    
    // Count back from today until we find a day without entries
    while (true) {
      const dayEntries = entries.filter(e => 
        e.date.getFullYear() === date.getFullYear() &&
        e.date.getMonth() === date.getMonth() &&
        e.date.getDate() === date.getDate()
      );
      
      if (dayEntries.length === 0) break;
      currentStreak++;
      date.setDate(date.getDate() - 1);
    }

    // Calculate completion rate (entries per day in the last week)
    const completionRate = (filteredEntries.length / (DAYS_IN_WEEK * 3)) * 100; // 3 possible entries per day

    // Calculate emotional growth
    const emotionalGrowth = calculateEmotionalGrowth(entries);

    return {
      emotionCategories,
      currentStreak,
      completionRate: Math.round(completionRate),
      totalEntries: entries.length,
      emotionalGrowth,
      filteredEntries,
    };
  }, [entries, timeFilter]);

  useEffect(() => {
    if (entries.length > 0 && !aiInsights.length) {
      generateAIInsights();
    }
  }, [entries]);

  const generateAIInsights = async () => {
    setIsLoadingInsights(true);
    try {
      const insights = await generateInsights(entries);
      setAiInsights(insights);
    } catch (error) {
      console.error('Failed to generate insights:', error);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  return (
    <View style={styles.container}>
      <VideoBackground />
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Typography variant="h1" style={styles.title}>
            Your Daily Glow Journey
          </Typography>
        </View>

        <View style={styles.content}>
          {/* Stats Overview */}
          <View style={styles.statsRow}>
            <Card style={styles.streakStatsCard}>
              <Typography variant="h1" style={styles.statNumber}>
                {stats.currentStreak}
              </Typography>
              <Typography variant="body" color={theme.COLORS.ui.textSecondary}>
                Day Streak
              </Typography>
            </Card>
            <Card style={styles.completionStatsCard}>
              <Typography variant="h1" style={styles.statNumber}>
                {stats.completionRate}%
              </Typography>
              <Typography variant="body" color={theme.COLORS.ui.textSecondary}>
                Check-in Rate
              </Typography>
            </Card>
          </View>

          {/* Emotional Journey */}
          <Card style={styles.journeyCard}>
            <Typography variant="h3" style={styles.cardTitle}>
              Your Emotional Journey
            </Typography>
            
            <View style={styles.timeFilterRow}>
              <TouchableOpacity 
                style={[styles.filterButton, timeFilter === 'week' && styles.filterButtonActive]}
                onPress={() => setTimeFilter('week')}
              >
                <Typography 
                  style={styles.filterText}
                  color={timeFilter === 'week' ? theme.COLORS.ui.background : theme.COLORS.ui.textSecondary}
                >
                  Week
                </Typography>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterButton, timeFilter === 'month' && styles.filterButtonActive]}
                onPress={() => setTimeFilter('month')}
              >
                <Typography 
                  style={styles.filterText}
                  color={timeFilter === 'month' ? theme.COLORS.ui.background : theme.COLORS.ui.textSecondary}
                >
                  Month
                </Typography>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterButton, timeFilter === 'all' && styles.filterButtonActive]}
                onPress={() => setTimeFilter('all')}
              >
                <Typography 
                  style={styles.filterText}
                  color={timeFilter === 'all' ? theme.COLORS.ui.background : theme.COLORS.ui.textSecondary}
                >
                  All Time
                </Typography>
              </TouchableOpacity>
            </View>

            <View style={styles.emotionStats}>
              {stats.emotionCategories.map((category) => (
                <View key={category.id} style={styles.categorySection}>
                  <View style={styles.categoryHeader}>
                    <AnimatedMoodIcon color={category.color} size={24}>
                      <Typography>{getEmotionEmoji(category.id)}</Typography>
                    </AnimatedMoodIcon>
                    <Typography style={styles.categoryLabel} color={category.color}>
                      {category.label}
                    </Typography>
                    <Typography style={styles.categoryCount}>
                      ({category.totalCount})
                    </Typography>
                  </View>
                  
                  <View style={styles.categoryBar}>
                    <View
                      style={[
                        styles.categoryBarFill,
                        { width: `${category.percentage}%`, backgroundColor: category.color }
                      ]}
                    />
                    <Typography style={styles.categoryPercentage}>
                      {category.percentage}%
                    </Typography>
                  </View>

                  <View style={styles.secondaryEmotions}>
                    {category.emotions.slice(1).map((emotion) => (
                      <View key={emotion.id} style={styles.secondaryEmotion}>
                        <Typography style={styles.secondaryEmotionLabel}>
                          {emotion.label} ({emotion.count})
                        </Typography>
                        <View style={styles.secondaryEmotionBar}>
                          <View
                            style={[
                              styles.secondaryEmotionBarFill,
                              { width: `${(emotion.count / category.totalCount) * 100}%`, backgroundColor: emotion.color }
                            ]}
                          />
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>

            <Typography 
              variant="body" 
              color={theme.COLORS.ui.textSecondary}
              style={styles.emotionStatsFooter}
            >
              Based on {stats.filteredEntries.length} journal entries
            </Typography>
          </Card>

          {/* AI Insights */}
          <Card style={styles.insightsCard}>
            <Typography variant="h3" style={styles.cardTitle}>
              Personal Insights
            </Typography>
            {isLoadingInsights ? (
              <ActivityIndicator color={theme.COLORS.primary.green} />
            ) : aiInsights.length > 0 ? (
              <>
                {aiInsights.map((insight, index) => (
                  <Typography 
                    key={index} 
                    variant="body" 
                    style={styles.insightText}
                    color={theme.COLORS.ui.textSecondary}
                  >
                    • {insight}
                  </Typography>
                ))}
                <Button
                  title="Refresh Insights"
                  onPress={generateAIInsights}
                  variant="secondary"
                  style={styles.refreshButton}
                />
              </>
            ) : (
              <Typography variant="body" color={theme.COLORS.ui.textSecondary}>
                Complete more check-ins to receive personalized insights!
              </Typography>
            )}
          </Card>

          {/* Journey Summary */}
          <Card style={styles.summaryCard}>
            <Typography variant="h3" style={styles.cardTitle}>
              Your Progress
            </Typography>
            <Typography variant="body" color={theme.COLORS.ui.textSecondary}>
              {stats.totalEntries === 0 ? (
                "Start your journey by completing your first check-in!"
              ) : (
                `You've logged ${stats.totalEntries} entries and maintained a ${stats.currentStreak}-day streak. Your emotional awareness is growing stronger each day!`
              )}
            </Typography>
            {stats.emotionalGrowth > 0 && (
              <Typography 
                variant="body" 
                style={styles.growthText}
                color={theme.COLORS.primary.green}
              >
                🌱 Your emotional well-being has improved by {Math.round(stats.emotionalGrowth * 100)}% since you started!
              </Typography>
            )}
          </Card>
        </View>
      </ScrollView>
    </View>
  );
};

const getEmotionEmoji = (emotionId: string): string => {
  switch (emotionId) {
    case 'happy': return '😊';
    case 'sad': return '😢';
    case 'angry': return '😠';
    case 'scared': return '😨';
    case 'optimistic': return '🌟';
    case 'peaceful': return '😌';
    case 'powerful': return '💪';
    case 'proud': return '🦁';
    default: return '😊';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.ui.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: theme.SPACING.lg,
    paddingTop: 100,
  },
  title: {
    color: theme.COLORS.ui.text,
    marginBottom: theme.SPACING.md,
    fontSize: 34,
    textAlign: 'center',
  },
  content: {
    padding: theme.SPACING.lg,
    paddingTop: 0,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: theme.SPACING.lg,
    gap: theme.SPACING.md,
  },
  streakStatsCard: {
    flex: 1,
    alignItems: 'center',
    padding: theme.SPACING.lg,
    backgroundColor: theme.COLORS.ui.card,
    borderRadius: theme.BORDER_RADIUS.lg,
    shadowColor: theme.COLORS.primary.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  } as ViewStyle,
  completionStatsCard: {
    flex: 1,
    alignItems: 'center',
    padding: theme.SPACING.lg,
    backgroundColor: theme.COLORS.ui.card,
    borderRadius: theme.BORDER_RADIUS.lg,
    shadowColor: theme.COLORS.primary.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  } as ViewStyle,
  statNumber: {
    marginBottom: theme.SPACING.xs,
    fontSize: 36,
    fontWeight: theme.FONTS.weights.bold,
    color: theme.COLORS.primary.green,
    textShadowColor: 'rgba(0, 200, 83, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  journeyCard: {
    marginBottom: theme.SPACING.lg,
    padding: theme.SPACING.lg,
    backgroundColor: theme.COLORS.ui.card,
    borderRadius: theme.BORDER_RADIUS.lg,
    shadowColor: theme.COLORS.ui.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  cardTitle: {
    marginBottom: theme.SPACING.xl,
    fontSize: 24,
    fontWeight: theme.FONTS.weights.semibold,
    textAlign: 'center',
    color: theme.COLORS.ui.text,
  },
  emotionStats: {
    gap: theme.SPACING.lg,
  },
  emotionStatsFooter: {
    marginTop: theme.SPACING.lg,
    textAlign: 'center',
    fontSize: 14,
  },
  insightsCard: {
    marginBottom: theme.SPACING.lg,
    padding: theme.SPACING.lg,
    backgroundColor: theme.COLORS.ui.card,
    borderRadius: theme.BORDER_RADIUS.lg,
    shadowColor: theme.COLORS.primary.blue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  insightText: {
    marginBottom: theme.SPACING.md,
    lineHeight: 24,
  },
  refreshButton: {
    marginTop: theme.SPACING.lg,
  },
  summaryCard: {
    padding: theme.SPACING.lg,
    marginBottom: theme.SPACING.xl,
    backgroundColor: theme.COLORS.ui.card,
    borderRadius: theme.BORDER_RADIUS.lg,
    shadowColor: theme.COLORS.ui.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  growthText: {
    marginTop: theme.SPACING.md,
    fontWeight: theme.FONTS.weights.semibold,
    color: theme.COLORS.primary.green,
    textShadowColor: 'rgba(0, 200, 83, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  timeFilterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: theme.SPACING.lg,
    gap: theme.SPACING.sm,
  },
  filterButton: {
    paddingHorizontal: theme.SPACING.md,
    paddingVertical: theme.SPACING.sm,
    borderRadius: theme.BORDER_RADIUS.lg,
    backgroundColor: theme.COLORS.ui.card,
    shadowColor: theme.COLORS.ui.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterButtonActive: {
    backgroundColor: theme.COLORS.primary.green,
    shadowColor: theme.COLORS.primary.green,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  filterText: {
    fontSize: 14,
    fontWeight: theme.FONTS.weights.medium,
  },
  categorySection: {
    marginBottom: theme.SPACING.xl,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.SPACING.sm,
  },
  categoryLabel: {
    marginLeft: theme.SPACING.sm,
    fontSize: 18,
    fontWeight: theme.FONTS.weights.semibold,
    flex: 1,
  },
  categoryCount: {
    fontSize: 16,
    color: theme.COLORS.ui.textSecondary,
  },
  categoryBar: {
    height: 16,
    backgroundColor: theme.COLORS.ui.card,
    borderRadius: theme.BORDER_RADIUS.sm,
    overflow: 'hidden',
    marginBottom: theme.SPACING.md,
  },
  categoryBarFill: {
    height: '100%',
    borderRadius: theme.BORDER_RADIUS.sm,
  },
  categoryPercentage: {
    position: 'absolute',
    right: theme.SPACING.sm,
    top: -2,
    color: theme.COLORS.ui.background,
    fontSize: 12,
    fontWeight: theme.FONTS.weights.bold,
  },
  secondaryEmotions: {
    marginLeft: theme.SPACING.xl,
    gap: theme.SPACING.sm,
  },
  secondaryEmotion: {
    marginBottom: theme.SPACING.xs,
  },
  secondaryEmotionLabel: {
    fontSize: 14,
    color: theme.COLORS.ui.textSecondary,
    marginBottom: theme.SPACING.xs,
  },
  secondaryEmotionBar: {
    height: 8,
    backgroundColor: theme.COLORS.ui.card,
    borderRadius: theme.BORDER_RADIUS.sm,
    overflow: 'hidden',
  },
  secondaryEmotionBarFill: {
    height: '100%',
    borderRadius: theme.BORDER_RADIUS.sm,
  },
}); 