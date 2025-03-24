# Achievement System Implementation Plan

## Database Schema

### 1. Achievements Table
```sql
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  requires_streak INTEGER,
  category TEXT NOT NULL DEFAULT 'streak',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. User Achievements Table
```sql
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);
```

## Implementation Steps

### 1. Database Setup
- [ ] Verify if achievements table exists
- [ ] Create achievements table if missing
- [ ] Set up RLS (Row Level Security) policies for both tables
- [ ] Populate achievements table with initial achievements

### 2. Achievement Context Refactoring
- [ ] Update AchievementsContext to fetch real achievements from database
- [ ] Remove mock achievement code
- [ ] Implement proper achievement tracking
- [ ] Add loading states and error handling

### 3. Achievement Detection System
- [ ] Create robust achievement detection based on user actions
- [ ] Implement logic for different achievement types:
  - Streak-based achievements (3-day streak, 7-day streak, etc.)
  - Action-based achievements (first check-in, profile completion, etc.)
  - Challenge-based achievements (complete X challenges)
- [ ] Add proper notifications for new achievements

### 4. UI Updates
- [ ] Update AchievementsScreen to show real achievements
- [ ] Add loading states and animations
- [ ] Implement achievement unlock animations
- [ ] Show progress for locked achievements

## Code Changes

### Achievement Service

Create a new service for managing achievements:

```typescript
// src/services/AchievementService.ts
import { supabase } from '@/lib/supabase';
import { Achievement } from '@/contexts/UserProfileContext';

export const initializeAchievements = async (): Promise<void> => {
  // Check if achievements table exists and has records
  const { data, error } = await supabase
    .from('achievements')
    .select('id')
    .limit(1);
    
  if (error || !data || data.length === 0) {
    // Create default achievements
    const defaultAchievements = [
      {
        name: 'First Check-in',
        description: 'Complete your first daily check-in',
        icon_name: 'checkmark-circle-outline',
        points: 25,
        requires_streak: null,
        category: 'beginner'
      },
      {
        name: '3-Day Streak',
        description: 'Complete check-ins for 3 consecutive days',
        icon_name: 'trophy-outline',
        points: 50,
        requires_streak: 3,
        category: 'streak'
      },
      {
        name: '7-Day Streak',
        description: 'Complete check-ins for 7 consecutive days',
        icon_name: 'ribbon-outline',
        points: 100,
        requires_streak: 7,
        category: 'streak'
      },
      {
        name: '14-Day Streak',
        description: 'Complete check-ins for 14 consecutive days',
        icon_name: 'star-outline',
        points: 200,
        requires_streak: 14,
        category: 'streak'
      },
      {
        name: 'Profile Complete',
        description: 'Fill out your profile information',
        icon_name: 'person-outline',
        points: 25,
        requires_streak: null,
        category: 'profile'
      }
    ];
    
    // Insert default achievements
    const { error: insertError } = await supabase
      .from('achievements')
      .insert(defaultAchievements);
      
    if (insertError) {
      console.error('Error initializing achievements:', insertError);
      throw insertError;
    }
  }
};

export const getAchievements = async (): Promise<Achievement[]> => {
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .order('category', { ascending: true })
    .order('requires_streak', { ascending: true, nullsFirst: false });
    
  if (error) {
    console.error('Error fetching achievements:', error);
    return [];
  }
  
  return data || [];
};

export const getUserAchievements = async (userId: string): Promise<any[]> => {
  const { data, error } = await supabase
    .from('user_achievements')
    .select('*, achievement:achievements(*)')
    .eq('user_id', userId);
    
  if (error) {
    console.error('Error fetching user achievements:', error);
    return [];
  }
  
  return data || [];
};

export const addUserAchievement = async (userId: string, achievementId: string): Promise<boolean> => {
  // Check if user already has this achievement
  const { data: existing } = await supabase
    .from('user_achievements')
    .select('id')
    .eq('user_id', userId)
    .eq('achievement_id', achievementId)
    .single();
    
  if (existing) {
    return false; // Already has achievement
  }
  
  // Add achievement
  const { error } = await supabase
    .from('user_achievements')
    .insert([{ user_id: userId, achievement_id: achievementId }]);
    
  if (error) {
    console.error('Error adding user achievement:', error);
    return false;
  }
  
  return true;
};

