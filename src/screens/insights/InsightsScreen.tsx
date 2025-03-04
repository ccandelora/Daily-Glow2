import React, { useMemo, useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, ActivityIndicator, ViewStyle, TouchableOpacity, TextStyle } from 'react-native';
import { Typography, Card, AnimatedMoodIcon, Button, AnimatedBackground, Header, VideoBackground } from '@/components/common';
import { useJournal } from '@/contexts/JournalContext';
import { useAppState } from '@/contexts/AppStateContext';
import theme from '@/constants/theme';
import { getEmotionById, primaryEmotions } from '@/constants/emotions';
import { generateInsights } from '@/utils/ai';
import { calculateOverallStreak } from '@/utils/streakCalculator';
import { useCheckInStreak } from '@/contexts/CheckInStreakContext';
import { EmotionalCalendarView, EmotionalGrowthChart, EmotionalWordCloud } from '@/components/insights';
import { FontAwesome6 } from '@expo/vector-icons';
import { 
  analyzeEmotionalTriggers, 
  generatePersonalizedRecommendations, 
  analyzeActivityCorrelations,
  predictEmotionalState,
  calculateEmotionalBalance,
  EmotionalTrigger,
  PersonalizedRecommendation,
  ActivityCorrelation,
  PredictedEmotion
} from '@/utils/insightAnalyzer';

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
  const { streaks } = useCheckInStreak();
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');
  
  // New state for advanced insights
  const [emotionalTriggers, setEmotionalTriggers] = useState<EmotionalTrigger[]>([]);
  const [isLoadingTriggers, setIsLoadingTriggers] = useState(false);
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendation[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [activityCorrelations, setActivityCorrelations] = useState<ActivityCorrelation[]>([]);
  const [isLoadingCorrelations, setIsLoadingCorrelations] = useState(false);
  const [predictedEmotions, setPredictedEmotions] = useState<PredictedEmotion[]>([]);
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false);
  const [emotionalBalance, setEmotionalBalance] = useState({ score: 0, description: '' });

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

    // Use the standardized streak calculation utility
    const currentStreak = calculateOverallStreak(streaks);

    // Calculate completion rate (entries per day in the last week)
    const completionRate = (filteredEntries.length / (DAYS_IN_WEEK * 3)) * 100;

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
  }, [entries, timeFilter, streaks]);

  useEffect(() => {
    if (entries.length > 0) {
      if (!aiInsights.length) {
        generateAIInsights();
      }
      
      // Load advanced insights
      loadAdvancedInsights();
    }
  }, [entries, timeFilter]);
  
  const loadAdvancedInsights = async () => {
    // Only load if we have enough entries
    if (entries.length < 3) return;
    
    // Get filtered entries based on time filter
    const filteredEntries = stats.filteredEntries;
    
    console.log('Total journal entries:', entries.length);
    console.log('Filtered entries for insights:', filteredEntries.length);
    
    // Check how many entries have notes
    const entriesWithNotes = filteredEntries.filter(entry => entry.note && entry.note.trim().length > 0);
    console.log('Entries with notes:', entriesWithNotes.length);
    
    if (filteredEntries.length > 0) {
      console.log('Sample entry:', {
        id: filteredEntries[0].id,
        date: filteredEntries[0].date,
        initial_emotion: filteredEntries[0].initial_emotion,
        note: filteredEntries[0].note ? filteredEntries[0].note.substring(0, 50) + '...' : 'No notes',
      });
    }
    
    // Load emotional triggers
    setIsLoadingTriggers(true);
    try {
      const triggers = await analyzeEmotionalTriggers(filteredEntries);
      console.log('Emotional triggers result:', triggers);
      setEmotionalTriggers(triggers);
    } catch (error) {
      console.error('Failed to analyze emotional triggers:', error);
    } finally {
      setIsLoadingTriggers(false);
    }
    
    // Load personalized recommendations
    setIsLoadingRecommendations(true);
    try {
      const recs = await generatePersonalizedRecommendations(filteredEntries);
      setRecommendations(recs);
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
    } finally {
      setIsLoadingRecommendations(false);
    }
    
    // Load activity correlations
    setIsLoadingCorrelations(true);
    try {
      const correlations = await analyzeActivityCorrelations(filteredEntries);
      setActivityCorrelations(correlations);
    } catch (error) {
      console.error('Failed to analyze activity correlations:', error);
    } finally {
      setIsLoadingCorrelations(false);
    }
    
    // Load emotion predictions
    setIsLoadingPredictions(true);
    try {
      const predictions = await predictEmotionalState(filteredEntries);
      setPredictedEmotions(predictions);
    } catch (error) {
      console.error('Failed to predict emotional state:', error);
    } finally {
      setIsLoadingPredictions(false);
    }
    
    // Calculate emotional balance
    const balance = calculateEmotionalBalance(filteredEntries);
    setEmotionalBalance(balance);
  };

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
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <Header showBranding={true} />
        
        <View style={styles.content}>
          <Typography variant="h1" style={styles.title}>
            Your Insights
          </Typography>
          
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                timeFilter === 'week' && styles.activeFilterButton
              ]}
              onPress={() => setTimeFilter('week')}
            >
              <Typography
                style={{
                  ...styles.filterText,
                  ...(timeFilter === 'week' ? styles.activeFilterText : {})
                }}
              >
                Week
              </Typography>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                timeFilter === 'month' && styles.activeFilterButton
              ]}
              onPress={() => setTimeFilter('month')}
            >
              <Typography
                style={{
                  ...styles.filterText,
                  ...(timeFilter === 'month' ? styles.activeFilterText : {})
                }}
              >
                Month
              </Typography>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                timeFilter === 'all' && styles.activeFilterButton
              ]}
              onPress={() => setTimeFilter('all')}
            >
              <Typography
                style={{
                  ...styles.filterText,
                  ...(timeFilter === 'all' ? styles.activeFilterText : {})
                }}
              >
                All Time
              </Typography>
            </TouchableOpacity>
          </View>

          {/* Stats Overview */}
          <View style={styles.statsRow}>
            <Card style={StyleSheet.flatten([styles.streakStatsCard])} variant="glow">
              <Typography variant="h1" style={styles.statNumber}>
                {stats.currentStreak}
              </Typography>
              <Typography variant="body" color={theme.COLORS.ui.textSecondary}>
                Day Streak
              </Typography>
            </Card>
            <Card style={StyleSheet.flatten([styles.completionStatsCard])} variant="glow">
              <Typography variant="h1" style={styles.statNumber}>
                {stats.completionRate}%
              </Typography>
              <Typography variant="body" color={theme.COLORS.ui.textSecondary}>
                Check-in Rate
              </Typography>
            </Card>
          </View>
          
          {/* Emotional Calendar */}
          <Card style={styles.calendarCard} variant="glow">
            <Typography variant="h3" style={styles.cardTitle}>
              Your Emotional Calendar
            </Typography>
            <EmotionalCalendarView 
              entries={stats.filteredEntries} 
              timeFilter={timeFilter}
            />
            <Typography variant="caption" color={theme.COLORS.ui.textSecondary} style={styles.cardFooter}>
              See how your emotions change throughout the {timeFilter}
            </Typography>
          </Card>

          {/* Emotional Growth Chart */}
          <Card style={styles.growthCard} variant="glow">
            <Typography variant="h3" style={styles.cardTitle}>
              Your Emotional Journey
            </Typography>
            <EmotionalGrowthChart 
              entries={entries} 
              timeFilter={timeFilter}
            />
            <View style={styles.growthMetrics}>
              <View style={styles.growthMetric}>
                <Typography variant="h2" color={theme.COLORS.primary.green}>
                  {stats.emotionalGrowth > 0 ? '+' : ''}{Math.round(stats.emotionalGrowth * 100)}%
                </Typography>
                <Typography variant="caption">Overall Growth</Typography>
              </View>
              {stats.emotionCategories.length > 0 && (
                <View style={styles.growthMetric}>
                  <Typography variant="h2" color={stats.emotionCategories[0].color}>
                    {stats.emotionCategories[0].label}
                  </Typography>
                  <Typography variant="caption">Most Frequent</Typography>
                </View>
              )}
            </View>
          </Card>

          {/* Emotional Balance Meter */}
          <Card style={styles.balanceCard} variant="glow">
            <Typography variant="h3" style={styles.cardTitle}>
              Emotional Balance
            </Typography>
            <View style={styles.balanceMeter}>
              <View style={styles.balanceScale}>
                <View 
                  style={[
                    styles.balanceIndicator, 
                    { left: `${50 + emotionalBalance.score * 50}%` }
                  ]} 
                />
                <Typography style={styles.balanceLabel} color={theme.COLORS.ui.textSecondary}>
                  Negative
                </Typography>
                <Typography 
                  style={styles.balanceLabelRight} 
                  color={theme.COLORS.ui.textSecondary}
                >
                  Positive
                </Typography>
              </View>
            </View>
            <Typography style={styles.balanceDescription} color={theme.COLORS.ui.textSecondary}>
              {emotionalBalance.description}
            </Typography>
          </Card>

          {/* Emotional Journey */}
          <Card style={StyleSheet.flatten([styles.journeyCard])} variant="glow">
            <Typography variant="h3" style={styles.cardTitle}>
              Emotion Breakdown
            </Typography>
            
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
          
          {/* Emotional Triggers */}
          <Card style={styles.triggersCard} variant="glow">
            <Typography variant="h3" style={styles.cardTitle}>
              Emotional Triggers
            </Typography>
            {isLoadingTriggers ? (
              <ActivityIndicator color={theme.COLORS.primary.green} />
            ) : emotionalTriggers.length > 0 ? (
              <View style={styles.triggersList}>
                {emotionalTriggers.map((trigger, index) => (
                  <View key={index} style={styles.triggerItem}>
                    <View style={[styles.triggerIcon, { backgroundColor: trigger.emotion.color }]}>
                      <Typography style={styles.triggerEmoji}>{getEmotionEmoji(trigger.emotion.id)}</Typography>
                    </View>
                    <View style={styles.triggerContent}>
                      <Typography style={styles.triggerTitle}>{trigger.keyword}</Typography>
                      <Typography variant="caption" color={theme.COLORS.ui.textSecondary}>
                        Mentioned in {trigger.count} {trigger.count === 1 ? 'entry' : 'entries'}
                      </Typography>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Typography variant="body" color={theme.COLORS.ui.textSecondary} style={styles.noDataText}>
                Add more detailed journal entries to identify your emotional triggers
              </Typography>
            )}
            <Typography variant="caption" color={theme.COLORS.ui.textSecondary} style={styles.cardFooter}>
              Words and phrases that tend to trigger specific emotions
            </Typography>
          </Card>
          
          {/* Word Cloud */}
          <Card style={styles.wordCloudCard} variant="glow">
            <Typography variant="h3" style={styles.cardTitle}>
              Your Journal in Words
            </Typography>
            <View style={styles.wordCloudContainer}>
              <EmotionalWordCloud 
                entries={stats.filteredEntries}
                width={screenWidth - 80}
                height={220}
              />
            </View>
            <Typography variant="caption" color={theme.COLORS.ui.textSecondary} style={styles.cardFooter}>
              Words sized by frequency, colored by emotional association
            </Typography>
          </Card>
          
          {/* Activity Correlations */}
          <Card style={styles.correlationsCard} variant="glow">
            <Typography variant="h3" style={styles.cardTitle}>
              Activities & Your Mood
            </Typography>
            {isLoadingCorrelations ? (
              <ActivityIndicator color={theme.COLORS.primary.green} />
            ) : activityCorrelations.length > 0 ? (
              <View style={styles.correlationsList}>
                {activityCorrelations.map((correlation, index) => (
                  <View key={index} style={styles.correlationItem}>
                    <View style={styles.correlationHeader}>
                      <Typography style={styles.correlationActivity}>
                        {correlation.activity}
                      </Typography>
                      <View 
                        style={[
                          styles.correlationIndicator, 
                          { backgroundColor: correlation.impact > 0 ? theme.COLORS.primary.green : theme.COLORS.primary.red }
                        ]}
                      >
                        <Typography style={styles.correlationImpact}>
                          {correlation.impact > 0 ? '+' : ''}{correlation.impact}
                        </Typography>
                      </View>
                    </View>
                    <Typography variant="caption" color={theme.COLORS.ui.textSecondary}>
                      {correlation.description}
                    </Typography>
                  </View>
                ))}
              </View>
            ) : (
              <Typography variant="body" color={theme.COLORS.ui.textSecondary} style={styles.noDataText}>
                Mention activities in your journal entries to see how they affect your mood
              </Typography>
            )}
          </Card>
          
          {/* Mood Prediction */}
          <Card style={styles.predictionCard} variant="glow">
            <Typography variant="h3" style={styles.cardTitle}>
              Mood Forecast
            </Typography>
            {isLoadingPredictions ? (
              <ActivityIndicator color={theme.COLORS.primary.green} />
            ) : predictedEmotions.length > 0 ? (
              <View style={styles.predictionContent}>
                <Typography variant="body" color={theme.COLORS.ui.textSecondary}>
                  Based on your patterns, tomorrow you might feel:
                </Typography>
                <View style={styles.predictedEmotions}>
                  {predictedEmotions.map((emotion, index) => (
                    <View key={index} style={styles.predictedEmotion}>
                      <AnimatedMoodIcon color={emotion.color} size={40}>
                        <Typography>{getEmotionEmoji(emotion.id)}</Typography>
                      </AnimatedMoodIcon>
                      <Typography style={styles.predictionProbability}>
                        {Math.round(emotion.probability * 100)}%
                      </Typography>
                      <Typography variant="caption">{emotion.label}</Typography>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <Typography variant="body" color={theme.COLORS.ui.textSecondary} style={styles.noDataText}>
                Complete more check-ins to see mood predictions
              </Typography>
            )}
          </Card>
          
          {/* Personalized Recommendations */}
          <Card style={styles.recommendationsCard} variant="glow">
            <Typography variant="h3" style={styles.cardTitle}>
              Personalized Recommendations
            </Typography>
            {isLoadingRecommendations ? (
              <ActivityIndicator color={theme.COLORS.primary.green} />
            ) : recommendations.length > 0 ? (
              <View style={styles.recommendationsList}>
                {recommendations.map((recommendation, index) => (
                  <View key={index} style={styles.recommendationItem}>
                    <FontAwesome6 
                      name={recommendation.icon} 
                      size={24} 
                      color={theme.COLORS.primary.green}
                      style={styles.recommendationIcon}
                    />
                    <View style={styles.recommendationContent}>
                      <Typography style={styles.recommendationTitle}>
                        {recommendation.title}
                      </Typography>
                      <Typography 
                        variant="body" 
                        color={theme.COLORS.ui.textSecondary}
                        style={styles.recommendationDescription}
                      >
                        {recommendation.description}
                      </Typography>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Typography variant="body" color={theme.COLORS.ui.textSecondary} style={styles.noDataText}>
                Complete more check-ins to receive personalized recommendations
              </Typography>
            )}
            <Button
              title="Refresh Recommendations"
              onPress={loadAdvancedInsights}
              variant="secondary"
              style={styles.refreshButton}
            />
          </Card>

          {/* AI Insights */}
          <Card style={styles.insightsCard} variant="glow">
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
          <Card style={styles.summaryCard} variant="glow">
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
  contentContainer: {
    paddingBottom: theme.SPACING.xl,
  },
  content: {
    paddingHorizontal: theme.SPACING.lg,
  },
  title: {
    fontSize: 32,
    marginBottom: theme.SPACING.md,
    color: theme.COLORS.ui.text,
    paddingTop: 0,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: theme.SPACING.md,
  },
  filterButton: {
    paddingVertical: theme.SPACING.sm,
    paddingHorizontal: theme.SPACING.md,
    borderRadius: theme.BORDER_RADIUS.md,
    marginRight: theme.SPACING.sm,
    backgroundColor: `${theme.COLORS.ui.card}80`,
  },
  activeFilterButton: {
    backgroundColor: theme.COLORS.primary.green,
  },
  filterText: {
    color: theme.COLORS.ui.textSecondary,
  } as TextStyle,
  activeFilterText: {
    color: theme.COLORS.ui.background,
    fontWeight: 'bold',
  } as TextStyle,
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
  calendarCard: {
    marginBottom: theme.SPACING.lg,
    padding: theme.SPACING.lg,
    backgroundColor: theme.COLORS.ui.card,
    borderRadius: theme.BORDER_RADIUS.lg,
    shadowColor: theme.COLORS.primary.purple,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  cardFooter: {
    textAlign: 'center',
    marginTop: theme.SPACING.md,
    fontSize: 12,
    opacity: 0.8,
  },
  growthCard: {
    marginBottom: theme.SPACING.lg,
    padding: theme.SPACING.lg,
    backgroundColor: theme.COLORS.ui.card,
    borderRadius: theme.BORDER_RADIUS.lg,
    shadowColor: theme.COLORS.primary.green,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  growthMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: theme.SPACING.md,
  },
  growthMetric: {
    alignItems: 'center',
  },
  balanceCard: {
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
  balanceMeter: {
    marginVertical: theme.SPACING.lg,
  },
  balanceScale: {
    height: 20,
    backgroundColor: `${theme.COLORS.ui.card}80`,
    borderRadius: 10,
    position: 'relative',
  },
  balanceIndicator: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.COLORS.primary.green,
    top: 0,
    marginLeft: -10,
    borderWidth: 2,
    borderColor: theme.COLORS.ui.background,
  },
  balanceLabel: {
    position: 'absolute',
    bottom: -20,
    left: 0,
    fontSize: 12,
  } as TextStyle,
  balanceLabelRight: {
    left: 'auto',
    right: 0,
  } as TextStyle,
  balanceDescription: {
    textAlign: 'center',
    marginTop: theme.SPACING.lg,
  },
  triggersCard: {
    marginBottom: theme.SPACING.lg,
    padding: theme.SPACING.lg,
    backgroundColor: theme.COLORS.ui.card,
    borderRadius: theme.BORDER_RADIUS.lg,
    shadowColor: theme.COLORS.primary.red,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  triggersList: {
    gap: theme.SPACING.md,
    marginVertical: theme.SPACING.md,
  },
  triggerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.COLORS.ui.card}80`,
    borderRadius: theme.BORDER_RADIUS.md,
    padding: theme.SPACING.sm,
    marginBottom: theme.SPACING.sm,
  },
  triggerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  triggerEmoji: {
    fontSize: 18,
  },
  triggerContent: {
    flex: 1,
  },
  triggerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  wordCloudCard: {
    marginBottom: theme.SPACING.lg,
    padding: theme.SPACING.lg,
    backgroundColor: theme.COLORS.ui.card,
    borderRadius: theme.BORDER_RADIUS.lg,
    shadowColor: theme.COLORS.primary.yellow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  wordCloudContainer: {
    marginVertical: theme.SPACING.md,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  correlationsCard: {
    marginBottom: theme.SPACING.lg,
    padding: theme.SPACING.lg,
    backgroundColor: theme.COLORS.ui.card,
    borderRadius: theme.BORDER_RADIUS.lg,
    shadowColor: theme.COLORS.primary.orange,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  correlationsList: {
    gap: theme.SPACING.md,
  },
  correlationItem: {
    marginBottom: theme.SPACING.sm,
  },
  correlationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.SPACING.xs,
  },
  correlationActivity: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  correlationIndicator: {
    paddingHorizontal: theme.SPACING.sm,
    paddingVertical: 2,
    borderRadius: theme.BORDER_RADIUS.sm,
  },
  correlationImpact: {
    color: theme.COLORS.ui.background,
    fontWeight: 'bold',
    fontSize: 12,
  },
  predictionCard: {
    marginBottom: theme.SPACING.lg,
    padding: theme.SPACING.lg,
    backgroundColor: theme.COLORS.ui.card,
    borderRadius: theme.BORDER_RADIUS.lg,
    shadowColor: theme.COLORS.primary.purple,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  predictionContent: {
    alignItems: 'center',
  },
  predictedEmotions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: theme.SPACING.lg,
  },
  predictedEmotion: {
    alignItems: 'center',
  },
  predictionProbability: {
    marginTop: theme.SPACING.xs,
    fontSize: 16,
    fontWeight: 'bold',
  },
  recommendationsCard: {
    marginBottom: theme.SPACING.lg,
    padding: theme.SPACING.lg,
    backgroundColor: theme.COLORS.ui.card,
    borderRadius: theme.BORDER_RADIUS.lg,
    shadowColor: theme.COLORS.primary.green,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  recommendationsList: {
    gap: theme.SPACING.lg,
    marginBottom: theme.SPACING.lg,
  },
  recommendationItem: {
    flexDirection: 'row',
  },
  recommendationIcon: {
    marginRight: theme.SPACING.md,
    marginTop: 2,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: theme.SPACING.xs,
  },
  recommendationDescription: {
    lineHeight: 20,
  },
  noDataText: {
    textAlign: 'center',
    marginVertical: theme.SPACING.md,
  },
}); 