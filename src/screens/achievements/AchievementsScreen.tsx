import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Animated, ViewStyle } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Typography, Card, Button, VideoBackground, Header } from '@/components/common';
import { useNotifications } from '@/contexts/NotificationsContext';
import { useChallenges } from '@/contexts/ChallengesContext';
import { useProfile } from '@/contexts/UserProfileContext';
import { AchievementsTab } from '@/components/profile/AchievementsTab';
import { BadgesTab } from '@/components/profile/BadgesTab';
import { StreaksTab } from '@/components/profile/StreaksTab';
import theme from '@/constants/theme';
import { FontAwesome6 } from '@expo/vector-icons';
import { useCheckInStreak } from '@/contexts/CheckInStreakContext';
import { useBadges } from '@/contexts/BadgeContext';
import { useAchievements } from '@/contexts/AchievementsContext';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { calculateOverallStreak } from '@/utils/streakCalculator';

type ProfileTab = 'achievements' | 'badges' | 'streaks';

export const AchievementsScreen: React.FC = () => {
  const router = useRouter();
  const { userBadges } = useBadges();
  const { userStats, refreshDailyChallenge } = useChallenges();
  const { userProfile, refreshProfile } = useProfile();
  const { streaks, refreshStreaks } = useCheckInStreak();
  const { userAchievements } = useAchievements();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>('achievements');
  const [totalPoints, setTotalPoints] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  
  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  // Fetch the most up-to-date data
  const fetchLatestData = async () => {
    if (!user) return;
    
    try {
      // Refresh profile data
      await refreshProfile();
      
      // Refresh streaks data
      await refreshStreaks();
      
      // Refresh challenges data to get latest points
      await refreshDailyChallenge();
      
      // Get user stats (total_points and level)
      let totalUserPoints = 0;
      let userLevel = 0;
      
      try {
        const { data: userStatsData, error: userStatsError } = await supabase
          .from('user_stats')
          .select('total_points, level')
          .eq('user_id', user.id)
          .single();
          
        if (userStatsError) {
          console.log('Error fetching user stats:', userStatsError);
        } else if (userStatsData) {
          totalUserPoints = userStatsData.total_points || 0;
          userLevel = userStatsData.level || 0;
          console.log('User stats found:', userStatsData);
        }
      } catch (error) {
        console.error('Error processing user stats:', error);
      }
      
      // Get points from user_challenges (points_awarded)
      let challengePoints = 0;
      try {
        const { data: challengeData, error: challengeError } = await supabase
          .from('user_challenges')
          .select('points_awarded')
          .eq('user_id', user.id);
          
        if (challengeError) {
          console.log('Error fetching challenge points:', challengeError);
        } else if (challengeData && challengeData.length > 0) {
          challengePoints = challengeData.reduce((sum, item) => sum + (item.points_awarded || 0), 0);
          console.log(`Found ${challengeData.length} challenges with total points: ${challengePoints}`);
        }
      } catch (error) {
        console.error('Error processing challenge points:', error);
      }
      
      // Get points from achievements
      const achievementPoints = userAchievements.reduce((total, ua) => {
        return total + (ua.achievement?.points || 0);
      }, 0);
      
      // Get profile points
      const profilePoints = userProfile?.points || 0;
      
      // Set total points - prioritize user_stats.total_points if available
      const calculatedTotalPoints = totalUserPoints > 0 ? 
        totalUserPoints : 
        (challengePoints + achievementPoints + profilePoints);
        
      setTotalPoints(calculatedTotalPoints);
      
      // Get current streak from profile and streaks
      const profileStreak = userProfile?.streak || 0;
      const morningStreak = streaks?.morning || 0;
      const afternoonStreak = streaks?.afternoon || 0;
      const eveningStreak = streaks?.evening || 0;
      
      // Use the standardized streak calculation utility
      const calculatedStreak = calculateOverallStreak(streaks);
      
      setCurrentStreak(calculatedStreak);
      
      console.log('Fetched latest data:');
      console.log('- User stats total points:', totalUserPoints);
      console.log('- User level:', userLevel);
      console.log('- Challenge points:', challengePoints);
      console.log('- Achievement points:', achievementPoints);
      console.log('- Profile points:', profilePoints);
      console.log('- Total points (calculated):', calculatedTotalPoints);
      console.log('- Profile streak:', profileStreak);
      console.log('- Morning streak:', morningStreak);
      console.log('- Afternoon streak:', afternoonStreak);
      console.log('- Evening streak:', eveningStreak);
      console.log('- Calculated streak:', calculatedStreak);
    } catch (error) {
      console.error('Error fetching latest data:', error);
    }
  };

  // Get badges count
  const badgesCount = React.useMemo(() => {
    return userBadges?.length || 0;
  }, [userBadges]);

  // Use useFocusEffect to refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('AchievementsScreen focused - refreshing data');
      fetchLatestData();
      
      return () => {
        // Cleanup if needed
      };
    }, [])
  );

  // Animation for tab content
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeTab]);

  // Update the UI when userStats changes
  useEffect(() => {
    if (userStats && userStats.total_points > 0) {
      setTotalPoints(userStats.total_points);
      console.log('Updated points from userStats:', userStats.total_points);
    }
  }, [userStats]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'achievements':
        return <AchievementsTab />;
      case 'badges':
        return <BadgesTab />;
      case 'streaks':
        return <StreaksTab />;
      default:
        return <AchievementsTab />;
    }
  };

  return (
    <View style={styles.container}>
      <VideoBackground />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <Header showBranding={true} />
        
        <View style={styles.content}>
          <Typography variant="h1" style={styles.title}>
            Achievements
          </Typography>

          <Card style={styles.statsCard} variant="glow">
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Typography variant="h3" style={styles.statValue} color={theme.COLORS.primary.green}>
                  {totalPoints}
                </Typography>
                <Typography variant="caption" style={styles.statLabel}>
                  Total Points
                </Typography>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <Typography variant="h3" style={styles.statValue} color={theme.COLORS.primary.green}>
                  {currentStreak}
                </Typography>
                <Typography variant="caption" style={styles.statLabel}>
                  Day Streak
                </Typography>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <Typography variant="h3" style={styles.statValue} color={theme.COLORS.primary.green}>
                  {badgesCount}
                </Typography>
                <Typography variant="caption" style={styles.statLabel}>
                  Badges
                </Typography>
              </View>
            </View>
          </Card>

          <View style={styles.tabsContainer}>
            <View style={styles.tabButtons}>
              <Button
                title="Achievements"
                variant={activeTab === 'achievements' ? 'primary' : 'secondary'}
                onPress={() => setActiveTab('achievements')}
                style={{
                  ...styles.tabButton,
                  ...(activeTab === 'achievements' ? styles.activeTabButton : {})
                }}
                textStyle={
                  activeTab === 'achievements'
                    ? styles.activeTabText
                    : styles.inactiveTabText
                }
              />
              <Button
                title="Badges"
                variant={activeTab === 'badges' ? 'primary' : 'secondary'}
                onPress={() => setActiveTab('badges')}
                style={{
                  ...styles.tabButton,
                  ...(activeTab === 'badges' ? styles.activeTabButton : {})
                }}
                textStyle={
                  activeTab === 'badges'
                    ? styles.activeTabText
                    : styles.inactiveTabText
                }
              />
              <Button
                title="Streaks"
                variant={activeTab === 'streaks' ? 'primary' : 'secondary'}
                onPress={() => setActiveTab('streaks')}
                style={{
                  ...styles.tabButton,
                  ...(activeTab === 'streaks' ? styles.activeTabButton : {})
                }}
                textStyle={
                  activeTab === 'streaks'
                    ? styles.activeTabText
                    : styles.inactiveTabText
                }
              />
            </View>

            <Animated.View
              style={[
                styles.tabContent,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {renderTabContent()}
            </Animated.View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
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
  },
  statsCard: {
    marginBottom: theme.SPACING.md,
    padding: theme.SPACING.md,
    backgroundColor: 'rgba(38, 20, 60, 0.85)',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: theme.SPACING.xs,
  },
  statLabel: {
    color: theme.COLORS.ui.textSecondary,
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: `${theme.COLORS.ui.border}50`,
  },
  tabsContainer: {
    marginTop: theme.SPACING.md,
  },
  tabButtons: {
    flexDirection: 'row',
    marginBottom: theme.SPACING.md,
  },
  tabButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: theme.SPACING.sm,
  } as ViewStyle,
  activeTabButton: {
    backgroundColor: theme.COLORS.primary.green,
  } as ViewStyle,
  activeTabText: {
    color: theme.COLORS.ui.background,
    fontWeight: 'bold',
  },
  inactiveTabText: {
    color: theme.COLORS.ui.textSecondary,
  },
  tabContent: {
    minHeight: 300,
  },
  // ... rest of the styles ...
}); 