export const checkForPossibleAchievements = async (
  userId: string,
  currentStreak: number = 0
): Promise<Achievement[]> => {
  // Get all achievements
  const allAchievements = await getAchievements();
  
  // Get user's current achievements
  const userAchievements = await getUserAchievements(userId);
  const userAchievementIds = userAchievements.map(ua => ua.achievement_id);
  
  // Find eligible streak achievements
  const eligibleAchievements = allAchievements.filter(achievement => 
    achievement.requires_streak && 
    achievement.requires_streak <= currentStreak &&
    !userAchievementIds.includes(achievement.id)
  );
  
  // Award new achievements
  const newlyAwardedAchievements: Achievement[] = [];
  
  for (const achievement of eligibleAchievements) {
    const awarded = await addUserAchievement(userId, achievement.id);
    if (awarded) {
      newlyAwardedAchievements.push(achievement);
    }
  }
  
  return newlyAwardedAchievements;
};
```

### Achievement Context Update

```typescript
// src/contexts/AchievementsContext.tsx (updated)
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAppState } from './AppStateContext';
import { useAuth } from './AuthContext';
import { Achievement, UserAchievement } from './UserProfileContext';
import * as AchievementService from '@/services/AchievementService';

interface AchievementsContextType {
  achievements: Achievement[];
  userAchievements: UserAchievement[];
  checkForPossibleAchievements: (currentStreak?: number) => Promise<Achievement[]>;
  addUserAchievement: (achievementId: string) => Promise<void>;
  getAchievementById: (id: string) => Achievement | undefined;
  refreshAchievements: () => Promise<void>;
  isLoading: boolean;
}

const AchievementsContext = createContext<AchievementsContextType | undefined>(undefined);

export const useAchievements = () => {
  const context = useContext(AchievementsContext);
  if (!context) {
    throw new Error('useAchievements must be used within an AchievementsProvider');
  }
  return context;
};

export const AchievementsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { showError, showSuccess } = useAppState();

  const fetchAchievements = async () => {
    setIsLoading(true);
    try {
      await AchievementService.initializeAchievements();
      const data = await AchievementService.getAchievements();
      setAchievements(data);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserAchievements = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const data = await AchievementService.getUserAchievements(user.id);
      setUserAchievements(data);
    } catch (error) {
      console.error('Error fetching user achievements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAchievements = async () => {
    await fetchAchievements();
    await fetchUserAchievements();
  };

  useEffect(() => {
    refreshAchievements();
  }, [user?.id]);

  const getAchievementById = (id: string) => {
    return achievements.find(achievement => achievement.id === id);
  };

  const addUserAchievement = async (achievementId: string) => {
    if (!user) return;
    
    try {
      const achievement = getAchievementById(achievementId);
      const awarded = await AchievementService.addUserAchievement(user.id, achievementId);
      
      if (awarded) {
        // Show success message
        showSuccess(`🏆 Achievement Unlocked: ${achievement?.name || 'New Achievement'}`);
        
        // Refresh user achievements
        await fetchUserAchievements();
      }
    } catch (error: any) {
      console.error('Error adding user achievement:', error.message);
    }
  };

  const checkForPossibleAchievements = async (currentStreak = 0): Promise<Achievement[]> => {
    if (!user) return [];
    
    try {
      const newAchievements = await AchievementService.checkForPossibleAchievements(
        user.id,
        currentStreak
      );
      
      if (newAchievements.length > 0) {
        // Show notification for each new achievement
        newAchievements.forEach(achievement => {
          showSuccess(`🏆 Achievement Unlocked: ${achievement.name}`);
        });
        
        // Refresh user achievements
        await fetchUserAchievements();
      }
      
      return newAchievements;
    } catch (error) {
      console.error('Error checking for possible achievements:', error);
      return [];
    }
  };

  return (
    <AchievementsContext.Provider value={{
      achievements,
      userAchievements,
      checkForPossibleAchievements,
      addUserAchievement,
      getAchievementById,
      refreshAchievements,
      isLoading,
    }}>
      {children}
    </AchievementsContext.Provider>
  );
};
```

## Testing Plan

1. Verify database tables are created properly
2. Test achievement unlocking for streak-based achievements:
   - Complete check-ins for 3 consecutive days
   - Verify 3-day streak achievement is awarded
3. Test achievement unlocking for action-based achievements:
   - Complete first check-in
   - Verify First Check-in achievement is awarded
4. Test UI updates:
   - Verify achievements screen shows correct data
   - Verify home screen shows latest achievements
5. Test data persistence:
   - Log out and log back in
   - Verify achievements and badges are still displayed correctly

## Timeline

- Database Setup: 1 day
- Context Refactoring: 1 day  
- Achievement Detection: 2 days
- UI Updates: 1 day
- Testing: 2 days

Total: 7 days 