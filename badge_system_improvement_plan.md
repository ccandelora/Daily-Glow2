# Badge System Improvement Plan

## Current Issues

1. The badge system isn't properly integrated with achievements and streaks
2. Badge creation and initialization has inconsistent error handling
3. The badge award criteria are not clearly defined
4. Badges earned aren't displayed prominently enough in the UI
5. The home screen's RecentBadges component may not refresh properly when new badges are earned

## Database Structure

Based on the provided schema:

1. **badges table**:
   - id (uuid)
   - name (text)
   - description (text) 
   - icon_name (text)
   - category (text)
   - created_at (timestamp)

2. **user_badges table**:
   - id (uuid)
   - user_id (uuid)
   - badge_id (uuid)
   - created_at (timestamp)

## Implementation Plan

### 1. Improve Badge Service

Create a comprehensive badge service that handles all badge-related operations:

```typescript
// src/services/BadgeService.ts

import { supabase } from '@/lib/supabase';
import { Badge, UserBadge } from '@/contexts/BadgeContext';

/**
 * Initialize badges in the database
 */
export const initializeBadges = async (): Promise<void> => {
  try {
    // Check if badges table exists and has records
    const { data, error } = await supabase
      .from('badges')
      .select('id')
      .limit(1);
      
    if (error || !data || data.length === 0) {
      console.log('Badge table is empty, creating default badges...');
      
      // Define default badges
      const defaultBadges = [
        {
          name: 'Welcome Badge',
          description: 'Awarded for creating an account and starting your wellness journey',
          icon_name: 'handshake',
          category: 'beginner'
        },
        {
          name: 'First Check-in',
          description: 'Completed your first daily check-in',
          icon_name: 'check-circle',
          category: 'beginner'
        },
        {
          name: '3-Day Streak',
          description: 'Maintained a streak for 3 consecutive days',
          icon_name: 'fire',
          category: 'streak'
        },
        {
          name: '7-Day Streak',
          description: 'Maintained a streak for 7 consecutive days',
          icon_name: 'fire',
          category: 'streak'
        },
        {
          name: '14-Day Streak',
          description: 'Maintained a streak for 14 consecutive days',
          icon_name: 'fire',
          category: 'streak'
        },
        {
          name: '30-Day Streak',
          description: 'Maintained a streak for 30 consecutive days',
          icon_name: 'fire',
          category: 'streak'
        },
        {
          name: 'Profile Complete',
          description: 'Filled out your profile information',
          icon_name: 'user',
          category: 'profile'
        },
        {
          name: 'First Achievement',
          description: 'Earned your first achievement',
          icon_name: 'trophy',
          category: 'achievement'
        },
        {
          name: 'Achievement Hunter',
          description: 'Earned 5 achievements',
          icon_name: 'medal',
          category: 'achievement'
        }
      ];
      
      // Insert default badges
      const { error: insertError } = await supabase
        .from('badges')
        .insert(defaultBadges);
        
      if (insertError) {
        console.error('Error creating default badges:', insertError);
        throw insertError;
      } else {
        console.log('Successfully created default badges');
      }
    } else {
      console.log('Badge table already has data, skipping initialization');
    }
  } catch (error) {
    console.error('Error initializing badges:', error);
    throw error;
  }
};

/**
 * Get all available badges
 */
export const getBadges = async (): Promise<Badge[]> => {
  try {
    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .order('category', { ascending: true });
      
    if (error) {
      console.error('Error fetching badges:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching badges:', error);
    return [];
  }
};

/**
 * Get badges earned by a specific user
 */
export const getUserBadges = async (userId: string): Promise<UserBadge[]> => {
  try {
    const { data, error } = await supabase
      .from('user_badges')
      .select('*, badge:badges(*)')
      .eq('user_id', userId);
      
    if (error) {
      console.error('Error fetching user badges:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching user badges:', error);
    return [];
  }
};

/**
 * Award a badge to a user by badge name
 */
export const awardBadgeByName = async (userId: string, badgeName: string): Promise<boolean> => {
  try {
    // Find the badge with the given name
    const { data: badges, error: badgeError } = await supabase
      .from('badges')
      .select('id')
      .ilike('name', badgeName)
      .limit(1);
      
    if (badgeError || !badges || badges.length === 0) {
      console.error(`Badge "${badgeName}" not found`);
      return false;
    }
    
    const badgeId = badges[0].id;
    
    // Check if user already has this badge
    const { data: existingBadges, error: existingError } = await supabase
      .from('user_badges')
      .select('id')
      .eq('user_id', userId)
      .eq('badge_id', badgeId)
      .limit(1);
      
    if (existingError) {
      console.error('Error checking existing badge:', existingError);
      return false;
    }
    
    if (existingBadges && existingBadges.length > 0) {
      console.log(`User already has badge "${badgeName}"`);
      return false; // Already has the badge
    }
    
    // Award the badge
    const { error: awardError } = await supabase
      .from('user_badges')
      .insert([{ user_id: userId, badge_id: badgeId }]);
      
    if (awardError) {
      console.error('Error awarding badge:', awardError);
      return false;
    }
    
    console.log(`Successfully awarded badge "${badgeName}" to user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error awarding badge:', error);
    return false;
  }
};

