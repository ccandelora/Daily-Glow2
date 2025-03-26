import React, { useMemo, useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, ActivityIndicator, ViewStyle, TouchableOpacity, TextStyle, SafeAreaView, StatusBar } from 'react-native';
import { Typography, Card, AnimatedMoodIcon, Button, AnimatedBackground, Header, VideoBackground } from '@/components/common';
import { useJournal } from '@/contexts/JournalContext';
import { useAppState } from '@/contexts/AppStateContext';
import theme from '@/constants/theme';
import { getEmotionById, primaryEmotions } from '@/constants/emotions';
import { generateInsights } from '@/utils/ai';
import { calculateOverallStreak } from '@/utils/streakCalculator';
import { useCheckInStreak } from '@/contexts/CheckInStreakContext';
import { EmotionalCalendarView, EmotionalGrowthChart, EmotionalWordCloud, EmotionalTrendAnalysis } from '@/components/insights';
import { FontAwesome6 } from '@expo/vector-icons';
import { StatisticsDashboard } from '@/components/achievements/StatisticsDashboard';
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
import { useProfile } from '@/contexts/UserProfileContext';

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
  console.log('calculateEmotionalGrowth - entries:', journalEntries?.length || 0);
  
  // If no entries or just one entry, can't calculate growth
  if (!journalEntries || journalEntries.length < 2) {
    console.log('calculateEmotionalGrowth - insufficient entries for calculation');
    return 0;
  }
  
  // Sort entries by date (newest first)
  const sortedEntries = [...journalEntries].sort((a, b) => {
    // Handle potential invalid dates
    const dateA = a.date instanceof Date ? a.date : new Date(a.date || 0);
    const dateB = b.date instanceof Date ? b.date : new Date(b.date || 0);
    
    if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
      console.log('calculateEmotionalGrowth - invalid date detected');
      return 0; // Return 0 for invalid dates
    }
    
    return dateB.getTime() - dateA.getTime();
  });
  
  // Compare emotional states between first and last entries
  const lastEntry = sortedEntries[0]; // most recent entry
  const firstEntry = sortedEntries[sortedEntries.length - 1]; // oldest entry
  
  if (!lastEntry || !firstEntry) {
    console.log('calculateEmotionalGrowth - missing first or last entry after sorting');
    return 0;
  }
  
  // Make sure emotional_shift exists and is a number
  const firstShift = typeof firstEntry.emotional_shift === 'number' 
    ? firstEntry.emotional_shift 
    : 0;
    
  const lastShift = typeof lastEntry.emotional_shift === 'number' 
    ? lastEntry.emotional_shift 
    : 0;
  
  console.log('calculateEmotionalGrowth - firstShift:', firstShift, 'lastShift:', lastShift);
  
  const growth = lastShift - firstShift;
  
  // Ensure the growth value is within a reasonable range (-1 to 1)
  const clampedGrowth = Math.max(-1, Math.min(1, growth));
  
  return clampedGrowth;
};

