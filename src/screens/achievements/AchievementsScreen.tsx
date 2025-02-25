import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography, Card, Button, VideoBackground } from '@/components/common';
import { useNotifications } from '@/contexts/NotificationsContext';
import { useChallenges } from '@/contexts/ChallengesContext';
import { useProfile } from '@/contexts/UserProfileContext';
import { AchievementsTab } from '@/components/profile/AchievementsTab';
import { BadgesTab } from '@/components/profile/BadgesTab';
import { StreaksTab } from '@/components/profile/StreaksTab';
import theme from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useCheckInStreak } from '@/contexts/CheckInStreakContext';
import { useBadges } from '@/contexts/BadgeContext';
import { useAchievements } from '@/contexts/AchievementsContext';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

type ProfileTab = 'achievements' | 'badges' | 'streaks';

export const AchievementsScreen: React.FC = () => {
  const router = useRouter();
  const { userBadges } = useBadges();
  const { userStats } = useChallenges();
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
      
      // Use the highest streak value
      const calculatedStreak = Math.max(profileStreak, morningStreak, afternoonStreak, eveningStreak);
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

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Fetch latest data when component mounts - only once
    fetchLatestData();
    
    // Debug data
    console.log('AchievementsScreen - userProfile:', userProfile);
    console.log('AchievementsScreen - userBadges:', userBadges);
    console.log('AchievementsScreen - streaks:', streaks);
    console.log('AchievementsScreen - totalPoints:', totalPoints);
    console.log('AchievementsScreen - badgesCount:', badgesCount);
    console.log('AchievementsScreen - currentStreak:', currentStreak);
  }, []); // Empty dependency array to run only once on mount

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
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Typography variant="h1" style={styles.title}>
            Achievements
          </Typography>
          <Typography variant="body" style={styles.subtitle}>
            Track your progress and earn rewards
          </Typography>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Typography variant="h3" style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
              {totalPoints}
            </Typography>
            <Typography variant="caption" style={styles.statLabel}>
              Points
            </Typography>
          </View>
          <View style={styles.statCard}>
            <Typography variant="h3" style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
              {badgesCount}
            </Typography>
            <Typography variant="caption" style={styles.statLabel}>
              Badges
            </Typography>
          </View>
          <View style={styles.statCard}>
            <Typography variant="h3" style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
              {currentStreak}
            </Typography>
            <Typography variant="caption" style={styles.statLabel}>
              Streak
            </Typography>
          </View>
        </View>

        <Card style={styles.tabsSection}>
          <View style={styles.tabButtons}>
            <Button
              title="Achieve"
              onPress={() => setActiveTab('achievements')}
              variant={activeTab === 'achievements' ? 'primary' : 'secondary'}
              style={styles.tabButtonSmall}
              size="compact"
            />
            <Button
              title="Badges"
              onPress={() => setActiveTab('badges')}
              variant={activeTab === 'badges' ? 'primary' : 'secondary'}
              style={styles.tabButtonSmall}
              size="compact"
            />
            <Button
              title="Streaks"
              onPress={() => setActiveTab('streaks')}
              variant={activeTab === 'streaks' ? 'primary' : 'secondary'}
              style={styles.tabButtonSmall}
              size="compact"
            />
          </View>
          {renderTabContent()}
        </Card>
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
  content: {
    padding: theme.SPACING.lg,
    paddingBottom: 100, // Extra padding at the bottom for scrolling
  },
  header: {
    marginTop: 60,
    marginBottom: theme.SPACING.xl,
  },
  title: {
    color: theme.COLORS.ui.text,
    marginBottom: theme.SPACING.sm,
  },
  subtitle: {
    color: theme.COLORS.ui.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.SPACING.xl,
  },
  statCard: {
    backgroundColor: theme.COLORS.ui.card,
    borderRadius: theme.BORDER_RADIUS.md,
    padding: theme.SPACING.md,
    alignItems: 'center',
    width: '30%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabsSection: {
    marginBottom: theme.SPACING.xl,
    padding: theme.SPACING.lg,
  },
  tabButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.SPACING.md,
    width: '100%', // Ensure full width
    paddingHorizontal: theme.SPACING.sm,
  },
  tabButton: {
    flex: 1,
    marginHorizontal: 2,
    paddingHorizontal: 0,
    minWidth: 0,
  },
  tabButtonSmall: {
    flex: 1,
    width: '30%',
    marginHorizontal: 4,
    paddingHorizontal: 0,
    minWidth: 0,
    height: 40, // Fixed height for buttons
    justifyContent: 'center', // Center text vertically
    alignItems: 'center', // Center text horizontally
  },
  statValue: {
    fontSize: theme.FONTS.sizes.xl,
    fontWeight: 'bold',
    color: theme.COLORS.ui.text,
  },
  statLabel: {
    fontSize: theme.FONTS.sizes.sm,
    color: theme.COLORS.ui.textSecondary,
  },
}); 