/**
 * Award a badge to a user by badge ID
 */
export const awardBadgeById = async (userId: string, badgeId: string): Promise<boolean> => {
  try {
    // Check if user already has this badge
    const { data: existingBadges, error: existingError } = await supabase
      .from('user_badges')
      .select('id')
      .eq('user_id', userId)
      .eq('badge_id', badgeId)
      .limit(1);
      
    if (existingError) {
      console.error('Error checking existing badge:', existingError);
      return false;
    }
    
    if (existingBadges && existingBadges.length > 0) {
      return false; // Already has the badge
    }
    
    // Award the badge
    const { error: awardError } = await supabase
      .from('user_badges')
      .insert([{ user_id: userId, badge_id: badgeId }]);
      
    if (awardError) {
      console.error('Error awarding badge:', awardError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error awarding badge:', error);
    return false;
  }
};

/**
 * Check and award achievement-based badges
 */
export const checkAchievementBadges = async (userId: string): Promise<string[]> => {
  try {
    // Get user's achievements count
    const { data: achievements, error: achievementsError } = await supabase
      .from('user_achievements')
      .select('id')
      .eq('user_id', userId);
      
    if (achievementsError) {
      console.error('Error checking user achievements:', achievementsError);
      return [];
    }
    
    const achievementCount = achievements?.length || 0;
    const awardedBadges: string[] = [];
    
    // First achievement badge
    if (achievementCount >= 1) {
      const awarded = await awardBadgeByName(userId, 'First Achievement');
      if (awarded) awardedBadges.push('First Achievement');
    }
    
    // 5 achievements badge
    if (achievementCount >= 5) {
      const awarded = await awardBadgeByName(userId, 'Achievement Hunter');
      if (awarded) awardedBadges.push('Achievement Hunter');
    }
    
    return awardedBadges;
  } catch (error) {
    console.error('Error checking achievement badges:', error);
    return [];
  }
};

/**
 * Check and award streak-based badges
 */
export const checkStreakBadges = async (userId: string, currentStreak: number): Promise<string[]> => {
  try {
    const streakMilestones = [3, 7, 14, 30, 60, 90];
    const awardedBadges: string[] = [];
    
    // Check each streak milestone
    for (const milestone of streakMilestones) {
      if (currentStreak >= milestone) {
        const badgeName = `${milestone}-Day Streak`;
        const awarded = await awardBadgeByName(userId, badgeName);
        if (awarded) awardedBadges.push(badgeName);
      }
    }
    
    return awardedBadges;
  } catch (error) {
    console.error('Error checking streak badges:', error);
    return [];
  }
};

/**
 * Check and award first check-in badge
 */
export const checkFirstCheckInBadge = async (userId: string): Promise<boolean> => {
  try {
    return await awardBadgeByName(userId, 'First Check-in');
  } catch (error) {
    console.error('Error checking first check-in badge:', error);
    return false;
  }
};

/**
 * Check and award welcome badge
 */
export const checkWelcomeBadge = async (userId: string): Promise<boolean> => {
  try {
    return await awardBadgeByName(userId, 'Welcome Badge');
  } catch (error) {
    console.error('Error checking welcome badge:', error);
    return false;
  }
};

/**
 * Check and award profile complete badge
 */
export const checkProfileCompleteBadge = async (userId: string): Promise<boolean> => {
  try {
    // Check if profile is complete
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('user_id', userId)
      .single();
      
    if (profileError) {
      console.error('Error checking profile:', profileError);
      return false;
    }
    
    // If profile has both display name and avatar, consider it complete
    if (profile && profile.display_name && profile.avatar_url) {
      return await awardBadgeByName(userId, 'Profile Complete');
    }
    
    return false;
  } catch (error) {
    console.error('Error checking profile complete badge:', error);
    return false;
  }
};
```

### 2. Update BadgeContext

Improve the BadgeContext to provide a cleaner interface and better error handling:

```typescript
// src/contexts/BadgeContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useAppState } from './AppStateContext';
import * as BadgeService from '@/services/BadgeService';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon_name: string;
  category: string;
  created_at: string;
}

export interface UserBadge {
  id: string;
  created_at: string;
  user_id: string;
  badge_id: string;
  badge?: Badge;
}

interface BadgeContextType {
  badges: Badge[];
  userBadges: UserBadge[];
  refreshBadges: () => Promise<void>;
  addUserBadge: (badgeName: string) => Promise<boolean>;
  getBadgeById: (id: string) => Badge | undefined;
  getBadgeByName: (name: string) => Badge | undefined;
  checkStreakBadges: (currentStreak: number) => Promise<string[]>;
  checkAchievementBadges: () => Promise<string[]>;
  checkFirstCheckInBadge: () => Promise<boolean>;
  checkProfileCompleteBadge: () => Promise<boolean>;
  isLoading: boolean;
}

const BadgeContext = createContext<BadgeContextType | undefined>(undefined);

export const useBadges = () => {
  const context = useContext(BadgeContext);
  if (!context) {
    throw new Error('useBadges must be used within a BadgeProvider');
  }
  return context;
};

export const BadgeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { showSuccess } = useAppState();

  // Initialize badges and fetch user badges
  useEffect(() => {
    if (user) {
      initializeAndFetchBadges();
    }
  }, [user?.id]);

  const initializeAndFetchBadges = async () => {
    setIsLoading(true);
    try {
      // Initialize badges table if needed
      await BadgeService.initializeBadges();
      
      // Fetch all badges
      const allBadges = await BadgeService.getBadges();
      setBadges(allBadges);
      
      // Fetch user badges if logged in
      if (user) {
        const userBadgeData = await BadgeService.getUserBadges(user.id);
        setUserBadges(userBadgeData);
      }
    } catch (error) {
      console.error('Error initializing and fetching badges:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshBadges = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Refresh all badges
      const allBadges = await BadgeService.getBadges();
      setBadges(allBadges);
      
      // Refresh user badges
      const userBadgeData = await BadgeService.getUserBadges(user.id);
      setUserBadges(userBadgeData);
    } catch (error) {
      console.error('Error refreshing badges:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addUserBadge = async (badgeName: string): Promise<boolean> => {
    if (!user) return false;
    
    setIsLoading(true);
    try {
      const awarded = await BadgeService.awardBadgeByName(user.id, badgeName);
      
      if (awarded) {
        // Show success message
        showSuccess(`🏅 Badge Earned: ${badgeName}`);
        
        // Refresh user badges
        await refreshBadges();
      }
      
      return awarded;
    } catch (error) {
      console.error('Error adding user badge:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getBadgeById = (id: string): Badge | undefined => {
    return badges.find(badge => badge.id === id);
  };

  const getBadgeByName = (name: string): Badge | undefined => {
    return badges.find(badge => badge.name === name);
  };

  const checkAchievementBadges = async (): Promise<string[]> => {
    if (!user) return [];
    
    try {
      const awardedBadges = await BadgeService.checkAchievementBadges(user.id);
      
      // Show success messages and refresh if any badges were awarded
      if (awardedBadges.length > 0) {
        awardedBadges.forEach(badgeName => {
          showSuccess(`🏅 Badge Earned: ${badgeName}`);
        });
        
        await refreshBadges();
      }
      
      return awardedBadges;
    } catch (error) {
      console.error('Error checking achievement badges:', error);
      return [];
    }
  };

  const checkStreakBadges = async (currentStreak: number): Promise<string[]> => {
    if (!user) return [];
    
    try {
      const awardedBadges = await BadgeService.checkStreakBadges(user.id, currentStreak);
      
      // Show success messages and refresh if any badges were awarded
      if (awardedBadges.length > 0) {
        awardedBadges.forEach(badgeName => {
          showSuccess(`🏅 Badge Earned: ${badgeName}`);
        });
        
        await refreshBadges();
      }
      
      return awardedBadges;
    } catch (error) {
      console.error('Error checking streak badges:', error);
      return [];
    }
  };

  const checkFirstCheckInBadge = async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const awarded = await BadgeService.checkFirstCheckInBadge(user.id);
      
      if (awarded) {
        showSuccess('🏅 Badge Earned: First Check-in');
        await refreshBadges();
      }
      
      return awarded;
    } catch (error) {
      console.error('Error checking first check-in badge:', error);
      return false;
    }
  };

  const checkProfileCompleteBadge = async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const awarded = await BadgeService.checkProfileCompleteBadge(user.id);
      
      if (awarded) {
        showSuccess('🏅 Badge Earned: Profile Complete');
        await refreshBadges();
      }
      
      return awarded;
    } catch (error) {
      console.error('Error checking profile complete badge:', error);
      return false;
    }
  };

  return (
    <BadgeContext.Provider value={{
      badges,
      userBadges,
      refreshBadges,
      addUserBadge,
      getBadgeById,
      getBadgeByName,
      checkStreakBadges,
      checkAchievementBadges,
      checkFirstCheckInBadge,
      checkProfileCompleteBadge,
      isLoading
    }}>
      {children}
    </BadgeContext.Provider>
  );
};
```

### 3. Integrate Badge System with Other Components

#### Update CheckInStreakContext to award badges on streak updates:

```typescript
// Add to CheckInStreakContext.tsx - incrementStreak function

// After updating the streak and profile
const { checkStreakBadges } = useBadges();

// Check for streak-based badges using the overall streak
if (newOverallStreak > 0) {
  await checkStreakBadges(newOverallStreak);
}

// Check for first check-in badge if this is the first check-in
if (newOverallStreak === 1) {
  await checkFirstCheckInBadge();
}
```

#### Update AchievementsContext to award badges when achievements are earned:

```typescript
// Add to AchievementsContext.tsx - checkForPossibleAchievements function

// After awarding achievements
const { checkAchievementBadges } = useBadges();

// Check for achievement-based badges
if (newlyAwardedAchievements.length > 0) {
  await checkAchievementBadges();
}
```

#### Update ProfileContext to award badges when profile is completed:

```typescript
// Add to ProfileContext.tsx - updateProfile function

// After updating profile
const { checkProfileCompleteBadge } = useBadges();

// Check if profile is now complete
await checkProfileCompleteBadge();
```

### 4. Improve the RecentBadges UI Component

```typescript
// src/components/home/RecentBadges.tsx

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Typography, Card } from '@/components/common';
import { useBadges, UserBadge } from '@/contexts/BadgeContext';
import { FontAwesome6 } from '@expo/vector-icons';
import theme from '@/constants/theme';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';

