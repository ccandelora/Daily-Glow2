import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Typography, Card } from '@/components/common';
import { useBadges } from '@/contexts/BadgeContext';
import { useAchievements } from '@/contexts/AchievementsContext';
import { useCheckInStreak } from '@/contexts/CheckInStreakContext';
import { AchievementProgress } from '@/components/achievements/AchievementProgress';
import theme from '@/constants/theme';
import { FontAwesome6 } from '@expo/vector-icons';
import { getCompatibleIconName } from '@/utils/iconUtils';

export const FixedAchievementsTab = () => {
  console.log('Rendering FixedAchievementsTab');
  
  // Get data from contexts
  const { badges, userBadges, isLoading: badgesLoading } = useBadges();
  const { achievements, userAchievements, isLoading: achievementsLoading } = useAchievements();
  const { overallStreak, streaks } = useCheckInStreak();
  
  // Debug logs
  console.log('Data stats:', { 
    badges: badges?.length || 0, 
    userBadges: userBadges?.length || 0, 
    achievements: achievements?.length || 0, 
    userAchievements: userAchievements?.length || 0 
  });
  
  // Simple filter state
  const [filter, setFilter] = useState('all');
  
  // Setup animation
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // Organize badges and achievements into simple structures
  const processedAchievements = React.useMemo(() => {
    if (!achievements) return [];
    
    // Create a map of earned achievements for quick lookup
    const earnedMap = new Map();
    userAchievements.forEach(ua => {
      earnedMap.set(ua.achievement_id, true);
    });
    
    // Process achievements with basic information
    return achievements.map(achievement => {
      const isEarned = earnedMap.has(achievement.id);
      let progress = 0;
      let current = 0;
      let target = 0;
      
      if (achievement.requires_streak) {
        target = achievement.requires_streak;
        current = Math.min(overallStreak || 0, target);
        progress = target > 0 ? current / target : 0;
      }
      
      return {
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        isEarned,
        progress,
        current,
        target,
        icon_name: achievement.icon_name || 'trophy'
      };
    });
  }, [achievements, userAchievements, overallStreak]);
  
  const processedBadges = React.useMemo(() => {
    if (!badges) return [];
    
    // Create a map of earned badges for quick lookup
    const earnedMap = new Map();
    userBadges.forEach(ub => {
      earnedMap.set(ub.badge_id, true);
    });
    
    // Process badges with basic information
    return badges.map(badge => {
      const isEarned = earnedMap.has(badge.id);
      
      return {
        id: badge.id,
        name: badge.name,
        description: badge.description,
        isEarned,
        icon_name: badge.icon_name || 'medal',
        category: badge.category || 'other'
      };
    });
  }, [badges, userBadges]);
  
  // Filter items based on user selection
  const filteredItems = React.useMemo(() => {
    if (filter === 'earned') {
      return {
        achievements: processedAchievements.filter(a => a.isEarned),
        badges: processedBadges.filter(b => b.isEarned)
      };
    } else if (filter === 'inProgress') {
      return {
        achievements: processedAchievements.filter(a => !a.isEarned && a.progress > 0),
        badges: processedBadges.filter(b => !b.isEarned)
      };
    } else {
      return {
        achievements: processedAchievements,
        badges: processedBadges
      };
    }
  }, [processedAchievements, processedBadges, filter]);
  
  // Loading state
  if (badgesLoading || achievementsLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Typography variant="h2" glow="medium">
            Loading...
          </Typography>
          <Typography variant="body">
            Loading achievements and badges
          </Typography>
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Debug Section */}
        <View style={styles.debugSection}>
          <Typography variant="body" style={styles.debugText} glow="medium">
            {`${filteredItems.achievements.length} achievements, ${filteredItems.badges.length} badges`}
          </Typography>
        </View>
        
        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <TouchableOpacity 
            style={[styles.filterTab, filter === 'all' && styles.activeFilterTab]}
            onPress={() => setFilter('all')}
          >
            <Typography 
              variant="caption" 
              color={filter === 'all' ? theme.COLORS.ui.text : theme.COLORS.ui.textSecondary}
              glow={filter === 'all' ? "medium" : "none"}
            >
              All
            </Typography>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterTab, filter === 'earned' && styles.activeFilterTab]}
            onPress={() => setFilter('earned')}
          >
            <Typography 
              variant="caption" 
              color={filter === 'earned' ? theme.COLORS.ui.text : theme.COLORS.ui.textSecondary}
              glow={filter === 'earned' ? "medium" : "none"}
            >
              Earned
            </Typography>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterTab, filter === 'inProgress' && styles.activeFilterTab]}
            onPress={() => setFilter('inProgress')}
          >
            <Typography 
              variant="caption" 
              color={filter === 'inProgress' ? theme.COLORS.ui.text : theme.COLORS.ui.textSecondary}
              glow={filter === 'inProgress' ? "medium" : "none"}
            >
              In Progress
            </Typography>
          </TouchableOpacity>
        </View>
        
        {/* Achievements Section */}
        {filteredItems.achievements.length > 0 && (
          <View style={styles.achievementsContainer}>
            <Typography variant="h2" style={styles.sectionTitle} glow="medium">
              Achievements
            </Typography>
            
            {filteredItems.achievements.map(achievement => (
              <AchievementProgress
                key={achievement.id}
                title={achievement.name}
                description={achievement.description}
                icon={achievement.icon_name}
                progress={achievement.progress}
                target={achievement.target}
                current={achievement.current}
                isEarned={achievement.isEarned}
                color={theme.COLORS.primary.teal}
              />
            ))}
          </View>
        )}
        
        {/* Badges Section */}
        {filteredItems.badges.length > 0 && (
          <View style={styles.badgesContainer}>
            <Typography variant="h2" style={styles.sectionTitle} glow="medium">
              Badges
            </Typography>
            
            {filteredItems.badges.map(badge => (
              <Card 
                key={badge.id}
                style={[
                  styles.badgeCard, 
                  badge.isEarned ? styles.earnedCard : styles.unearnedCard
                ] as any}
                variant={badge.isEarned ? "glow" : "default"}
              >
                <View style={styles.cardHeader}>
                  <View 
                    style={[
                      styles.iconContainer, 
                      {
                        backgroundColor: badge.isEarned ? `${theme.COLORS.primary.green}40` : 'rgba(120, 120, 120, 0.2)',
                        borderColor: badge.isEarned ? theme.COLORS.primary.green : 'rgba(180, 180, 180, 0.4)',
                      }
                    ]}
                  >
                    <FontAwesome6 
                      name={getCompatibleIconName(badge.icon_name) as any} 
                      size={24} 
                      color={badge.isEarned ? theme.COLORS.primary.green : 'rgba(255, 255, 255, 0.7)'} 
                    />
                  </View>
                  <View style={styles.textContainer}>
                    <Typography 
                      variant="h3" 
                      glow={badge.isEarned ? "medium" : "soft"}
                      color={badge.isEarned ? theme.COLORS.ui.text : theme.COLORS.ui.text}
                    >
                      {badge.name}
                    </Typography>
                    <Typography 
                      variant="body" 
                      color={badge.isEarned ? theme.COLORS.ui.textSecondary : theme.COLORS.ui.textSecondary}
                    >
                      {badge.description}
                    </Typography>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}
        
        {/* Empty State */}
        {filteredItems.achievements.length === 0 && filteredItems.badges.length === 0 && (
          <View style={styles.emptyContainer}>
            <Typography variant="body" style={styles.emptyMessage} glow="medium">
              {filter === 'earned' 
                ? "You haven't earned any badges or achievements yet. Keep up your daily check-ins!"
                : filter === 'inProgress'
                  ? "You don't have any badges or achievements in progress. Start working towards your next goal!"
                  : "No badges or achievements available. Check back soon!"}
            </Typography>
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 600,
    backgroundColor: 'rgba(80, 40, 120, 0.95)', // MUCH lighter purple background
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)', // Bright white border
  },
  content: {
    width: '100%',
    height: '100%',
    padding: theme.SPACING.lg,
  },
  debugSection: {
    padding: 8,
    backgroundColor: '#ff5500', // Bright orange for high visibility
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  debugText: {
    color: 'white',
    fontWeight: 'bold',
  },
  sectionTitle: {
    marginTop: theme.SPACING.xl,
    marginBottom: theme.SPACING.md,
    color: 'white',
    fontWeight: 'bold',
    fontSize: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  badgeCard: {
    marginBottom: theme.SPACING.md,
    padding: theme.SPACING.md,
  },
  earnedCard: {
    backgroundColor: 'rgba(100, 60, 150, 0.95)', // Much lighter purple
    borderWidth: 2,
    borderColor: '#90ff90', // Bright green border
  },
  unearnedCard: {
    backgroundColor: 'rgba(80, 50, 120, 0.95)', // Lighter purple
    borderWidth: 2,
    borderColor: 'rgba(200, 200, 200, 0.6)', // Bright gray border
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeFilterTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  emptyContainer: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  emptyMessage: {
    textAlign: 'center',
    color: theme.COLORS.ui.text,
    marginVertical: 24,
  },
  loadingContainer: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderRadius: 8,
    padding: 10,
  },
  achievementsContainer: {
    backgroundColor: 'rgba(100, 60, 160, 0.95)', // Much lighter purple
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#90c0ff', // Bright blue border
  },
  badgesContainer: {
    backgroundColor: 'rgba(100, 60, 160, 0.95)', // Much lighter purple
    borderRadius: 8,
    padding: 15,
    borderWidth: 2,
    borderColor: '#ff90c0', // Bright pink border
  },
}); 