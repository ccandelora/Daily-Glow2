import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, ScrollView, Animated, ViewStyle, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Typography, Card, Button, VideoBackground, Header, Icon } from '@/components/common';
import { useNotifications } from '@/contexts/NotificationsContext';
import { useChallenges } from '@/contexts/ChallengesContext';
import { useProfile } from '@/contexts/UserProfileContext';
import { SimpleAchievementTab } from '@/components/profile/SimpleAchievementTab';
import theme from '@/constants/theme';
import { useCheckInStreak } from '@/contexts/CheckInStreakContext';
import { useBadges, Badge } from '@/contexts/BadgeContext';
import { useAchievements } from '@/contexts/AchievementsContext';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { calculateOverallStreak } from '@/utils/streakCalculator';
import { FixedAchievementsTab } from '@/components/profile/FixedAchievementsTab';
import { Achievement } from '@/contexts/UserProfileContext';
import { LinearGradient } from 'expo-linear-gradient';

export const AchievementsScreen: React.FC = () => {
  const router = useRouter();
  const { userBadges, refreshBadges, isLoading: badgesLoading, badges } = useBadges();
  const { userStats, refreshDailyChallenge } = useChallenges();
  const { userProfile, refreshProfile, isLoading: profileLoading } = useProfile();
  const { streaks, refreshStreaks, overallStreak, isLoading: streaksLoading } = useCheckInStreak();
  const { userAchievements, refreshAchievements, isLoading: achievementsLoading, achievements } = useAchievements();
  const { user } = useAuth();
  
  // Try to use notifications if available
  let notificationsContext = null;
  try {
    notificationsContext = useNotifications();
  } catch (error) {
    console.log('NotificationsContext not available in AchievementsScreen, notifications will be disabled');
  }
  
  const [totalPoints, setTotalPoints] = useState(0);
  const [isDataRefreshing, setIsDataRefreshing] = useState(false);
  const [dataInitialized, setDataInitialized] = useState(false);
  
  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  // Determine loading state based on context loading states
  const isLoading = badgesLoading || profileLoading || streaksLoading || achievementsLoading || isDataRefreshing;

  // Add filter state
  const [activeFilter, setActiveFilter] = useState<'all' | 'earned' | 'inProgress'>('all');

  // Fetch the most up-to-date data
  const fetchLatestData = async () => {
    if (!user) return;
    
    setIsDataRefreshing(true);
    console.log('Fetching latest achievements data...');
    
    try {
      // Fetch all data in parallel for faster loading
      await Promise.all([
        refreshProfile().catch(e => console.log('Failed to refresh profile:', e)),
        refreshStreaks().catch(e => console.log('Failed to refresh streaks:', e)),
        refreshAchievements().catch(e => console.log('Failed to refresh achievements:', e)),
        refreshBadges().catch(e => console.log('Failed to refresh badges:', e)),
        refreshDailyChallenge().catch(e => console.log('Failed to refresh daily challenge:', e))
      ]);
      
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
          userLevel = userStatsData.level || 1;
          console.log('User stats found:', userStatsData);
        }
      } catch (statsError) {
        console.error('Exception fetching user stats:', statsError);
      }
      
      // Get various point sources
      const challengePoints = userStats?.total_points || 0;
      const achievementPoints = userAchievements.reduce((sum, ua) => sum + (ua.achievement?.points || 0), 0);
      const profilePoints = 0; // TODO: Calculate profile points
      
      // Calculate the total points from all sources
      const calculatedTotalPoints = Math.max(
        totalUserPoints,
        (challengePoints + achievementPoints + profilePoints)
      );
      
      setTotalPoints(calculatedTotalPoints);
      
      console.log('Fetched latest data:');
      console.log('- User stats total points:', totalUserPoints);
      console.log('- User level:', userLevel);
      console.log('- Challenge points:', challengePoints);
      console.log('- Achievement points:', achievementPoints);
      console.log('- Profile points:', profilePoints);
      console.log('- Total points (calculated):', calculatedTotalPoints);
      console.log('- Current streak:', overallStreak);
    } catch (error) {
      console.error('Error fetching latest data:', error);
    } finally {
      setIsDataRefreshing(false);
      setDataInitialized(true);
      console.log('Achievement data initialization completed');
      
      // Start animations after data is loaded
      fadeAnim.setValue(0);
      slideAnim.setValue(20);
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();
    }
  };

  // Get badges count
  const badgesCount = React.useMemo(() => {
    return userBadges?.length || 0;
  }, [userBadges]);

  // Use useEffect to fetch data when component mounts
  const isFocusEffectRunningRef = useRef(false);
  const initialFetchDoneRef = useRef(false);
  
  useEffect(() => {
    console.log('AchievementsScreen mounted - initializing data');
    if (!initialFetchDoneRef.current) {
      // Start loading animations immediately
      fadeAnim.setValue(0);
      slideAnim.setValue(20);
      
      fetchLatestData()
        .then(() => {
          initialFetchDoneRef.current = true;
          
          // Start animations after data is loaded
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true
            }),
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true
            })
          ]).start();
        })
        .catch(err => console.error('Error initializing data:', err));
    }
  }, []);
  
  // Use useFocusEffect to refresh data when screen comes into focus
  useFocusEffect(
    // Use useCallback with no dependencies to create a stable function reference
    React.useCallback(() => {
      // Only run if not already running and initial fetch is done
      if (!isFocusEffectRunningRef.current && initialFetchDoneRef.current) {
        console.log('AchievementsScreen focused - refreshing data (debounced)');
        isFocusEffectRunningRef.current = true;
        
        // Debounce the data refresh to avoid multiple rapid calls
        const timeoutId = setTimeout(() => {
          fetchLatestData()
            .finally(() => {
              isFocusEffectRunningRef.current = false;
            });
        }, 300);
        
        return () => {
          clearTimeout(timeoutId);
          isFocusEffectRunningRef.current = false;
        };
      }
      return () => {};
    }, [])
  );

  // Animation for content
  useEffect(() => {
    console.log('Running animations for AchievementsScreen');
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
  }, [fadeAnim, slideAnim]);

  // Update the UI when userStats changes
  useEffect(() => {
    if (userStats && userStats.total_points > 0) {
      setTotalPoints(userStats.total_points);
      console.log('Updated points from userStats:', userStats.total_points);
    }
  }, [userStats]);

  // Function to filter achievements based on active filter
  const filteredAchievements = React.useMemo(() => {
    if (!achievements) return [];
    
    switch (activeFilter) {
      case 'earned':
        return achievements.filter(achievement => 
          userAchievements?.some(ua => ua.achievement_id === achievement.id)
        );
      case 'inProgress':
        return achievements.filter(achievement => {
          const isEarned = userAchievements?.some(ua => ua.achievement_id === achievement.id);
          if (isEarned) return false;
          
          // For streak-based achievements, check if there's any progress
          if (achievement.requires_streak && overallStreak > 0) {
            return overallStreak < achievement.requires_streak;
          }
          
          return false;
        });
      case 'all':
      default:
        return achievements;
    }
  }, [achievements, userAchievements, activeFilter, overallStreak]);
  
  // Function to filter badges based on active filter
  const filteredBadges = React.useMemo(() => {
    if (!badges) return [];
    
    switch (activeFilter) {
      case 'earned':
        return badges.filter(badge => 
          userBadges?.some(ub => ub.badge_id === badge.id)
        );
      case 'inProgress':
        return badges.filter(badge => {
          const isEarned = userBadges?.some(ub => ub.badge_id === badge.id);
          return !isEarned;
        });
      case 'all':
      default:
        return badges;
    }
  }, [badges, userBadges, activeFilter]);

  return (
    <View style={styles.container}>
      <VideoBackground />
      
      {/* Dark overlay gradient */}
      <LinearGradient
        colors={[
          'rgba(28, 14, 45, 0.5)',
          'rgba(28, 14, 45, 0.3)',
          'rgba(28, 14, 45, 0.5)',
        ]}
        style={StyleSheet.absoluteFill}
      />
      
      <Header showBranding={true} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <Typography 
            variant="h1" 
            style={styles.title}
            glow="strong"
          >
            Achievements
          </Typography>
          <Typography 
            variant="body" 
            style={styles.subtitle}
            color={theme.COLORS.ui.textSecondary}
            glow="soft"
          >
            Track your progress and earn rewards
          </Typography>
        </View>
        
        {/* Stats cards */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Typography variant="h3" style={styles.statValue} glow="medium">
              {totalPoints}
            </Typography>
            <Typography variant="caption" style={styles.statLabel}>
              Total Points
            </Typography>
          </Card>
          
          <Card style={styles.statCard}>
            <Typography variant="h3" style={styles.statValue} glow="medium">
              {overallStreak || 0}
            </Typography>
            <Typography variant="caption" style={styles.statLabel}>
              Day Streak
            </Typography>
          </Card>
          
          <Card style={styles.statCard}>
            <Typography variant="h3" style={styles.statValue} glow="medium">
              {badgesCount}
            </Typography>
            <Typography variant="caption" style={styles.statLabel}>
              Badges
            </Typography>
          </Card>
        </View>
        
        {/* Filter tabs */}
        <View style={styles.filterTabs}>
          <TouchableOpacity 
            style={[
              styles.filterTab, 
              activeFilter === 'all' && styles.activeFilterTab
            ]}
            onPress={() => setActiveFilter('all')}
          >
            <Typography 
              style={activeFilter === 'all' ? styles.activeFilterText : styles.filterTabText}
            >
              All
            </Typography>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterTab, 
              activeFilter === 'earned' && styles.activeFilterTab
            ]}
            onPress={() => setActiveFilter('earned')}
          >
            <Typography 
              style={activeFilter === 'earned' ? styles.activeFilterText : styles.filterTabText}
            >
              Earned
            </Typography>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterTab, 
              activeFilter === 'inProgress' && styles.activeFilterTab
            ]}
            onPress={() => setActiveFilter('inProgress')}
          >
            <Typography 
              style={activeFilter === 'inProgress' ? styles.activeFilterText : styles.filterTabText}
            >
              In Progress
            </Typography>
          </TouchableOpacity>
        </View>
        
        {/* Achievement cards */}
        <Animated.View 
          style={[
            styles.achievementsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.COLORS.primary.purple} />
              <Typography style={styles.loadingText}>
                Loading achievements...
              </Typography>
            </View>
          ) : (
            <>
              <Typography variant="h2" style={styles.sectionTitle} glow="medium">
                Achievements ({userAchievements?.length || 0}/{achievements?.length || 0})
              </Typography>
              
              {filteredAchievements.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Typography 
                    variant="body" 
                    style={styles.emptyText}
                  >
                    {activeFilter === 'earned' 
                      ? 'You haven\'t earned any achievements yet.' 
                      : activeFilter === 'inProgress' 
                        ? 'No achievements in progress. Keep using the app to unlock more!' 
                        : 'No achievements found.'}
                  </Typography>
                </View>
              ) : (
                filteredAchievements.map((achievement) => {
                  const userAchievement = userAchievements?.find(ua => ua.achievement_id === achievement.id);
                  const isEarned = !!userAchievement;
                  let progress = 0;
                  let current = 0;
                  let target = 0;
                  
                  if (achievement.requires_streak) {
                    target = achievement.requires_streak;
                    current = Math.min(overallStreak || 0, target);
                    progress = target > 0 ? current / target : 0;
                  }
                  
                  // Determine the icon based on type or category
                  let icon = achievement.icon_name || 'trophy';
                  let iconColor = theme.COLORS.primary.purple;
                  
                  if (achievement.name?.includes('Morning')) {
                    icon = 'sun';
                    iconColor = theme.COLORS.primary.orange;
                  } else if (achievement.name?.includes('Afternoon')) {
                    icon = 'clock';
                    iconColor = theme.COLORS.primary.green;
                  } else if (achievement.name?.includes('Evening')) {
                    icon = 'moon';
                    iconColor = theme.COLORS.primary.blue;
                  } else if (achievement.requires_streak) {
                    icon = 'calendar';
                  }
                  
                  return (
                    <Card 
                      key={achievement.id} 
                      style={{...styles.achievementCard, 
                        ...(isEarned ? {borderColor: 'rgba(144, 255, 144, 0.3)', borderWidth: 2} : {})
                      }}
                    >
                      <View style={styles.achievementHeader}>
                        <Icon name={icon} size={26} color={iconColor} />
                        <Typography variant="h3" style={styles.achievementTitle}>
                          {achievement.name}
                        </Typography>
                      </View>
                      <Typography variant="body" style={styles.achievementDescription}>
                        {achievement.description}
                      </Typography>
                      {target > 0 && (
                        <View style={styles.progressContainer}>
                          <View style={styles.progressBar}>
                            <View 
                              style={[
                                styles.progressFill, 
                                { width: `${progress * 100}%`, backgroundColor: iconColor }
                              ]} 
                            />
                          </View>
                          <Typography variant="caption" style={styles.progressText}>
                            {current}/{target}
                          </Typography>
                        </View>
                      )}
                    </Card>
                  );
                })
              )}
              
              {/* Badge Section */}
              <View style={styles.sectionHeader}>
                <Typography variant="h2" style={styles.sectionTitle} glow="medium">
                  Badges ({userBadges?.length || 0}/{badges?.length || 0})
                </Typography>
              </View>
              
              {filteredBadges.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Typography 
                    variant="body" 
                    style={styles.emptyText}
                  >
                    {activeFilter === 'earned' 
                      ? 'You haven\'t earned any badges yet.' 
                      : activeFilter === 'inProgress' 
                        ? 'No badges in progress. Complete activities to unlock badges!' 
                        : 'No badges found.'}
                  </Typography>
                </View>
              ) : (
                filteredBadges.map((badge) => {
                  const userBadge = userBadges?.find(ub => ub.badge_id === badge.id);
                  const isEarned = !!userBadge;
                  
                  // Determine the icon based on type or category
                  let icon = badge.icon_name || 'award';
                  let iconColor = theme.COLORS.primary.purple;
                  
                  if (badge.category === 'morning' || badge.name?.includes('Morning') || badge.name?.includes('Early')) {
                    icon = 'sun';
                    iconColor = theme.COLORS.primary.orange;
                  } else if (badge.category === 'afternoon' || badge.name?.includes('Afternoon')) {
                    icon = 'clock';
                    iconColor = theme.COLORS.primary.green;
                  } else if (badge.category === 'evening' || badge.name?.includes('Evening') || badge.name?.includes('Night')) {
                    icon = 'moon';
                    iconColor = theme.COLORS.primary.blue;
                  } else if (badge.category === 'journal' || badge.name?.includes('Journal')) {
                    icon = 'book';
                    iconColor = '#FF9797';
                  } else if (badge.category === 'streak' || badge.name?.includes('Streak')) {
                    icon = 'fire';
                    iconColor = '#FF6B6B';
                  } else if (badge.category === 'mood' || badge.name?.includes('Mood')) {
                    icon = 'heart';
                    iconColor = '#FF6B6B';
                  }
                  
                  return (
                    <Card 
                      key={badge.id} 
                      style={{...styles.badgeCard, 
                        ...(isEarned ? {borderColor: 'rgba(144, 255, 144, 0.3)', borderWidth: 2} : {})
                      }}
                    >
                      <View style={styles.badgeIcon}>
                        <Icon name={icon} size={32} color={iconColor} />
                      </View>
                      <View style={styles.badgeContent}>
                        <Typography variant="h3" style={styles.badgeTitle}>
                          {badge.name}
                        </Typography>
                        <Typography variant="body" style={styles.badgeDescription}>
                          {badge.description}
                        </Typography>
                      </View>
                    </Card>
                  );
                })
              )}
            </>
          )}
        </Animated.View>
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
    paddingHorizontal: theme.SPACING.lg,
    paddingBottom: theme.SPACING.xxl * 2,
  },
  titleSection: {
    marginTop: theme.SPACING.xl,
    marginBottom: theme.SPACING.md,
  },
  title: {
    fontSize: 32,
    color: theme.COLORS.ui.text,
    textAlign: 'left',
    marginBottom: theme.SPACING.xs,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.SPACING.lg,
  },
  statCard: {
    flex: 1,
    marginHorizontal: theme.SPACING.xs / 2,
    padding: theme.SPACING.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.COLORS.ui.text,
    marginBottom: theme.SPACING.xs / 2,
  },
  statLabel: {
    fontSize: 12,
    color: theme.COLORS.ui.textSecondary,
    textAlign: 'center',
  },
  filterTabs: {
    flexDirection: 'row',
    marginBottom: theme.SPACING.md,
    borderRadius: theme.BORDER_RADIUS.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 4,
  },
  filterTab: {
    flex: 1,
    padding: theme.SPACING.sm,
    alignItems: 'center',
    borderRadius: theme.BORDER_RADIUS.md,
  },
  activeFilterTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  filterTabText: {
    fontSize: 14,
    color: theme.COLORS.ui.textSecondary,
  },
  activeFilterText: {
    color: theme.COLORS.ui.text,
    fontWeight: 'bold',
  },
  achievementsContainer: {
    marginTop: theme.SPACING.sm,
  },
  loadingContainer: {
    padding: theme.SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: theme.SPACING.md,
    color: theme.COLORS.ui.textSecondary,
  },
  achievementCard: {
    marginBottom: theme.SPACING.md,
    padding: theme.SPACING.md,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.SPACING.sm,
  },
  achievementTitle: {
    marginLeft: theme.SPACING.sm,
    fontSize: 18,
    color: theme.COLORS.ui.text,
  },
  achievementDescription: {
    fontSize: 14,
    color: theme.COLORS.ui.textSecondary,
    marginBottom: theme.SPACING.md,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: theme.SPACING.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.COLORS.primary.purple,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: theme.COLORS.ui.textSecondary,
    width: 40,
    textAlign: 'right',
  },
  sectionHeader: {
    marginTop: theme.SPACING.lg,
    marginBottom: theme.SPACING.sm,
  },
  sectionTitle: {
    fontSize: 24,
    color: theme.COLORS.ui.text,
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.SPACING.md,
    padding: theme.SPACING.md,
  },
  badgeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.SPACING.md,
  },
  badgeContent: {
    flex: 1,
  },
  badgeTitle: {
    fontSize: 18,
    color: theme.COLORS.ui.text,
    marginBottom: theme.SPACING.xs,
  },
  badgeDescription: {
    fontSize: 14,
    color: theme.COLORS.ui.textSecondary,
  },
  emptyContainer: {
    padding: theme.SPACING.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: theme.BORDER_RADIUS.md,
    marginBottom: theme.SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: theme.COLORS.ui.textSecondary,
    textAlign: 'center',
  },
});

export default AchievementsScreen; 