export const RecentBadges = () => {
  const { userBadges, badges, refreshBadges, isLoading } = useBadges();
  const router = useRouter();
  const [recentBadges, setRecentBadges] = useState<UserBadge[]>([]);
  
  // Refresh badges when component mounts and when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      refreshBadges();
      return () => {};
    }, [])
  );
  
  // Get the most recent 3 badges
  useEffect(() => {
    const sorted = [...userBadges]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3);
    setRecentBadges(sorted);
  }, [userBadges]);
  
  if (recentBadges.length === 0 && !isLoading) {
    return null; // Don't show anything if there are no badges and not loading
  }
  
  const getBadgeIcon = (category: string) => {
    switch (category) {
      case 'beginner': return 'star';
      case 'intermediate': return 'trophy';
      case 'advanced': return 'award';
      case 'expert': return 'medal';
      case 'master': return 'gem';
      case 'streak': return 'fire';
      case 'profile': return 'user';
      case 'achievement': return 'trophy';
      default: return 'star';
    }
  };
  
  const getBadgeColor = (category: string) => {
    switch (category) {
      case 'beginner': return theme.COLORS.primary.green;
      case 'intermediate': return theme.COLORS.primary.blue;
      case 'advanced': return theme.COLORS.primary.purple;
      case 'expert': return theme.COLORS.primary.orange;
      case 'master': return theme.COLORS.primary.yellow;
      case 'streak': return theme.COLORS.primary.orange;
      case 'profile': return theme.COLORS.primary.blue;
      case 'achievement': return theme.COLORS.primary.purple;
      default: return theme.COLORS.primary.green;
    }
  };
  
  return (
    <Card style={styles.container} variant="glow">
      <View style={styles.header}>
        <Typography variant="h3" style={styles.title} glow="soft">
          Recent Badges
        </Typography>
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={() => router.push('/(app)/achievements')}
        >
          <Typography variant="caption" color={theme.COLORS.primary.blue}>
            View All
          </Typography>
        </TouchableOpacity>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={theme.COLORS.primary.blue} />
        </View>
      ) : (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.badgesContainer}
        >
          {recentBadges.map(userBadge => {
            const badge = badges.find(b => b.id === userBadge.badge_id) || userBadge.badge;
            if (!badge) return null;
            
            return (
              <View key={userBadge.id} style={styles.badgeItem}>
                <View 
                  style={[
                    styles.badgeIcon, 
                    { backgroundColor: `${getBadgeColor(badge.category)}30` }
                  ]}
                >
                  <FontAwesome6 
                    name={getBadgeIcon(badge.category)} 
                    size={24} 
                    color={getBadgeColor(badge.category)} 
                  />
                </View>
                <Typography variant="caption" style={styles.badgeName}>
                  {badge.name}
                </Typography>
                <Typography 
                  variant="caption" 
                  style={styles.badgeDate}
                  color={theme.COLORS.ui.textSecondary}
                >
                  {new Date(userBadge.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </Typography>
              </View>
            );
          })}
        </ScrollView>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: theme.SPACING.lg,
    marginBottom: theme.SPACING.lg,
    padding: theme.SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.SPACING.sm,
  },
  title: {
    fontSize: 18,
  },
  viewAllButton: {
    padding: theme.SPACING.xs,
  },
  badgesContainer: {
    paddingVertical: theme.SPACING.sm,
  },
  loadingContainer: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeItem: {
    alignItems: 'center',
    marginRight: theme.SPACING.lg,
    width: 80,
  },
  badgeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.SPACING.xs,
  },
  badgeName: {
    textAlign: 'center',
    fontSize: 12,
    marginBottom: 2,
  },
  badgeDate: {
    textAlign: 'center',
    fontSize: 10,
  },
});
```

### 5. Create a Badge Detail Component 

```typescript
// src/components/badges/BadgeDetail.tsx

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography, Card } from '@/components/common';
import { Badge } from '@/contexts/BadgeContext';
import { FontAwesome6 } from '@expo/vector-icons';
import theme from '@/constants/theme';