export const InsightsScreen = () => {
  const { entries } = useJournal();
  const { setLoading } = useAppState();
  const { streaks } = useCheckInStreak();
  const { userProfile } = useProfile();
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [goalInsights, setGoalInsights] = useState<string[]>([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [isLoadingGoalInsights, setIsLoadingGoalInsights] = useState(false);
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
    
    // Ensure all entries have proper Date objects
    const processedEntries = entries.map(entry => ({
      ...entry,
      date: entry.date instanceof Date ? entry.date : new Date(entry.date)
    }));
    
    const filteredEntries = processedEntries.filter(entry => entry.date >= filterDate);

    // Calculate both initial and secondary emotion distributions
    const emotionCounts: Record<string, number> = {};
    filteredEntries.forEach(entry => {
      if (entry.initial_emotion) {
        emotionCounts[entry.initial_emotion] = (emotionCounts[entry.initial_emotion] || 0) + 1;
      }
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
    const emotionalGrowth = calculateEmotionalGrowth(processedEntries);

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
      console.log('Entries length:', entries.length);
      console.log('Sample entry date type:', typeof entries[0].date);
      console.log('Sample date before processing:', entries[0].date);
      console.log('Sample date after processing:', new Date(entries[0].date));
      console.log('Sample entry emotional_shift:', entries[0].emotional_shift);
      
      // Always generate AI insights when time filter changes
      generateAIInsights();
      
      // Generate goal-specific insights
      if (userProfile && userProfile.user_goals && userProfile.user_goals.length > 0) {
        generateGoalInsights();
      }
      
      // Load advanced insights
      loadAdvancedInsights();
    }
  }, [entries, timeFilter, userProfile?.user_goals]);
  
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

  // Generate insights specific to the user's goals
  const generateGoalInsights = () => {
    if (!userProfile || !userProfile.user_goals || userProfile.user_goals.length === 0) {
      console.log('No user goals found for insights');
      return;
    }

    setIsLoadingGoalInsights(true);
    
    try {
      const goals = userProfile.user_goals;
      console.log('Generating insights for goals:', goals);
      
      // Get emotional data related to each goal
      const goalSpecificInsights = goals.map(goal => {
        const insights: string[] = [];
        
        // Analyze emotional patterns for different goals
        switch (goal) {
          case 'reduce_stress':
            const stressRelatedEmotions = ['angry', 'scared', 'anxious'];
            const stressEntries = stats.filteredEntries.filter(entry => 
              stressRelatedEmotions.includes(entry.initial_emotion)
            );
            
            const stressPercentage = stressEntries.length / Math.max(1, stats.filteredEntries.length) * 100;
            
            if (stressPercentage > 50) {
              insights.push(`Your stress level appears high with ${Math.round(stressPercentage)}% of entries showing stress-related emotions. Try adding more relaxation activities.`);
            } else if (stressPercentage > 30) {
              insights.push(`You're managing stress at a moderate level (${Math.round(stressPercentage)}% of entries). Continue practicing your stress-reduction techniques.`);
            } else {
              insights.push(`Great job managing stress! Only ${Math.round(stressPercentage)}% of your entries show stress-related emotions.`);
            }
            break;
            
          case 'improve_mood':
            const positiveEmotions = ['happy', 'optimistic', 'peaceful', 'powerful', 'proud'];
            const positiveEntries = stats.filteredEntries.filter(entry => 
              positiveEmotions.includes(entry.initial_emotion)
            );
            
            const positivePercentage = positiveEntries.length / Math.max(1, stats.filteredEntries.length) * 100;
            
            if (positivePercentage > 70) {
              insights.push(`Excellent progress on your mood improvement goal! ${Math.round(positivePercentage)}% of your entries show positive emotions.`);
            } else if (positivePercentage > 50) {
              insights.push(`You're making good progress on improving your mood. ${Math.round(positivePercentage)}% of your entries show positive emotions.`);
            } else {
              insights.push(`You're working toward improving your mood. Currently ${Math.round(positivePercentage)}% of entries show positive emotions. Try activities that brought you joy in the past.`);
            }
            break;
            
          case 'track_triggers':
            // Check if we have entries with notes to identify triggers
            const entriesWithNotes = stats.filteredEntries.filter(entry => entry.note && entry.note.trim().length > 0);
            
            if (entriesWithNotes.length < 5) {
              insights.push(`To better track emotional triggers, try adding more detailed notes to your entries (${entriesWithNotes.length}/${stats.filteredEntries.length} entries have notes).`);
            } else {
              insights.push(`You've added notes to ${entriesWithNotes.length} entries, which helps identify emotional triggers. Check the Emotional Triggers section for patterns.`);
            }
            break;
            
          case 'understand_emotions':
            // Check for variety of emotions tracked
            const uniqueEmotions = new Set(stats.filteredEntries.map(entry => entry.initial_emotion));
            
            if (uniqueEmotions.size > 6) {
              insights.push(`You're doing great at tracking a wide range of emotions (${uniqueEmotions.size} different emotions). This variety shows deep emotional awareness.`);
            } else if (uniqueEmotions.size > 3) {
              insights.push(`You've tracked ${uniqueEmotions.size} different emotions. Try expanding your emotional vocabulary to better understand your feelings.`);
            } else {
              insights.push(`You're currently tracking a limited range of emotions (${uniqueEmotions.size}). Try to notice and record more nuanced emotional states.`);
            }
            break;
            
          case 'improve_awareness':
            const entriesPerDay = stats.filteredEntries.length / Math.max(1, (timeFilter === 'week' ? 7 : (timeFilter === 'month' ? 30 : 90)));
            
            if (entriesPerDay > 2) {
              insights.push(`Excellent emotional awareness practice! You're averaging ${entriesPerDay.toFixed(1)} check-ins per day.`);
            } else if (entriesPerDay > 1) {
              insights.push(`Good progress on emotional awareness. You're averaging ${entriesPerDay.toFixed(1)} check-ins per day. Try adding one more daily check-in.`);
            } else {
              insights.push(`To improve emotional awareness, try to increase your daily check-ins. Currently averaging ${entriesPerDay.toFixed(1)} per day.`);
            }
            break;
            
          case 'build_habits':
            if (stats.currentStreak > 7) {
              insights.push(`Excellent habit building! You've maintained a ${stats.currentStreak}-day streak of check-ins.`);
            } else if (stats.currentStreak > 3) {
              insights.push(`Good progress building habits. Your current ${stats.currentStreak}-day streak is helping establish this routine.`);
            } else {
              insights.push(`To build stronger habits, try to maintain consistent daily check-ins. Your current streak is ${stats.currentStreak} day(s).`);
            }
            break;
            
          case 'mindful':
            // Analyze mindfulness based on emotional shifts
            const entriesWithShifts = stats.filteredEntries.filter(entry => 
              typeof entry.emotional_shift === 'number' && Math.abs(entry.emotional_shift) > 0.1
            );
            const positiveShifts = entriesWithShifts.filter(entry => 
              typeof entry.emotional_shift === 'number' && entry.emotional_shift > 0
            ).length;
            const shiftRate = entriesWithShifts.length / Math.max(1, stats.filteredEntries.length);
            
            if (shiftRate > 0.7 && positiveShifts > entriesWithShifts.length * 0.6) {
              insights.push(`Your mindfulness practice appears effective - ${Math.round(positiveShifts/Math.max(1, entriesWithShifts.length)*100)}% of your check-ins show positive emotional shifts.`);
            } else if (shiftRate > 0.4) {
              insights.push(`Your mindfulness journey shows emotional awareness during check-ins. ${Math.round(shiftRate*100)}% of entries show emotional shifts as you reflect.`);
            } else {
              insights.push(`To enhance mindfulness, try taking a few deep breaths before check-ins and notice how your emotions change during reflection.`);
            }
            break;
            
          case 'mood':
            // Analyze mood trends over time
            if (stats.filteredEntries.length >= 7) {
              // Get the earliest and latest entries to compare
              const sortedEntries = [...stats.filteredEntries].sort((a, b) => 
                new Date(a.date).getTime() - new Date(b.date).getTime()
              );
              
              const firstWeekEntries = sortedEntries.slice(0, Math.min(7, Math.ceil(sortedEntries.length/2)));
              const lastWeekEntries = sortedEntries.slice(-Math.min(7, Math.ceil(sortedEntries.length/2)));
              
              // Check for positive emotions
              const positiveEmotionIds = ['happy', 'optimistic', 'peaceful', 'powerful', 'proud'];
              const firstWeekPositive = firstWeekEntries.filter(e => positiveEmotionIds.includes(e.initial_emotion)).length / firstWeekEntries.length;
              const lastWeekPositive = lastWeekEntries.filter(e => positiveEmotionIds.includes(e.initial_emotion)).length / lastWeekEntries.length;
              
              const changeInMood = lastWeekPositive - firstWeekPositive;
              
              if (changeInMood > 0.2) {
                insights.push(`Your mood has improved significantly (${Math.round(changeInMood*100)}% increase in positive emotions) between your earlier and more recent entries.`);
              } else if (changeInMood > 0.05) {
                insights.push(`Your mood is showing gradual improvement with a ${Math.round(changeInMood*100)}% increase in positive emotions recently.`);
              } else if (changeInMood < -0.2) {
                insights.push(`Your mood has changed recently, with ${Math.round(Math.abs(changeInMood)*100)}% fewer positive emotions. Consider what factors might be affecting you.`);
              } else {
                insights.push(`Your mood has been relatively stable over time, with ${Math.round(lastWeekPositive*100)}% positive emotions in recent entries.`);
              }
            } else {
              insights.push(`Continue tracking your mood daily to see meaningful patterns over time. We need at least a week of data for detailed analysis.`);
            }
            break;
            
          case 'track':
            // Analyze consistency and completeness of tracking
            const completionRate = stats.filteredEntries.length / (timeFilter === 'week' ? 7 : timeFilter === 'month' ? 30 : 90);
            const entriesWithFullInfo = stats.filteredEntries.filter(entry => 
              entry.initial_emotion && entry.note && entry.note.trim().length > 10
            );
            const detailRate = entriesWithFullInfo.length / Math.max(1, stats.filteredEntries.length);
            
            if (completionRate > 0.8) {
              insights.push(`Excellent tracking consistency! You've logged entries for ${Math.round(completionRate*100)}% of days in this time period.`);
            } else if (completionRate > 0.5) {
              insights.push(`Good tracking progress - you've logged entries for ${Math.round(completionRate*100)}% of days in this time period.`);
            } else {
              insights.push(`To improve tracking, aim for daily check-ins. You're currently at ${Math.round(completionRate*100)}% of days with entries.`);
            }
            
            if (detailRate > 0.8) {
              insights.push(`Your entries are detailed and complete (${Math.round(detailRate*100)}% include emotions and notes), providing rich data for insights.`);
            } else if (detailRate > 0.4) {
              insights.push(`${Math.round(detailRate*100)}% of your entries include both emotions and notes. Adding more detail helps reveal patterns.`);
            }
            break;

          case 'habits':
            // Analyze habit formation through consistency
            const consistentTimeOfDay = stats.filteredEntries
              .filter(entry => entry.time_period)
              .reduce((acc, entry) => {
                if (entry.time_period) { // Ensure time_period exists
                  acc[entry.time_period] = (acc[entry.time_period] || 0) + 1;
                }
                return acc;
              }, {} as Record<string, number>);
            
            const timeEntries = Object.entries(consistentTimeOfDay);
            const mostConsistentTime = timeEntries.length > 0 ? 
              timeEntries.sort((a, b) => b[1] - a[1])[0] : 
              null;
            
            if (mostConsistentTime && stats.currentStreak > 0) {
              const timeReadable = mostConsistentTime[0].toLowerCase();
              const percentage = Math.round((mostConsistentTime[1] / stats.filteredEntries.length) * 100);
              
              if (percentage > 70) {
                insights.push(`You've developed a strong habit of checking in during the ${timeReadable} (${percentage}% of entries), which helps with consistency.`);
              } else if (percentage > 50) {
                insights.push(`You tend to check in most often during the ${timeReadable} (${percentage}% of entries), which is building into a good habit.`);
              }
              
              if (stats.currentStreak > 14) {
                insights.push(`Impressive streak of ${stats.currentStreak} days! Research shows habits typically form after 21 days of consistency.`);
              } else if (stats.currentStreak > 7) {
                insights.push(`Your ${stats.currentStreak}-day streak shows your habit is forming well. Aim for 21+ days to solidify it.`);
              } else {
                insights.push(`Your current ${stats.currentStreak}-day streak is a good start for habit building. Stay consistent for stronger results.`);
              }
            } else {
              insights.push(`For better habit formation, try checking in at the same time each day. Consistency helps build lasting routines.`);
            }
            break;
          
          default:
            // Handle any other goals with some data analysis rather than generic message
            const goalName = goal.replace(/_/g, ' ');
            
            if (stats.filteredEntries.length > 10) {
              const recentProgress = stats.emotionalGrowth > 0
                ? `Your overall emotional well-being has improved by ${Math.round(stats.emotionalGrowth * 100)}% since you started.`
                : `Continue working toward your ${goalName} goal with regular check-ins.`;
                
              insights.push(`For your "${goalName}" goal: ${recentProgress} Your most frequent emotion is ${stats.emotionCategories[0]?.label || 'neutral'}.`);
            } else {
              insights.push(`For your "${goalName}" goal: Continue logging entries consistently to see patterns and progress over time.`);
            }
            break;
        }
        
        return insights;
      });
      
      // Flatten the array of insight arrays
      const allGoalInsights = goalSpecificInsights.flat();
      
      // Deduplicate similar insights since some goals may generate similar feedback
      const uniqueInsights: string[] = [];
      allGoalInsights.forEach(insight => {
        // Only add if we don't have a very similar insight already
        if (!uniqueInsights.some(existing => 
          existing.toLowerCase().includes(insight.toLowerCase().substring(0, 20)) ||
          insight.toLowerCase().includes(existing.toLowerCase().substring(0, 20))
        )) {
          uniqueInsights.push(insight);
        }
      });
      
      // Add some generic goal-focused insights if we have too few
      if (uniqueInsights.length < 2) {
        uniqueInsights.push("Continue logging your emotions to get more specific insights related to your goals.");
        uniqueInsights.push("Your goal progress will become clearer as you add more regular check-ins.");
      }
      
      setGoalInsights(uniqueInsights);
    } catch (error) {
      console.error('Error generating goal insights:', error);
      setGoalInsights(["Continue tracking your emotions to see insights related to your goals."]);
    } finally {
      setIsLoadingGoalInsights(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <VideoBackground />
      <StatusBar backgroundColor={theme.COLORS.ui.background} />
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
              entries={stats.filteredEntries.map(entry => ({
                ...entry,
                date: entry.date instanceof Date ? entry.date : new Date(entry.date)
              }))} 
              timeFilter={timeFilter}
            />
            <Typography variant="caption" color={theme.COLORS.ui.textSecondary} style={styles.cardFooter}>
              See how your emotions change throughout the {timeFilter}
            </Typography>
          </Card>
          
          {/* date range picker */}
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

          {/* Emotional Trend Analysis */}
          <EmotionalTrendAnalysis 
            entries={stats.filteredEntries.map(entry => ({
              ...entry,
              date: entry.date instanceof Date ? entry.date : new Date(entry.date),
              emotional_shift: typeof entry.emotional_shift === 'number' ? entry.emotional_shift : 0
            }))}
            days={timeFilter === 'week' ? 7 : timeFilter === 'month' ? 30 : 90}
          />
          {/* date range picker */}
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

          {/* Emotional Growth Chart */}
          <Card style={styles.growthCard} variant="glow">
            <Typography variant="h3" style={styles.cardTitle}>
              Your Emotional Journey
            </Typography>
            <EmotionalGrowthChart 
              entries={entries.map(entry => ({
                ...entry,
                date: entry.date instanceof Date ? entry.date : new Date(entry.date),
                emotional_shift: typeof entry.emotional_shift === 'number' ? entry.emotional_shift : 0
              }))}
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
          
          {/* Personal Insights */}
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
                  leftIcon="sync"
                  disabled={isLoadingInsights}
                  loading={isLoadingInsights}
                />
              </>
            ) : (
              <>
                <Typography variant="body" color={theme.COLORS.ui.textSecondary} style={styles.noDataText}>
                  {entries.length > 5 
                    ? "Analyzing your journal entries to generate personalized insights..."
                    : "Complete more check-ins to receive personalized insights!"}
                </Typography>
                <Button
                  title="Generate Insights"
                  onPress={generateAIInsights}
                  variant="secondary"
                  style={styles.refreshButton}
                  leftIcon="lightbulb"
                  disabled={isLoadingInsights}
                  loading={isLoadingInsights}
                />
              </>
            )}
          </Card>
          
          {/* Goal Insights - Only show if user has goals */}
          {userProfile?.user_goals && userProfile.user_goals.length > 0 && (
            <Card style={styles.goalInsightsCard} variant="glow">
              <Typography variant="h3" style={styles.cardTitle}>
                Goal-Related Insights
              </Typography>
              {isLoadingGoalInsights ? (
                <ActivityIndicator color={theme.COLORS.primary.blue} />
              ) : goalInsights.length > 0 ? (
                <>
                  {goalInsights.map((insight, index) => (
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
                    title="Refresh Goal Insights"
                    onPress={generateGoalInsights}
                    variant="secondary"
                    style={styles.refreshButton}
                    leftIcon="sync"
                    disabled={isLoadingGoalInsights}
                    loading={isLoadingGoalInsights}
                  />
                </>
              ) : (
                <>
                  <Typography variant="body" color={theme.COLORS.ui.textSecondary} style={styles.noDataText}>
                    {entries.length > 5 
                      ? "Analyzing your goal-related data to generate insights..." 
                      : "Continue logging entries to receive insights related to your goals!"}
                  </Typography>
                  <Button
                    title="Generate Goal Insights"
                    onPress={generateGoalInsights}
                    variant="secondary"
                    style={styles.refreshButton}
                    leftIcon="bullseye"
                    disabled={isLoadingGoalInsights}
                    loading={isLoadingGoalInsights}
                  />
                </>
              )}
            </Card>
          )}

          {/* date range picker */}
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

          {/* Emotional Balance Meter */}
          <Card style={styles.balanceCard} variant="glow">
            <Typography variant="h3" style={styles.cardTitle}>
              Emotional Balance
            </Typography>
            <Typography variant="body" color={theme.COLORS.ui.textSecondary} style={styles.balanceExplanation}>
              This measures the ratio of positive to negative emotions in your journal entries
            </Typography>
            <View style={styles.balanceMeter}>
              <View style={styles.balanceScale}>
                <View style={styles.balanceScaleMarkers}>
                  <View style={styles.scaleMarker} />
                  <View style={styles.scaleMarker} />
                  <View style={styles.centerMarker} />
                  <View style={styles.scaleMarker} />
                  <View style={styles.scaleMarker} />
                </View>
                <View style={styles.emotionIndicators}>
                  <FontAwesome6 
                    name="face-frown" 
                    size={12} 
                    color={theme.COLORS.primary.red}
                    style={styles.negativeIndicator}
                  />
                  <FontAwesome6 
                    name="face-smile" 
                    size={12} 
                    color={theme.COLORS.primary.green}
                    style={styles.positiveIndicator}
                  />
                </View>
                <View 
                  style={[
                    styles.balanceIndicator, 
                    { 
                      left: `${50 + emotionalBalance.score * 50}%`,
                      backgroundColor: emotionalBalance.score >= 0 ? theme.COLORS.primary.green : theme.COLORS.primary.red
                    }
                  ]} 
                />
                <View style={styles.balanceLabelsContainer}>
                  <Typography style={styles.balanceLabel} color={theme.COLORS.primary.red}>
                    Negative
                  </Typography>
                  <Typography style={styles.balanceValue}>
                    {Math.abs(Math.round(emotionalBalance.score * 100))}%
                  </Typography>
                  <Typography 
                    style={styles.balanceLabelRight} 
                    color={theme.COLORS.primary.green}
                  >
                    Positive
                  </Typography>
                </View>
              </View>
            </View>
            <Typography style={styles.balanceDescription} color={theme.COLORS.ui.textSecondary}>
              {emotionalBalance.description}
            </Typography>
            <Typography style={styles.balanceTip} color={theme.COLORS.ui.textSecondary}>
              {emotionalBalance.score >= 0.3 ? 
                "Your positive outlook is excellent! Consider sharing techniques that work for you." :
              emotionalBalance.score >= 0 ?
                "You're maintaining a healthy balance. Regular check-ins help sustain this pattern." :
                "Try activities that boost your mood like exercise, social connections, or nature walks."
              }
            </Typography>
          </Card>
          
          {/* date range picker */}
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
          
          {/* date range picker */}
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
          
          {/* Emotional Triggers */}
          <Card style={styles.triggersCard} variant="glow">
            <Typography variant="h3" style={styles.cardTitle}>
              Emotional Triggers
            </Typography>
            <Typography variant="body" color={theme.COLORS.ui.textSecondary} style={styles.triggersExplanation}>
              Patterns identified from your journal entries that tend to influence your emotions
            </Typography>
            {isLoadingTriggers ? (
              <ActivityIndicator color={theme.COLORS.primary.green} />
            ) : emotionalTriggers.length > 0 ? (
              <>
                <View style={styles.triggersList}>
                  {emotionalTriggers.map((trigger, index) => (
                    <View key={index} style={styles.triggerItem}>
                      <View style={[styles.triggerIcon, { backgroundColor: trigger.emotion.color }]}>
                        <Typography style={styles.triggerEmoji}>{getEmotionEmoji(trigger.emotion.id)}</Typography>
                      </View>
                      <View style={styles.triggerContent}>
                        <Typography style={styles.triggerTitle}>{trigger.keyword}</Typography>
                        <View style={styles.triggerDetailRow}>
                          <Typography variant="caption" color={trigger.emotion.color} style={styles.triggerEmotion}>
                            {trigger.emotion.label}
                          </Typography>
                          <Typography variant="caption" color={theme.COLORS.ui.textSecondary}>
                            Mentioned in {trigger.count} {trigger.count === 1 ? 'entry' : 'entries'}
                          </Typography>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
                <Button
                  title="Refresh Triggers"
                  onPress={loadAdvancedInsights}
                  variant="secondary"
                  style={styles.refreshButton}
                  leftIcon="sync"
                  disabled={isLoadingTriggers}
                  loading={isLoadingTriggers}
                />
                <Typography variant="caption" color={theme.COLORS.ui.textSecondary} style={styles.cardFooter}>
                  Words and phrases in your journal that are connected to specific emotions
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="body" color={theme.COLORS.ui.textSecondary} style={styles.noDataText}>
                  {entries.length > 5
                    ? "Add more detailed notes to your journal entries to identify emotional triggers"
                    : "Complete more journal entries with detailed notes to identify your emotional triggers"}
                </Typography>
                <View style={styles.triggersExample}>
                  <Typography variant="caption" color={theme.COLORS.ui.textSecondary} style={styles.exampleTitle}>
                    For example: 
                  </Typography>
                  <View style={styles.exampleRow}>
                    <View style={[styles.exampleDot, {backgroundColor: theme.COLORS.primary.green}]} />
                    <Typography variant="caption" color={theme.COLORS.ui.textSecondary} style={styles.exampleText}>
                      "My family gathering today made me feel happy"
                    </Typography>
                  </View>
                  <View style={styles.exampleRow}>
                    <View style={[styles.exampleDot, {backgroundColor: theme.COLORS.primary.red}]} />
                    <Typography variant="caption" color={theme.COLORS.ui.textSecondary} style={styles.exampleText}>
                      "Work stress is making me feel anxious" 
                    </Typography>
                  </View>
                </View>
                <Button
                  title="Analyze Entries"
                  onPress={loadAdvancedInsights}
                  variant="secondary"
                  style={styles.refreshButton}
                  leftIcon="magnifying-glass"
                  disabled={isLoadingTriggers}
                  loading={isLoadingTriggers}
                />
              </>
            )}
          </Card>
          
          {/* date range picker */}
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
          
          {/* date range picker */}
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
          
          {/* date range picker */}
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
          
          {/* date range picker */}
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

          {/* Personalized Recommendations */}
          <Card style={styles.recommendationsCard} variant="glow">
            <View style={styles.cardHeader}>
              <Typography variant="h3" style={styles.cardTitle}>
                Personalized Recommendations
              </Typography>
              <TouchableOpacity 
                onPress={loadAdvancedInsights} 
                disabled={isLoadingRecommendations}
                style={styles.refreshIconButton}
              >
                {isLoadingRecommendations ? (
                  <ActivityIndicator size="small" color={theme.COLORS.primary.green} />
                ) : (
                  <FontAwesome6 
                    name="refresh" 
                    size={16} 
                    color={theme.COLORS.primary.green} 
                  />
                )}
              </TouchableOpacity>
            </View>
            
            {isLoadingRecommendations ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.COLORS.primary.green} />
                <Typography variant="body" style={styles.loadingText}>
                  Analyzing your journal entries...
                </Typography>
              </View>
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
              <View style={styles.emptyStateContainer}>
                <Typography variant="body" color={theme.COLORS.ui.textSecondary} style={styles.noDataText}>
                  Complete more check-ins to receive personalized recommendations based on your emotional patterns.
                </Typography>
                <Button
                  title="Refresh"
                  onPress={loadAdvancedInsights}
                  variant="primary"
                  style={styles.checkInButton}
                />
              </View>
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

          {/* Detailed Statistics Dashboard */}
          <Typography variant="h2" style={styles.sectionTitle}>
            Detailed Statistics
          </Typography>
          <View style={styles.statisticsDashboardWrapper}>
            <StatisticsDashboard />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    paddingTop: theme.SPACING.md,
  },
  content: {
    paddingHorizontal: theme.SPACING.lg,
  },
  title: {
    fontSize: 32,
    marginBottom: theme.SPACING.md,
    color: theme.COLORS.ui.text,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: theme.SPACING.md,
    justifyContent: 'center',
    marginTop: theme.SPACING.sm,
  },
  filterButton: {
    paddingVertical: theme.SPACING.sm,
    paddingHorizontal: theme.SPACING.md,
    borderRadius: theme.BORDER_RADIUS.md,
    marginRight: theme.SPACING.sm,
    backgroundColor: `${theme.COLORS.ui.card}80`,
    minWidth: 80,
    alignItems: 'center',
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
    marginTop: theme.SPACING.md,
    alignSelf: 'center',
    minWidth: 200,
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
    height: 24,
    backgroundColor: `${theme.COLORS.ui.card}80`,
    borderRadius: 12,
    position: 'relative',
    borderWidth: 1,
    borderColor: `${theme.COLORS.ui.border}60`,
  },
  balanceScaleMarkers: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: '25%',
  },
  scaleMarker: {
    width: 1,
    height: '60%',
    backgroundColor: `${theme.COLORS.ui.textSecondary}40`,
    alignSelf: 'center',
  },
  centerMarker: {
    width: 2,
    height: '80%',
    backgroundColor: `${theme.COLORS.ui.textSecondary}80`,
    alignSelf: 'center',
  },
  emotionIndicators: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.SPACING.sm,
  },
  negativeIndicator: {
    alignSelf: 'center',
    opacity: 0.8,
  },
  positiveIndicator: {
    alignSelf: 'center',
    opacity: 0.8,
  },
  balanceIndicator: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    top: 0,
    marginLeft: -12,
    borderWidth: 2,
    borderColor: theme.COLORS.ui.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  balanceLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -24,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '600',
  } as TextStyle,
  balanceLabelRight: {
    fontSize: 14,
    fontWeight: '600',
  } as TextStyle,
  balanceValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.COLORS.ui.text,
  },
  balanceDescription: {
    textAlign: 'center',
    marginTop: theme.SPACING.lg + 4,
    fontWeight: '500',
    fontSize: 16,
  },
  balanceTip: {
    textAlign: 'center',
    marginTop: theme.SPACING.md,
    fontSize: 14,
    fontStyle: 'italic',
  },
  balanceExplanation: {
    textAlign: 'center',
    marginTop: -theme.SPACING.lg,
    marginBottom: theme.SPACING.md,
    fontSize: 14,
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
  triggersExplanation: {
    textAlign: 'center',
    marginTop: -theme.SPACING.lg,
    marginBottom: theme.SPACING.md,
    fontSize: 14,
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
  triggerDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  triggerEmotion: {
    fontWeight: '600',
  },
  triggersExample: {
    backgroundColor: `${theme.COLORS.ui.card}80`,
    borderRadius: theme.BORDER_RADIUS.md,
    padding: theme.SPACING.md,
    marginVertical: theme.SPACING.md,
  },
  exampleTitle: {
    fontWeight: '600',
    marginBottom: theme.SPACING.sm,
  },
  exampleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.SPACING.xs,
  },
  exampleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.SPACING.sm,
  },
  exampleText: {
    fontSize: 13,
    flex: 1,
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
  sectionTitle: {
    marginTop: theme.SPACING.xl,
    marginBottom: theme.SPACING.md,
    fontSize: 24,
  },
  insightIcon: {
    marginBottom: theme.SPACING.md,
  },
  loadingContainer: {
    padding: theme.SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: theme.SPACING.md,
    textAlign: 'center',
  },
  insightsContainer: {
    marginBottom: theme.SPACING.lg,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.SPACING.md,
  },
  insightBullet: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.COLORS.primary.yellow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.SPACING.md,
  },
  emptyInsights: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.SPACING.lg,
  },
  emptyInsightsText: {
    marginBottom: theme.SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.SPACING.lg,
  },
  headerIcon: {
    marginLeft: theme.SPACING.md,
  },
  statisticsDashboardWrapper: {
    marginBottom: theme.SPACING.lg,
  },
  errorCard: {
    padding: theme.SPACING.lg,
    backgroundColor: theme.COLORS.ui.card,
    borderRadius: theme.BORDER_RADIUS.lg,
    shadowColor: theme.COLORS.primary.red,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  emptyStatsCard: {
    padding: theme.SPACING.lg,
    backgroundColor: theme.COLORS.ui.card,
    borderRadius: theme.BORDER_RADIUS.lg,
    shadowColor: theme.COLORS.primary.red,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  goalInsightsCard: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  refreshIconButton: {
    padding: theme.SPACING.sm,
  },
  emptyStateContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.SPACING.lg,
  },
  checkInButton: {
    marginTop: theme.SPACING.md,
  }
}); 