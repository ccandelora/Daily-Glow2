import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated, ScrollView } from 'react-native';
import { Typography, Card } from '@/components/common';
import { useAchievements } from '@/contexts/AchievementsContext';
import { useBadges } from '@/contexts/BadgeContext';
import { useCheckInStreak } from '@/contexts/CheckInStreakContext';
import { useJournal } from '@/contexts/JournalContext';
import { useMood, Mood } from '@/contexts/MoodContext';
import { FontAwesome6 } from '@expo/vector-icons';
import theme from '@/constants/theme';
import { PieChart } from 'react-native-svg-charts';
import { getCompatibleIconName } from '@/utils/iconUtils';

// Define chart dimensions
const { width } = Dimensions.get('window');
const CHART_SIZE = width * 0.4;
const CHART_PADDING = 30;

// Define data point type for charts
interface ChartDataPoint {
  value: number;
  key: string;
  svg: {
    fill: string;
  };
  arc?: {
    innerRadius?: number;
    padAngle?: number;
  };
}

/**
 * StatisticsDashboard component displays statistics about achievements and badges
 */
export const StatisticsDashboard: React.FC = () => {
  const { achievements, userAchievements } = useAchievements();
  const { badges, userBadges } = useBadges();
  const { overallStreak } = useCheckInStreak();
  const { entries: journalEntries } = useJournal();
  
  // Get moods safely, handling case where context might not be available
  let moods: any[] = [];
  try {
    const { moods: moodsData } = useMood();
    if (moodsData && Array.isArray(moodsData)) {
      moods = moodsData;
    }
  } catch (error) {
    console.log('MoodContext not available in StatisticsDashboard');
  }
  
  // Animation values
  const fadeInAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;
  
  // Progress state
  const [achievementProgress, setAchievementProgress] = useState(0);
  const [badgeProgress, setBadgeProgress] = useState(0);
  
  // Stats state
  const [stats, setStats] = useState({
    totalPoints: 0,
    achievementsEarned: 0,
    achievementsTotal: 0,
    badgesEarned: 0,
    badgesTotal: 0,
    highestStreak: 0,
    currentStreak: 0,
    journalCount: 0,
    positiveMoodCount: 0,
    neutralMoodCount: 0,
    negativeMoodCount: 0,
    journalsLastWeek: 0,
    journalsLastMonth: 0,
    moodTrend: 'stable' as 'improving' | 'declining' | 'stable',
  });
  
  // Memoize mood trend calculation to prevent unnecessary recalculations
  const moodTrendData = useMemo(() => {
    // Default values
    let positiveMoodCount = 0;
    let neutralMoodCount = 0;
    let negativeMoodCount = 0;
    let moodTrend: 'improving' | 'declining' | 'stable' = 'stable';
    
    // Process moods
    if (moods && moods.length > 0) {
      moods.forEach((mood: Mood) => {
        const moodValue = mood.value;
        if (moodValue >= 4) {
          positiveMoodCount++;
        } else if (moodValue >= 2) {
          neutralMoodCount++;
        } else {
          negativeMoodCount++;
        }
      });
      
      // Determine mood trend
      if (moods.length >= 5) {
        // Get the 5 most recent moods
        const recentMoods = [...moods]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);
        
        // Calculate the average of first 2 moods vs last 3 moods
        const earlyAvg = (recentMoods[3]?.value || 0) + (recentMoods[4]?.value || 0);
        const lateAvg = (recentMoods[0]?.value || 0) + (recentMoods[1]?.value || 0) + (recentMoods[2]?.value || 0);
        
        if (lateAvg/3 > earlyAvg/2 + 0.5) {
          moodTrend = 'improving';
        } else if (lateAvg/3 < earlyAvg/2 - 0.5) {
          moodTrend = 'declining';
        }
      }
    }
    
    return {
      positiveMoodCount,
      neutralMoodCount,
      negativeMoodCount,
      moodTrend
    };
  }, [moods]);
  
  // Stabilize animation start function
  const startAnimations = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeInAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeInAnim, scaleAnim]);

  // Add a check to prevent re-renders when data hasn't actually changed
  const prevOverallStreakRef = useRef(overallStreak);
  const prevMoodTrendDataRef = useRef(moodTrendData);
  const prevAchievementsRef = useRef(achievements.length);
  const prevUserAchievementsRef = useRef(userAchievements.length);
  const prevBadgesRef = useRef(badges.length);
  const prevUserBadgesRef = useRef(userBadges.length);
  const prevJournalEntriesRef = useRef(journalEntries.length);
  
  // Calculate and update statistics only when data actually changes
  useEffect(() => {
    // Skip if nothing important has changed to avoid unnecessary re-renders
    if (
      prevOverallStreakRef.current === overallStreak &&
      prevMoodTrendDataRef.current === moodTrendData &&
      prevAchievementsRef.current === achievements.length &&
      prevUserAchievementsRef.current === userAchievements.length &&
      prevBadgesRef.current === badges.length &&
      prevUserBadgesRef.current === userBadges.length &&
      prevJournalEntriesRef.current === journalEntries.length
    ) {
      return;
    }
    
    // Update refs
    prevOverallStreakRef.current = overallStreak;
    prevMoodTrendDataRef.current = moodTrendData;
    prevAchievementsRef.current = achievements.length;
    prevUserAchievementsRef.current = userAchievements.length; 
    prevBadgesRef.current = badges.length;
    prevUserBadgesRef.current = userBadges.length;
    prevJournalEntriesRef.current = journalEntries.length;
    
    console.log('StatisticsDashboard: Recalculating stats');
    
    // Calculate total points from earned achievements
    const totalPoints = userAchievements.reduce((sum, ua) => {
      return sum + (ua.achievement?.points || 0);
    }, 0);
    
    // Set achievements progress
    const achievementsEarned = userAchievements.length;
    const achievementsTotal = achievements.length;
    const achievementPercentage = achievementsTotal > 0 
      ? (achievementsEarned / achievementsTotal) 
      : 0;
    
    // Set badges progress
    const badgesEarned = userBadges.length;
    const badgesTotal = badges.length;
    const badgePercentage = badgesTotal > 0 
      ? (badgesEarned / badgesTotal) 
      : 0;
    
    // Calculate journal statistics
    const journalCount = journalEntries.length;
    
    // Calculate journals in the last week and month
    const now = new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);
    
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(now.getMonth() - 1);
    
    const journalsLastWeek = journalEntries.filter(entry => {
      const entryDate = new Date(entry.created_at);
      return entryDate >= oneWeekAgo;
    }).length;
    
    const journalsLastMonth = journalEntries.filter(entry => {
      const entryDate = new Date(entry.created_at);
      return entryDate >= oneMonthAgo;
    }).length;
    
    // Use current values from props, don't depend on previous state
    const currentStreak = overallStreak || 0;
    const highestStreak = currentStreak; // Just use current streak as highest
    
    // Update state atomically with all values
    setAchievementProgress(achievementPercentage);
    setBadgeProgress(badgePercentage);
    
    setStats({
      totalPoints,
      achievementsEarned,
      achievementsTotal,
      badgesEarned,
      badgesTotal,
      highestStreak,
      currentStreak,
      journalCount,
      positiveMoodCount: moodTrendData.positiveMoodCount,
      neutralMoodCount: moodTrendData.neutralMoodCount,
      negativeMoodCount: moodTrendData.negativeMoodCount,
      journalsLastWeek,
      journalsLastMonth,
      moodTrend: moodTrendData.moodTrend,
    });
    
    // Start animations with the stabilized function
    startAnimations();
  }, [
    achievements, 
    userAchievements, 
    badges, 
    userBadges, 
    overallStreak, 
    journalEntries, 
    moodTrendData,
    startAnimations
  ]);
  
  // Prepare chart data for achievements
  const achievementChartData: ChartDataPoint[] = [
    { 
      value: stats.achievementsEarned, 
      key: 'earned',
      svg: { fill: theme.COLORS.primary.teal },
      arc: { innerRadius: CHART_SIZE / 6, padAngle: 0.02 }
    },
    { 
      value: Math.max(0.01, stats.achievementsTotal - stats.achievementsEarned), 
      key: 'remaining',
      svg: { fill: 'rgba(255, 255, 255, 0.1)' },
      arc: { innerRadius: CHART_SIZE / 6, padAngle: 0.02 }
    }
  ].filter(item => item.value > 0);
  
  // Prepare chart data for badges
  const badgeChartData: ChartDataPoint[] = [
    { 
      value: stats.badgesEarned, 
      key: 'earned',
      svg: { fill: theme.COLORS.primary.green },
      arc: { innerRadius: CHART_SIZE / 6, padAngle: 0.02 }
    },
    { 
      value: Math.max(0.01, stats.badgesTotal - stats.badgesEarned), 
      key: 'remaining',
      svg: { fill: 'rgba(255, 255, 255, 0.1)' },
      arc: { innerRadius: CHART_SIZE / 6, padAngle: 0.02 }
    }
  ].filter(item => item.value > 0);
  
  // Prepare chart data for moods
  const moodChartData: ChartDataPoint[] = [
    { 
      value: stats.positiveMoodCount, 
      key: 'positive',
      svg: { fill: theme.COLORS.primary.green },
      arc: { innerRadius: CHART_SIZE / 6, padAngle: 0.02 }
    },
    { 
      value: stats.neutralMoodCount, 
      key: 'neutral',
      svg: { fill: theme.COLORS.primary.yellow },
      arc: { innerRadius: CHART_SIZE / 6, padAngle: 0.02 }
    },
    { 
      value: stats.negativeMoodCount, 
      key: 'negative',
      svg: { fill: theme.COLORS.primary.red },
      arc: { innerRadius: CHART_SIZE / 6, padAngle: 0.02 }
    }
  ].filter(item => item.value > 0);
  
  // Calculate percentage values
  const achievementPercentText = `${Math.round(achievementProgress * 100)}%`;
  const badgePercentText = `${Math.round(badgeProgress * 100)}%`;
  
  // Get mood trend icon and color
  const getMoodTrendIcon = () => {
    switch (stats.moodTrend) {
      case 'improving':
        return { name: getCompatibleIconName('arrow-trend-up'), color: theme.COLORS.primary.green };
      case 'declining':
        return { name: getCompatibleIconName('arrow-trend-down'), color: theme.COLORS.primary.red };
      default:
        return { name: getCompatibleIconName('minus'), color: theme.COLORS.primary.yellow };
    }
  };
  
  const moodTrendIcon = getMoodTrendIcon();
  
  return (
    <View>
      <Animated.View 
        style={[
          styles.container,
          {
            opacity: fadeInAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <Card style={styles.totalStatsCard} variant="glow">
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <FontAwesome6 name={getCompatibleIconName("trophy")} size={20} color={theme.COLORS.primary.teal} style={styles.statIcon} />
              <Typography variant="h2" color={theme.COLORS.primary.teal} glow="medium">
                {stats.totalPoints}
              </Typography>
              <Typography variant="caption" color={theme.COLORS.ui.textSecondary}>
                Total Points
              </Typography>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.stat}>
              <FontAwesome6 name={getCompatibleIconName("fire")} size={20} color={theme.COLORS.primary.orange} style={styles.statIcon} />
              <Typography variant="h2" color={theme.COLORS.primary.orange} glow="medium">
                {stats.currentStreak}
              </Typography>
              <Typography variant="caption" color={theme.COLORS.ui.textSecondary}>
                Current Streak
              </Typography>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.stat}>
              <FontAwesome6 name={getCompatibleIconName("award")} size={20} color={theme.COLORS.primary.yellow} style={styles.statIcon} />
              <Typography variant="h2" color={theme.COLORS.primary.yellow} glow="medium">
                {stats.highestStreak}
              </Typography>
              <Typography variant="caption" color={theme.COLORS.ui.textSecondary}>
                Highest Streak
              </Typography>
            </View>
          </View>
        </Card>
        
        <View style={styles.chartsRow}>
          <Card style={styles.chartCard} variant="default">
            <Typography variant="h3" style={styles.chartTitle} glow="soft">
              Achievements
            </Typography>
            
            <View style={styles.chartContainer}>
              <PieChart
                style={{ height: CHART_SIZE, width: CHART_SIZE }}
                data={achievementChartData}
                innerRadius={CHART_SIZE / 6}
                padAngle={0.02}
                animate={true}
              />
              
              <View style={styles.chartCenterLabel}>
                <Typography variant="h2" color={theme.COLORS.primary.teal} glow="medium">
                  {achievementPercentText}
                </Typography>
                <Typography variant="caption" color={theme.COLORS.ui.textSecondary}>
                  {stats.achievementsEarned} of {stats.achievementsTotal}
                </Typography>
              </View>
            </View>
          </Card>
          
          <Card style={styles.chartCard} variant="default">
            <Typography variant="h3" style={styles.chartTitle} glow="soft">
              Badges
            </Typography>
            
            <View style={styles.chartContainer}>
              <PieChart
                style={{ height: CHART_SIZE, width: CHART_SIZE }}
                data={badgeChartData}
                innerRadius={CHART_SIZE / 6}
                padAngle={0.02}
                animate={true}
              />
              
              <View style={styles.chartCenterLabel}>
                <Typography variant="h2" color={theme.COLORS.primary.green} glow="medium">
                  {badgePercentText}
                </Typography>
                <Typography variant="caption" color={theme.COLORS.ui.textSecondary}>
                  {stats.badgesEarned} of {stats.badgesTotal}
                </Typography>
              </View>
            </View>
          </Card>
        </View>
        
        <Card style={styles.moodCard} variant="default">
          <Typography variant="h3" style={styles.moodTitle} glow="soft">
            Mood Patterns
          </Typography>
          
          <View style={styles.moodDataContainer}>
            <View>
              <View style={styles.moodStats}>
                <View style={styles.moodStatItem}>
                  <Typography variant="body" color={theme.COLORS.primary.green}>
                    Positive: {stats.positiveMoodCount}
                  </Typography>
                </View>
                <View style={styles.moodStatItem}>
                  <Typography variant="body" color={theme.COLORS.primary.yellow}>
                    Neutral: {stats.neutralMoodCount}
                  </Typography>
                </View>
                <View style={styles.moodStatItem}>
                  <Typography variant="body" color={theme.COLORS.primary.red}>
                    Negative: {stats.negativeMoodCount}
                  </Typography>
                </View>
              </View>
              
              <View style={styles.moodTrend}>
                <Typography variant="body" style={styles.moodTrendLabel}>
                  Recent Trend:
                </Typography>
                <FontAwesome6 
                  name={getCompatibleIconName(moodTrendIcon.name)}
                  size={16} 
                  color={moodTrendIcon.color}
                  style={styles.moodTrendIcon}
                />
                <Typography 
                  variant="body" 
                  color={moodTrendIcon.color}
                  style={styles.moodTrendText}
                >
                  {stats.moodTrend.charAt(0).toUpperCase() + stats.moodTrend.slice(1)}
                </Typography>
              </View>
            </View>
            
            <View style={styles.moodChartContainer}>
              {moodChartData.length > 0 ? (
                <PieChart
                  style={{ height: CHART_SIZE * 0.9, width: CHART_SIZE * 0.9 }}
                  data={moodChartData}
                  innerRadius={CHART_SIZE / 8}
                  padAngle={0.02}
                  animate={true}
                />
              ) : (
                <View style={styles.noDataContainer}>
                  <Typography variant="caption" color={theme.COLORS.ui.textSecondary}>
                    No mood data yet
                  </Typography>
                </View>
              )}
            </View>
          </View>
        </Card>
        
        <Card style={styles.journalCard} variant="default">
          <Typography variant="h3" style={styles.journalTitle} glow="soft">
            Journal Activity
          </Typography>
          
          <View style={styles.journalStats}>
            <View style={styles.journalStatItem}>
              <FontAwesome6 name={getCompatibleIconName("book")} size={18} color={theme.COLORS.primary.purple} style={styles.journalIcon} />
              <Typography variant="h3" color={theme.COLORS.primary.purple} glow="medium">
                {stats.journalCount}
              </Typography>
              <Typography variant="caption" color={theme.COLORS.ui.textSecondary}>
                Total Entries
              </Typography>
            </View>
            
            <View style={styles.journalStatItem}>
              <FontAwesome6 name={getCompatibleIconName("calendar-week")} size={18} color={theme.COLORS.primary.blue} style={styles.journalIcon} />
              <Typography variant="h3" color={theme.COLORS.primary.blue} glow="medium">
                {stats.journalsLastWeek}
              </Typography>
              <Typography variant="caption" color={theme.COLORS.ui.textSecondary}>
                Last 7 Days
              </Typography>
            </View>
            
            <View style={styles.journalStatItem}>
              <FontAwesome6 name={getCompatibleIconName("calendar")} size={18} color={theme.COLORS.primary.teal} style={styles.journalIcon} />
              <Typography variant="h3" color={theme.COLORS.primary.teal} glow="medium">
                {stats.journalsLastMonth}
              </Typography>
              <Typography variant="caption" color={theme.COLORS.ui.textSecondary}>
                Last 30 Days
              </Typography>
            </View>
          </View>
        </Card>
        
        <Card style={styles.milestoneCard} variant="default">
          <Typography variant="h3" style={styles.milestoneTitle} glow="soft">
            Next Milestones
          </Typography>
          
          <View style={styles.milestoneRow}>
            <FontAwesome6 name={getCompatibleIconName("trophy")} size={16} color={theme.COLORS.primary.teal} />
            <Typography variant="body" style={styles.milestoneText}>
              Earn {stats.achievementsEarned + 1} of {stats.achievementsTotal} achievements
            </Typography>
            <Typography variant="caption" color={theme.COLORS.primary.teal}>
              {Math.round(achievementProgress * 100)}%
            </Typography>
          </View>
          
          <View style={styles.milestoneRow}>
            <FontAwesome6 name={getCompatibleIconName("award")} size={16} color={theme.COLORS.primary.green} />
            <Typography variant="body" style={styles.milestoneText}>
              Earn {stats.badgesEarned + 1} of {stats.badgesTotal} badges
            </Typography>
            <Typography variant="caption" color={theme.COLORS.primary.green}>
              {Math.round(badgeProgress * 100)}%
            </Typography>
          </View>
          
          <View style={styles.milestoneRow}>
            <FontAwesome6 name={getCompatibleIconName("fire")} size={16} color={theme.COLORS.primary.orange} />
            <Typography variant="body" style={styles.milestoneText}>
              Reach a {stats.currentStreak + 1} day streak
            </Typography>
            <Typography variant="caption" color={theme.COLORS.primary.orange}>
              {stats.currentStreak > 0 ? `Current: ${stats.currentStreak}` : 'Not started'}
            </Typography>
          </View>
          
          <View style={styles.milestoneRow}>
            <FontAwesome6 name={getCompatibleIconName("book")} size={16} color={theme.COLORS.primary.purple} />
            <Typography variant="body" style={styles.milestoneText}>
              Complete {stats.journalCount + (5 - (stats.journalCount % 5))} journal entries
            </Typography>
            <Typography variant="caption" color={theme.COLORS.primary.purple}>
              {stats.journalCount > 0 ? `Current: ${stats.journalCount}` : 'Not started'}
            </Typography>
          </View>
        </Card>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  totalStatsCard: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: 'rgba(38, 20, 60, 0.8)',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: 4,
  },
  divider: {
    width: 1,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  chartsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  chartCard: {
    width: '48%',
    backgroundColor: 'rgba(38, 20, 60, 0.5)',
    padding: 12,
  },
  chartTitle: {
    textAlign: 'center',
    marginBottom: 8,
    fontSize: 16,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  chartCenterLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodCard: {
    backgroundColor: 'rgba(38, 20, 60, 0.5)',
    padding: 16,
    marginBottom: 16,
  },
  moodTitle: {
    marginBottom: 12,
    fontSize: 18,
  },
  moodDataContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodStats: {
    marginBottom: 16,
  },
  moodStatItem: {
    marginBottom: 8,
  },
  moodTrend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodTrendLabel: {
    marginRight: 8,
  },
  moodTrendIcon: {
    marginRight: 4,
  },
  moodTrendText: {
    fontWeight: 'bold',
  },
  moodChartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
    width: 120,
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 60,
  },
  journalCard: {
    backgroundColor: 'rgba(38, 20, 60, 0.5)',
    padding: 16,
    marginBottom: 16,
  },
  journalTitle: {
    marginBottom: 12,
    fontSize: 18,
  },
  journalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  journalStatItem: {
    alignItems: 'center',
  },
  journalIcon: {
    marginBottom: 4,
  },
  milestoneCard: {
    backgroundColor: 'rgba(38, 20, 60, 0.5)',
    padding: 16,
  },
  milestoneTitle: {
    marginBottom: 12,
    fontSize: 18,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  milestoneText: {
    flex: 1,
    marginLeft: 12,
  },
}); 