interface BadgeDetailProps {
  badge: Badge;
  earnedDate?: string;
}

export const BadgeDetail: React.FC<BadgeDetailProps> = ({ badge, earnedDate }) => {
  const getBadgeIcon = (category: string) => {
    switch (category) {
      case 'beginner': return 'star';
      case 'intermediate': return 'trophy';
      case 'advanced': return 'award';
      case 'expert': return 'medal';
      case 'master': return 'gem';
      case 'streak': return 'fire';
      case 'profile': return 'user';
      case 'achievement': return 'trophy';
      default: return 'star';
    }
  };
  
  const getBadgeColor = (category: string) => {
    switch (category) {
      case 'beginner': return theme.COLORS.primary.green;
      case 'intermediate': return theme.COLORS.primary.blue;
      case 'advanced': return theme.COLORS.primary.purple;
      case 'expert': return theme.COLORS.primary.orange;
      case 'master': return theme.COLORS.primary.yellow;
      case 'streak': return theme.COLORS.primary.orange;
      case 'profile': return theme.COLORS.primary.blue;
      case 'achievement': return theme.COLORS.primary.purple;
      default: return theme.COLORS.primary.green;
    }
  };
  
  return (
    <Card style={styles.container} variant="glow">
      <View style={styles.content}>
        <View 
          style={[
            styles.badgeIcon, 
            { backgroundColor: `${getBadgeColor(badge.category)}30` }
          ]}
        >
          <FontAwesome6 
            name={getBadgeIcon(badge.category)} 
            size={36} 
            color={getBadgeColor(badge.category)} 
          />
        </View>
        
        <View style={styles.textContainer}>
          <Typography variant="h3" style={styles.badgeName} glow="soft">
            {badge.name}
          </Typography>
          
          <Typography variant="body" style={styles.badgeDescription}>
            {badge.description}
          </Typography>
          
          {earnedDate && (
            <Typography 
              variant="caption" 
              style={styles.earnedDate}
              color={theme.COLORS.ui.textSecondary}
            >
              Earned on {new Date(earnedDate).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </Typography>
          )}
          
          <View style={styles.categoryContainer}>
            <Typography 
              variant="caption" 
              style={styles.categoryLabel}
              color={theme.COLORS.ui.textSecondary}
            >
              Category:
            </Typography>
            <Typography 
              variant="caption" 
              style={styles.categoryValue}
              color={getBadgeColor(badge.category)}
            >
              {badge.category.charAt(0).toUpperCase() + badge.category.slice(1)}
            </Typography>
          </View>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.SPACING.md,
    padding: theme.SPACING.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.SPACING.md,
  },
  textContainer: {
    flex: 1,
  },
  badgeName: {
    fontSize: 18,
    marginBottom: theme.SPACING.xs,
  },
  badgeDescription: {
    fontSize: 14,
    marginBottom: theme.SPACING.xs,
  },
  earnedDate: {
    fontSize: 12,
    marginBottom: theme.SPACING.xs,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryLabel: {
    fontSize: 12,
    marginRight: theme.SPACING.xs,
  },
  categoryValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});
```

## Testing Plan

1. Test badge initialization:
   - Verify that badge table is populated with default badges
   - Check error handling for badge creation

2. Test badge awarding:
   - Verify welcome badge is awarded to new users
   - Verify first check-in badge is awarded after first check-in
   - Verify streak badges are awarded at appropriate milestones (3, 7, 14, 30, 60, 90 days)
   - Verify achievement-based badges are awarded

3. Test UI display:
   - Verify RecentBadges component shows latest badges
   - Verify badges screen shows all earned badges
   - Verify badge details are displayed correctly

4. Test error handling:
   - Verify system handles cases where badge doesn't exist
   - Verify system prevents duplicate badge awards

## Timeline

- Badge Service Implementation: 1 day
- BadgeContext Refactoring: 1 day
- Component Integration: 1 day
- UI Improvements: 1 day
- Testing: 1 day

Total: 5 days 