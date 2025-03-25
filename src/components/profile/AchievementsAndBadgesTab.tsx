import React, { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import { View, ScrollView, StyleSheet, Animated, ActivityIndicator, SectionList, TouchableOpacity, FlatList } from 'react-native';
import { Typography, Card } from '@/components/common';
import { useBadges } from '@/contexts/BadgeContext';
import { useAchievements } from '@/contexts/AchievementsContext';
import { useCheckInStreak } from '@/contexts/CheckInStreakContext';
import { useNotifications } from '@/contexts/NotificationsContext';
import { AchievementRecommendations } from '@/components/achievements/AchievementRecommendations';
import { AchievementProgress } from '@/components/achievements/AchievementProgress';
import theme from '@/constants/theme';
import { FontAwesome6 } from '@expo/vector-icons';
import { BADGE_ICONS } from '@/services/BadgeService';
import { getCompatibleIconName } from '@/utils/iconUtils';
import { Achievement } from '@/contexts/UserProfileContext';

// Define badge categories for display ordering
const BADGE_CATEGORIES = {
  consistency: {
    name: 'Consistency Champions',
    priority: 1
  },
  streak: {
    name: 'Streak Badges',
    priority: 2
  },
  timeOfDay: {
    name: 'Time of Day Streaks',
    priority: 2
  },
  completion: {
    name: 'Completion Badges',
    priority: 3
  },
  emotion: {
    name: 'Emotion Badges',
    priority: 4
  }
};

const BADGE_COLORS: Record<string, string> = {
  beginner: theme.COLORS.primary.green,
  intermediate: theme.COLORS.primary.blue,
  advanced: theme.COLORS.primary.purple,
  expert: theme.COLORS.primary.orange,
  master: theme.COLORS.ui.accent,
  consistency: theme.COLORS.primary.teal,
  streak: theme.COLORS.primary.orange,
  timeOfDay: theme.COLORS.primary.blue,
  morning: theme.COLORS.primary.orange,
  afternoon: theme.COLORS.primary.blue,
  evening: theme.COLORS.primary.purple,
  completion: theme.COLORS.primary.blue,
  emotion: theme.COLORS.primary.purple,
};

// Define extended achievement type with progress info
interface ProcessedAchievement extends Achievement {
  isEarned: boolean;
  progress: number;
  current: number;
  target: number;
  category?: string;
  timePeriod?: 'morning' | 'afternoon' | 'evening';
}

// Define badge type with earned status
interface ProcessedBadge {
  id: string;
  name: string;
  description: string;
  category: string;
  icon_name?: string;
  isEarned: boolean;
}

// Define section type
interface BadgeSection {
  title: string;
  data: (ProcessedBadge | ProcessedAchievement)[];
  priority: number;
  type: 'badge' | 'achievement';
}

// Helper function to get achievement category
const getAchievementCategory = (achievement: Achievement): string => {
  if (achievement.requires_streak) {
    // Special handling for time-of-day based streaks
    if (achievement.name?.toLowerCase().includes('morning')) {
      return 'timeOfDay';
    } else if (achievement.name?.toLowerCase().includes('afternoon')) {
      return 'timeOfDay';
    } else if (achievement.name?.toLowerCase().includes('evening')) {
      return 'timeOfDay';
    }
    
    return 'streak';
  }
  
  const category = (achievement as any).category;
  if (category) {
    if (category === 'completion') return 'completion';
    if (category === 'mood') return 'emotion';
    return category.toLowerCase();
  }
  
  return 'other';
};

// Get time period from achievement name
const getTimePeriod = (achievement: Achievement): 'morning' | 'afternoon' | 'evening' | undefined => {
  if (!achievement.name) return undefined;
  
  const name = achievement.name.toLowerCase();
  if (name.includes('morning')) return 'morning';
  if (name.includes('afternoon')) return 'afternoon';
  if (name.includes('evening')) return 'evening';
  
  return undefined;
};

export const AchievementsAndBadgesTab = () => {
  console.log('Rendering AchievementsAndBadgesTab with combined achievements and badges');
  
  // Get data from contexts
  const { badges, userBadges, isLoading: badgesLoading } = useBadges();
  const { achievements, userAchievements, isLoading: achievementsLoading } = useAchievements();
  const { overallStreak, streaks } = useCheckInStreak();
  
  // Debug logs
  console.log('Badges data:', { badgesCount: badges?.length, userBadgesCount: userBadges?.length, loading: badgesLoading });
  console.log('Achievements data:', { achievementsCount: achievements?.length, userAchievementsCount: userAchievements?.length, loading: achievementsLoading });
  console.log('Streak data:', { overallStreak, morningStreak: streaks?.morning, afternoonStreak: streaks?.afternoon, eveningStreak: streaks?.evening });
  
  // Filter state
  const [filter, setFilter] = useState<'all' | 'earned' | 'inProgress'>('all');
  
  // Setup notifications if available
  let showAchievementNotification = (achievementName: string) => {};
  let showBadgeNotification = (badgeName: string) => {};
  
  try {
    const { showAchievementNotification: showAchievement, showBadgeNotification: showBadge } = useNotifications();
    showAchievementNotification = showAchievement;
    showBadgeNotification = showBadge;
  } catch (error) {
    console.log('NotificationContext not available in AchievementsAndBadgesTab, notifications will be disabled');
  }
  
  // Setup animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    console.log('AchievementsAndBadgesTab: Starting fade animation');
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);
  
  // Toggle filter between all, earned, and in-progress items
  const toggleFilter = useCallback((newFilter: 'all' | 'earned' | 'inProgress') => {
    setFilter(newFilter);
  }, []);
  
  // Handle interaction with achievements and badges
  const handleAchievementPress = useCallback((achievement: Achievement) => {
    showAchievementNotification(achievement.name);
  }, [showAchievementNotification]);
  
  const handleBadgePress = useCallback((badge: ProcessedBadge) => {
    if (badge.isEarned) {
      showBadgeNotification(badge.name);
    }
  }, [showBadgeNotification]);
  
  // Define all functions with useCallback to prevent re-creation on renders
  const getBadgeColor = useCallback((badge: any, isEarned: boolean): string => {
    // Use category-specific colors
    if (badge?.category && BADGE_COLORS[badge.category]) {
      return isEarned ? BADGE_COLORS[badge.category] : 'rgba(120, 120, 120, 0.5)';
    }
    
    // Fallback to legacy color scheme
    if (badge?.category) {
      switch (badge.category) {
        case 'beginner':
          return isEarned ? theme.COLORS.primary.green : 'rgba(120, 120, 120, 0.5)';
        case 'intermediate':
          return isEarned ? theme.COLORS.primary.blue : 'rgba(120, 120, 120, 0.5)';
        case 'advanced':
          return isEarned ? theme.COLORS.primary.purple : 'rgba(120, 120, 120, 0.5)';
        case 'expert':
          return isEarned ? theme.COLORS.primary.orange : 'rgba(120, 120, 120, 0.5)';
        case 'master':
          return isEarned ? theme.COLORS.ui.accent : 'rgba(120, 120, 120, 0.5)';
        default:
          return isEarned ? theme.COLORS.ui.textSecondary : 'rgba(120, 120, 120, 0.5)';
      }
    }
    
    return isEarned ? theme.COLORS.ui.textSecondary : 'rgba(120, 120, 120, 0.5)';
  }, []);

  const getBadgeIcon = useCallback((badge: any): string => {
    // Use badge-specific icon if defined
    if (badge?.icon_name) {
      return badge.icon_name;
    }
    
    // Use standard icons based on category
    if (badge?.category) {
      switch (badge.category) {
        case 'beginner':
          return 'leaf';
        case 'intermediate':
          return 'shield';
        case 'advanced':
          return 'gem';
        case 'expert':
          return 'star';
        case 'master':
          return 'crown';
        case 'streak':
          return 'fire';
        case 'consistency':
          return 'medal';
        case 'completion':
          return 'check-circle';
        case 'emotion':
          return 'face-smile';
        default:
          return 'medal';
      }
    }
    
    return 'medal';
  }, []);

  // Define render functions with useCallback before using them
  const renderBadge = useCallback(({ item, section }: { item: any, section: BadgeSection }) => {
    if (section.type === 'badge') {
      const badge = item as ProcessedBadge;
      const isEarned = badge.isEarned;
      const color = getBadgeColor(badge, isEarned);
      const iconName = getBadgeIcon(badge);
      
      return (
        <TouchableOpacity 
          key={badge.id} 
          onPress={() => handleBadgePress(badge)}
          activeOpacity={0.8}
        >
          <Card 
            style={StyleSheet.flatten([
              styles.badgeCard,
              isEarned ? styles.earnedCard : styles.unearnedCard
            ])}
            variant={isEarned ? "glow" : "default"}
          >
            <View style={styles.badgeHeader}>
              <View 
                style={StyleSheet.flatten([
                  styles.iconContainer, 
                  {
                    backgroundColor: isEarned ? `${color}20` : 'rgba(120, 120, 120, 0.1)',
                    borderColor: isEarned ? color : 'rgba(120, 120, 120, 0.2)',
                  }
                ])}
              >
                <FontAwesome6 
                  name={getCompatibleIconName(iconName) as any} 
                  size={24} 
                  color={isEarned ? color : 'rgba(120, 120, 120, 0.5)'} 
                />
              </View>
              <View style={styles.badgeInfo}>
                <Typography 
                  variant="h3" 
                  style={styles.badgeName}
                  color={isEarned ? theme.COLORS.ui.text : theme.COLORS.ui.textSecondary}
                  glow={isEarned ? "medium" : "none"}
                >
                  {badge.name}
                </Typography>
                <Typography 
                  variant="body" 
                  style={styles.badgeDescription}
                  color={isEarned ? theme.COLORS.ui.textSecondary : 'rgba(120, 120, 120, 0.6)'}
                >
                  {badge.description}
                </Typography>
              </View>
            </View>
            <View style={styles.badgeFooter}>
              <Typography 
                variant="caption"
                color={isEarned ? color : 'rgba(120, 120, 120, 0.5)'}
                glow={isEarned ? "soft" : "none"}
              >
                {isEarned ? 'Earned' : 'Not yet earned'}
              </Typography>
            </View>
          </Card>
        </TouchableOpacity>
      );
    } else {
      // Render achievement
      const achievement = item as ProcessedAchievement;
      
      // Special handling for time-of-day achievements
      const timePeriodColor = achievement.timePeriod 
        ? BADGE_COLORS[achievement.timePeriod] 
        : undefined;
      
      let icon = achievement.icon_name || 'trophy';
      
      // Special icon handling for time periods
      if (achievement.timePeriod === 'morning') {
        icon = 'sun';
      } else if (achievement.timePeriod === 'afternoon') {
        icon = 'cloud-sun';
      } else if (achievement.timePeriod === 'evening') {
        icon = 'moon';
      }
      
      return (
        <AchievementProgress
          title={achievement.name}
          description={achievement.description}
          icon={icon}
          progress={achievement.progress}
          target={achievement.target}
          current={achievement.current}
          isEarned={achievement.isEarned}
          color={
            timePeriodColor || (
              achievement.category === 'emotion' 
                ? theme.COLORS.primary.purple 
                : achievement.category === 'streak'
                  ? theme.COLORS.primary.orange
                  : theme.COLORS.primary.teal
            )
          }
          onPress={() => achievement.isEarned && handleAchievementPress(achievement)}
        />
      );
    }
  }, [getBadgeColor, getBadgeIcon, handleAchievementPress, handleBadgePress]);

  const renderSectionHeader = useCallback(({ section }: { section: BadgeSection }) => (
    <View style={styles.sectionHeaderContainer}>
      <Typography variant="h3" style={styles.sectionTitle} glow="soft">
        {section.title}
      </Typography>
      <View style={styles.sectionDivider} />
    </View>
  ), []);

  // Organize badges and achievements into sections
  const combinedSections = useMemo(() => {
    console.log('AchievementsAndBadgesTab: Preparing combined sections');
    
    const currentStreak = overallStreak || 0;
    const { morning: morningStreak, afternoon: afternoonStreak, evening: eveningStreak } = streaks || { morning: 0, afternoon: 0, evening: 0 };
    
    console.log('Processing badges:', { badgesCount: badges?.length, userBadgesCount: userBadges?.length });
    
    // Process badges
    const earnedBadges = userBadges.map(ub => ({
      ...ub.badge,
      isEarned: true
    }));
    
    const availableBadges = badges
      .filter(b => !userBadges.some(ub => ub.badge_id === b.id))
      .map(b => ({
        ...b,
        isEarned: false
      }));
    
    // Group all badges by category
    const allBadges = [...earnedBadges, ...availableBadges];
    const badgesByCategory: Record<string, ProcessedBadge[]> = {};
    
    allBadges.forEach(badge => {
      const category = badge.category || 'other';
      if (!badgesByCategory[category]) badgesByCategory[category] = [];
      badgesByCategory[category].push(badge as ProcessedBadge);
    });
    
    console.log('Processing achievements:', { achievementsCount: achievements?.length, userAchievementsCount: userAchievements?.length });
    
    // Process achievements
    const earnedAchievementsMap = new Map<string, any>();
    userAchievements.forEach(ua => {
      earnedAchievementsMap.set(ua.achievement_id, ua.achievement);
    });
    
    // Create processed achievements
    const processedAchievements: ProcessedAchievement[] = achievements.map(achievement => {
      const isEarned = earnedAchievementsMap.has(achievement.id);
      
      // Calculate progress for streak achievements
      let progress = 0;
      let current = 0;
      let target = 0;
      
      // Get time period if applicable
      const timePeriod = getTimePeriod(achievement);
      
      if (achievement.requires_streak) {
        target = achievement.requires_streak;
        
        // Use appropriate streak based on time period
        if (timePeriod === 'morning') {
          current = Math.min(morningStreak, target);
        } else if (timePeriod === 'afternoon') {
          current = Math.min(afternoonStreak, target);
        } else if (timePeriod === 'evening') {
          current = Math.min(eveningStreak, target);
        } else {
          current = Math.min(currentStreak, target);
        }
        
        progress = target > 0 ? current / target : 0;
      }
      
      return {
        ...achievement,
        isEarned,
        progress,
        current,
        target,
        category: getAchievementCategory(achievement),
        timePeriod
      };
    });
    
    // Filter achievements based on user selection
    let filteredAchievements = processedAchievements;
    let filteredBadges = allBadges as ProcessedBadge[];
    
    if (filter === 'earned') {
      filteredAchievements = processedAchievements.filter(a => a.isEarned);
      filteredBadges = allBadges.filter(b => b.isEarned) as ProcessedBadge[];
    } else if (filter === 'inProgress') {
      filteredAchievements = processedAchievements.filter(a => !a.isEarned && a.progress > 0);
      filteredBadges = allBadges.filter(b => !b.isEarned) as ProcessedBadge[];
    }
    
    // Group achievements by category
    const achievementsByCategory: Record<string, ProcessedAchievement[]> = {};
    
    filteredAchievements.forEach(achievement => {
      const category = achievement.category || 'other';
      if (!achievementsByCategory[category]) achievementsByCategory[category] = [];
      achievementsByCategory[category].push(achievement);
    });
    
    // Create sections for SectionList
    const sections: BadgeSection[] = [];
    
    // Add badge sections
    Object.keys(badgesByCategory).forEach(category => {
      if (badgesByCategory[category].length > 0) {
        const filteredCategoryBadges = filteredBadges.filter(b => b.category === category);
        if (filteredCategoryBadges.length > 0) {
          sections.push({
            title: BADGE_CATEGORIES[category as keyof typeof BADGE_CATEGORIES]?.name || 
                  (category.charAt(0).toUpperCase() + category.slice(1) + ' Badges'),
            data: filteredCategoryBadges,
            priority: BADGE_CATEGORIES[category as keyof typeof BADGE_CATEGORIES]?.priority || 999,
            type: 'badge'
          });
        }
      }
    });
    
    // Add achievement sections
    Object.keys(achievementsByCategory).forEach(category => {
      if (achievementsByCategory[category].length > 0) {
        const title = category === 'streak' ? 'Streak Achievements' :
                      category === 'timeOfDay' ? 'Time of Day Streaks' :
                      category === 'completion' ? 'Completion Achievements' :
                      category === 'emotion' ? 'Emotion Achievements' :
                      'Other Achievements';
        
        const priority = category === 'streak' ? 2 :
                         category === 'timeOfDay' ? 2 :
                         category === 'completion' ? 3 :
                         category === 'emotion' ? 4 : 5;
        
        sections.push({
          title,
          data: achievementsByCategory[category],
          priority,
          type: 'achievement'
        });
      }
    });
    
    // Sort sections by priority
    sections.sort((a, b) => a.priority - b.priority);
    
    console.log(`AchievementsAndBadgesTab: Prepared ${sections.length} sections with ${
      sections.reduce((sum, section) => sum + section.data.length, 0)
    } total items`);
    
    // Make sure we always have at least an empty section to get recommendations to show
    if (sections.length === 0) {
      sections.push({
        title: 'Available Achievements',
        data: [],
        priority: 1,
        type: 'achievement'
      });
    }
    
    return sections;
  }, [badges, userBadges, achievements, userAchievements, overallStreak, streaks, filter]);

  // Check loading state
  const isLoading = badgesLoading || achievementsLoading;

  // Now we can safely check loading state after all hooks are called
  if (isLoading) {
    console.log("AchievementsAndBadgesTab: showing loading state");
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.COLORS.primary.blue} />
        <Typography variant="body" style={{ marginTop: theme.SPACING.md }}>
          Loading badges and achievements...
        </Typography>
      </View>
    );
  }

  // Debug log sections data
  console.log('Rendering SectionList with sections:', combinedSections.map(s => ({
    title: s.title,
    itemCount: s.data.length,
    type: s.type
  })));

  // Render main component
  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Debug element to test visibility */}
        <View style={{ 
          height: 100, 
          backgroundColor: 'rgba(255, 0, 0, 0.3)', 
          justifyContent: 'center', 
          alignItems: 'center',
          marginBottom: 10,
          borderRadius: 8,
        }}>
          <Typography variant="h3" glow="medium">
            Debug: Content Area
          </Typography>
          <Typography variant="caption">
            {`Sections: ${combinedSections.length}, Items: ${combinedSections.reduce((sum, s) => sum + s.data.length, 0)}`}
          </Typography>
        </View>

        <View style={styles.listContent}>
          {/* Recommendations section */}
          <AchievementRecommendations />
          
          {/* Filter tabs */}
          <View style={styles.filterContainer}>
            <TouchableOpacity 
              style={[styles.filterTab, filter === 'all' && styles.activeFilterTab]}
              onPress={() => toggleFilter('all')}
            >
              <Typography 
                variant="caption" 
                color={filter === 'all' ? theme.COLORS.ui.text : theme.COLORS.ui.textSecondary}
                glow={filter === 'all' ? "soft" : "none"}
              >
                All
              </Typography>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterTab, filter === 'earned' && styles.activeFilterTab]}
              onPress={() => toggleFilter('earned')}
            >
              <Typography 
                variant="caption" 
                color={filter === 'earned' ? theme.COLORS.ui.text : theme.COLORS.ui.textSecondary}
                glow={filter === 'earned' ? "soft" : "none"}
              >
                Earned
              </Typography>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterTab, filter === 'inProgress' && styles.activeFilterTab]}
              onPress={() => toggleFilter('inProgress')}
            >
              <Typography 
                variant="caption" 
                color={filter === 'inProgress' ? theme.COLORS.ui.text : theme.COLORS.ui.textSecondary}
                glow={filter === 'inProgress' ? "soft" : "none"}
              >
                In Progress
              </Typography>
            </TouchableOpacity>
          </View>
          
          {/* Manually render sections */}
          {combinedSections.length > 0 ? (
            combinedSections.map((section, sectionIndex) => (
              <View key={`section-${sectionIndex}`}>
                {/* Section header */}
                <View style={styles.sectionHeaderContainer}>
                  <Typography variant="h3" style={styles.sectionTitle} glow="soft">
                    {section.title}
                  </Typography>
                  <View style={styles.sectionDivider} />
                </View>
                
                {/* Section items */}
                {section.data.length > 0 ? (
                  section.data.map((item, itemIndex) => (
                    <View key={`item-${(item as any).id || `${sectionIndex}-${itemIndex}`}`}>
                      {renderBadge({ item, section })}
                    </View>
                  ))
                ) : (
                  <Typography variant="body" style={styles.emptyMessage}>
                    No items in this section
                  </Typography>
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Typography variant="body" style={styles.emptyMessage}>
                {filter === 'earned' 
                  ? "You haven't earned any badges or achievements yet. Keep up your daily check-ins!"
                  : filter === 'inProgress'
                    ? "You don't have any badges or achievements in progress. Start working towards your next goal!"
                    : "No badges or achievements available. Check back soon!"}
              </Typography>
            </View>
          )}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 600, // Match the height in AchievementsScreen
    backgroundColor: theme.COLORS.ui.background,
  },
  content: {
    width: '100%',
    height: '100%',
  },
  sectionList: {
    width: '100%',
    flex: 1,
  },
  listContent: {
    width: '100%',
    height: '100%',
    padding: theme.SPACING.lg,
  },
  sectionHeaderContainer: {
    marginTop: theme.SPACING.xl,
    marginBottom: theme.SPACING.md,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 10,
    borderRadius: 8,
  },
  sectionTitle: {
    marginBottom: theme.SPACING.xs,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: `${theme.COLORS.ui.border}50`,
    marginTop: 8,
  },
  badgeCard: {
    marginBottom: theme.SPACING.md,
    padding: theme.SPACING.md,
  },
  earnedCard: {
    backgroundColor: 'rgba(38, 20, 60, 0.9)',
  },
  unearnedCard: {
    backgroundColor: 'rgba(38, 20, 60, 0.5)',
  },
  badgeHeader: {
    flexDirection: 'row',
    marginBottom: theme.SPACING.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginRight: theme.SPACING.md,
  },
  badgeInfo: {
    flex: 1,
  },
  badgeName: {
    fontSize: 18,
    marginBottom: theme.SPACING.xs,
  },
  badgeDescription: {
    fontSize: 14,
  },
  badgeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.SPACING.md,
  },
  emptyContainer: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  emptyMessage: {
    textAlign: 'center',
    color: theme.COLORS.ui.textSecondary,
    marginVertical: 24,
    opacity: 0.7,
  },
  loadingContainer: {
    padding: theme.SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  filterContainer: {
    flexDirection: 'row',
    marginVertical: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeFilterTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
}); 