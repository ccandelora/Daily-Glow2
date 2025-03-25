import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated, ScrollView } from 'react-native';
import { Typography, Card } from '@/components/common';
import { useAchievements } from '@/contexts/AchievementsContext';
import { useBadges } from '@/contexts/BadgeContext';
import { useCheckInStreak } from '@/contexts/CheckInStreakContext';
import { useJournal } from '@/contexts/JournalContext';
import { useMood, Mood } from '@/contexts/MoodContext';
import { useProfile } from '@/contexts/UserProfileContext';
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
  console.log('StatisticsDashboard: Component rendering started');
  
  // Access contexts with try/catch to prevent crashes
  let achievements = [];
  let userAchievements = [];
  let badges = [];
  let userBadges = [];
  let overallStreak = 0;
  let journalEntries: any[] = [];
  let userProfile = null;
  let moods: any[] = [];
  
  try {
    const achievementsContext = useAchievements();
    achievements = achievementsContext.achievements || [];
    userAchievements = achievementsContext.userAchievements || [];
  } catch (error) {
    console.error('Error accessing achievements context:', error);
  }
  
  try {
    const badgesContext = useBadges();
    badges = badgesContext.badges || [];
    userBadges = badgesContext.userBadges || [];
  } catch (error) {
    console.error('Error accessing badges context:', error);
  }
  
  try {
    const streakContext = useCheckInStreak();
    overallStreak = streakContext.overallStreak || 0;
  } catch (error) {
    console.error('Error accessing streak context:', error);
  }
  
  try {
    const journalContext = useJournal();
    journalEntries = journalContext.entries || [];
  } catch (error) {
    console.error('Error accessing journal context:', error);
  }
  
  try {
    const profileContext = useProfile();
    userProfile = profileContext.userProfile;
  } catch (error) {
    console.error('Error accessing profile context:', error);
  }
  
  // Get moods safely
  try {
    const { moods: moodsData } = useMood();
    if (moodsData && Array.isArray(moodsData)) {
      moods = moodsData;
    }
  } catch (error) {
    console.log('MoodContext not available in StatisticsDashboard');
  }
  
  // Calculate total points from user achievements
  const totalPoints = calculateTotalPoints(userAchievements, achievements, userProfile);
  console.log('Calculated total points:', totalPoints);
  
  // Calculate mood statistics
  const moodStats = calculateMoodStats(moods);
  
  // Simple stats for display
  const stats = {
    totalPoints,
    achievementsEarned: userAchievements.length,
    achievementsTotal: achievements.length || 16, // Fallback to 16 if no achievements available
    badgesEarned: userBadges.length,
    badgesTotal: badges.length || 27, // Fallback to 27 if no badges available
    currentStreak: overallStreak,
    highestStreak: overallStreak,
    journalCount: journalEntries.length,
    positiveMoodCount: moodStats.positive,
    neutralMoodCount: moodStats.neutral,
    negativeMoodCount: moodStats.negative,
    journalsLastWeek: calculateRecentEntries(journalEntries, 7),
    journalsLastMonth: calculateRecentEntries(journalEntries, 30),
    moodTrend: moodStats.trend,
  };
  
  // Helper function to calculate total points
  function calculateTotalPoints(userAchievements: any[], achievements: any[], userProfile: any): number {
    // First check if we can get points from user profile
    if (userProfile && typeof userProfile.points === 'number' && userProfile.points > 0) {
      console.log('Using points from user profile:', userProfile.points);
      return userProfile.points;
    }
    
    // If not, calculate from achievements
    if (userAchievements && Array.isArray(userAchievements) && userAchievements.length > 0 && 
        achievements && Array.isArray(achievements)) {
      
      try {
        // Calculate by summing up points from each achievement
        const points = userAchievements.reduce((total, ua) => {
          // Find the achievement by ID
          const achievement = achievements.find(a => a.id === ua.achievement_id);
          // Add points if achievement exists and has points
          return total + (achievement?.points || 0);
        }, 0);
        
        console.log('Calculated points from achievements:', points);
        return points;
      } catch (error) {
        console.error('Error calculating points from achievements:', error);
      }
    }
    
    // Fallback: check if first user achievement has an embedded achievement with points
    if (userAchievements && userAchievements.length > 0 && 
        userAchievements[0].achievement && 
        typeof userAchievements[0].achievement.points === 'number') {
      
      try {
        const points = userAchievements.reduce((total, ua) => {
          return total + (ua.achievement?.points || 0);
        }, 0);
        
        console.log('Calculated points from embedded achievements:', points);
        return points;
      } catch (error) {
        console.error('Error calculating points from embedded achievements:', error);
      }
    }
    
    // If user has at least one achievement, assume they have some points
    // but we couldn't calculate exactly, so return a sensible default
    if (userAchievements && userAchievements.length > 0) {
      return userAchievements.length * 25; // Estimate 25 points per achievement
    }
    
    // No way to calculate points, return 0
    return 0;
  }
  
  // Helper function to calculate recent entries
  function calculateRecentEntries(entries: any[], days: number): number {
    if (!entries || !Array.isArray(entries) || entries.length === 0) return 0;
    
    try {
      const now = new Date();
      const cutoffDate = new Date(now);
      cutoffDate.setDate(now.getDate() - days);
      
      // Filter entries after the cutoff date
      return entries.filter(entry => {
        try {
          // Try to get the date from created_at or date field
          const entryDate = entry.created_at 
            ? new Date(entry.created_at)
            : (entry.date ? new Date(entry.date) : null);
            
          // Skip entries with invalid dates
          if (!entryDate || isNaN(entryDate.getTime())) return false;
          
          return entryDate >= cutoffDate;
        } catch (error) {
          console.error('Error parsing entry date:', error);
          return false;
        }
      }).length;
    } catch (error) {
      console.error(`Error calculating entries for last ${days} days:`, error);
      return 0;
    }
  }
  
  // Helper function to calculate mood statistics
  function calculateMoodStats(moodData: any[]): { 
    positive: number; 
    neutral: number; 
    negative: number; 
    trend: 'improving' | 'declining' | 'stable' 
  } {
    // Default values if no mood data available
    if (!moodData || !Array.isArray(moodData) || moodData.length === 0) {
      return {
        positive: 0,
        neutral: 0,
        negative: 0,
        trend: 'stable'
      };
    }
    
    try {
      // Count different mood types
      let positive = 0;
      let neutral = 0;
      let negative = 0;
      
      moodData.forEach(mood => {
        const moodValue = typeof mood.value === 'number' ? mood.value : 0;
        
        if (moodValue >= 4) {
          positive++;
        } else if (moodValue >= 2) {
          neutral++;
        } else {
          negative++;
        }
      });
      
      // Determine mood trend based on recent entries
      let trend: 'improving' | 'declining' | 'stable' = 'stable';
      
      if (moodData.length >= 5) {
        // Sort moods by date (newest first)
        const sortedMoods = [...moodData].sort((a, b) => {
          const dateA = new Date(a.created_at || 0);
          const dateB = new Date(b.created_at || 0);
          return dateB.getTime() - dateA.getTime();
        });
        
        // Get 5 most recent moods
        const recentMoods = sortedMoods.slice(0, 5);
        
        // Compare early vs late moods to determine trend
        const earlyAvg = (recentMoods[3]?.value || 0) + (recentMoods[4]?.value || 0);
        const lateAvg = (recentMoods[0]?.value || 0) + (recentMoods[1]?.value || 0) + (recentMoods[2]?.value || 0);
        
        if (lateAvg/3 > earlyAvg/2 + 0.5) {
          trend = 'improving';
        } else if (lateAvg/3 < earlyAvg/2 - 0.5) {
          trend = 'declining';
        }
      }
      
      return { positive, neutral, negative, trend };
    } catch (error) {
      console.error('Error calculating mood stats:', error);
      return { positive: 0, neutral: 0, negative: 0, trend: 'stable' };
    }
  }
  
  console.log('StatisticsDashboard: Using stats:', stats);
  
  // Calculate percentages
  const achievementProgress = stats.achievementsTotal > 0 
    ? (stats.achievementsEarned / stats.achievementsTotal) 
    : 0;
    
  const badgeProgress = stats.badgesTotal > 0 
    ? (stats.badgesEarned / stats.badgesTotal) 
    : 0;
  
  // Simple fixed chart data
  const achievementChartData = [
    { 
      value: Math.max(0.01, stats.achievementsEarned), 
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
  ];
  
  const badgeChartData = [
    { 
      value: Math.max(0.01, stats.badgesEarned), 
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
  ];
  
  const moodChartData = [
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
  ];
  
  // Format percentages for display
  const achievementPercentText = `${Math.round(achievementProgress * 100)}%`;
  const badgePercentText = `${Math.round(badgeProgress * 100)}%`;
  
  // Animation to fade in the component
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  
  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);
  
  // Helper function to get mood trend icon name
  function getMoodTrendIcon(trend: 'improving' | 'declining' | 'stable'): string {
    switch (trend) {
      case 'improving': return "arrow-trend-up";
      case 'declining': return "arrow-trend-down";
      default: return "minus";
    }
  }
  
  // Helper function to get mood trend color
  function getMoodTrendColor(trend: 'improving' | 'declining' | 'stable'): string {
    switch (trend) {
      case 'improving': return theme.COLORS.primary.green;
      case 'declining': return theme.COLORS.primary.red;
      default: return theme.COLORS.primary.yellow;
    }
  }
  
  // Helper function to format trend text for display
  function getTrendDisplayText(trend: 'improving' | 'declining' | 'stable'): string {
    return trend.charAt(0).toUpperCase() + trend.slice(1);
  }
  
  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
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
                name={getMoodTrendIcon(stats.moodTrend)}
                size={16} 
                color={getMoodTrendColor(stats.moodTrend)}
                style={styles.moodTrendIcon}
              />
              <Typography 
                variant="body" 
                color={getMoodTrendColor(stats.moodTrend)}
                style={styles.moodTrendText}
              >
                {getTrendDisplayText(stats.moodTrend)}
              </Typography>
            </View>
          </View>
          
          <View style={styles.moodChartContainer}>
            <PieChart
              style={styles.moodChart}
              data={moodChartData}
              innerRadius={CHART_SIZE / 4}
              outerRadius={CHART_SIZE / 2.5}
              padAngle={0.02}
            />
          </View>
        </View>
        
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
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  totalStatsCard: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: theme.COLORS.ui.card,
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodChart: {
    height: CHART_SIZE * 0.9, 
    width: CHART_SIZE * 0.9
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
  fallbackCard: {
    padding: 16,
  },
  fallbackText: {
    marginBottom: 8,
  },
}); 