import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppState } from './AppStateContext';
import { useAuth } from './AuthContext';
import { Achievement, UserAchievement } from './UserProfileContext';

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
      // Since there's no achievements table, we'll create achievements from the user_achievements table
      // This is a temporary solution until the achievements table is created
      const mockAchievements: Achievement[] = [
        {
          id: 'streak3',
          name: '3-Day Streak',
          description: 'Complete check-ins for 3 consecutive days',
          icon_name: 'trophy',
          points: 50,
          requires_streak: 3,
          created_at: new Date().toISOString()
        },
        {
          id: 'streak7',
          name: '7-Day Streak',
          description: 'Complete check-ins for 7 consecutive days',
          icon_name: 'award',
          points: 100,
          requires_streak: 7,
          created_at: new Date().toISOString()
        },
        {
          id: 'streak14',
          name: '2-Week Streak',
          description: 'Complete check-ins for 14 consecutive days',
          icon_name: 'star',
          points: 200,
          requires_streak: 14,
          created_at: new Date().toISOString()
        },
        // Morning streak achievements
        {
          id: 'morningStreak3',
          name: 'Morning Person: Bronze',
          description: 'Complete morning check-ins for 3 consecutive days',
          icon_name: 'sun',
          points: 30,
          requires_streak: 3,
          created_at: new Date().toISOString()
        },
        {
          id: 'morningStreak7',
          name: 'Morning Person: Silver',
          description: 'Complete morning check-ins for 7 consecutive days',
          icon_name: 'sun',
          points: 75,
          requires_streak: 7,
          created_at: new Date().toISOString()
        },
        {
          id: 'morningStreak14',
          name: 'Morning Person: Gold',
          description: 'Complete morning check-ins for 14 consecutive days',
          icon_name: 'sun',
          points: 150,
          requires_streak: 14,
          created_at: new Date().toISOString()
        },
        // Afternoon streak achievements
        {
          id: 'afternoonStreak3',
          name: 'Afternoon Achiever: Bronze',
          description: 'Complete afternoon check-ins for 3 consecutive days',
          icon_name: 'cloud-sun',
          points: 30,
          requires_streak: 3,
          created_at: new Date().toISOString()
        },
        {
          id: 'afternoonStreak7',
          name: 'Afternoon Achiever: Silver',
          description: 'Complete afternoon check-ins for 7 consecutive days',
          icon_name: 'cloud-sun',
          points: 75,
          requires_streak: 7,
          created_at: new Date().toISOString()
        },
        {
          id: 'afternoonStreak14',
          name: 'Afternoon Achiever: Gold',
          description: 'Complete afternoon check-ins for 14 consecutive days',
          icon_name: 'cloud-sun',
          points: 150,
          requires_streak: 14,
          created_at: new Date().toISOString()
        },
        // Evening streak achievements
        {
          id: 'eveningStreak3',
          name: 'Evening Reflector: Bronze',
          description: 'Complete evening check-ins for 3 consecutive days',
          icon_name: 'moon',
          points: 30,
          requires_streak: 3,
          created_at: new Date().toISOString()
        },
        {
          id: 'eveningStreak7',
          name: 'Evening Reflector: Silver',
          description: 'Complete evening check-ins for 7 consecutive days',
          icon_name: 'moon',
          points: 75,
          requires_streak: 7,
          created_at: new Date().toISOString()
        },
        {
          id: 'eveningStreak14',
          name: 'Evening Reflector: Gold',
          description: 'Complete evening check-ins for 14 consecutive days',
          icon_name: 'moon',
          points: 150,
          requires_streak: 14,
          created_at: new Date().toISOString()
        },
        // Complete day achievements
        {
          id: 'fullDayStreak3',
          name: 'Full Day Master: Bronze',
          description: 'Complete check-ins for all time periods (morning, afternoon, evening) for 3 consecutive days',
          icon_name: 'clock',
          points: 100,
          requires_streak: 3,
          created_at: new Date().toISOString()
        },
        {
          id: 'fullDayStreak7',
          name: 'Full Day Master: Gold',
          description: 'Complete check-ins for all time periods (morning, afternoon, evening) for 7 consecutive days',
          icon_name: 'clock',
          points: 250,
          requires_streak: 7,
          created_at: new Date().toISOString()
        },
        {
          id: 'firstCheckIn',
          name: 'First Check-in',
          description: 'Complete your first daily check-in',
          icon_name: 'circle-check',
          points: 25,
          requires_streak: null,
          created_at: new Date().toISOString()
        },
        {
          id: 'completeProfile',
          name: 'Profile Complete',
          description: 'Fill out your profile information',
          icon_name: 'user',
          points: 25,
          requires_streak: null,
          created_at: new Date().toISOString()
        }
      ];
      
      console.log('Using mock achievements:', mockAchievements.length);
      setAchievements(mockAchievements);
    } catch (error) {
      console.error('Error setting up achievements:', error);
      setAchievements([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserAchievements = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Since we're using mock achievements, we'll create mock user achievements based on the user's streak
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('streak')
        .eq('user_id', user.id)
        .single();
        
      if (profileError) {
        console.log('Error fetching user profile for achievements:', profileError.message);
        setUserAchievements([]);
        setIsLoading(false);
        return;
      }
      
      const userStreak = profileData?.streak || 0;
      const mockUserAchievements: UserAchievement[] = [];
      
      // Add first check-in achievement if user has any streak
      if (userStreak > 0) {
        mockUserAchievements.push({
          id: 'ua-firstCheckIn',
          user_id: user.id,
          achievement_id: 'firstCheckIn',
          created_at: new Date().toISOString(),
          achievement: {
            id: 'firstCheckIn',
            name: 'First Check-in',
            description: 'Complete your first daily check-in',
            icon_name: 'circle-check',
            points: 25,
            requires_streak: null,
            created_at: new Date().toISOString()
          }
        });
      }
      
      // Add streak achievements based on user's current streak
      if (userStreak >= 3) {
        mockUserAchievements.push({
          id: 'ua-streak3',
          user_id: user.id,
          achievement_id: 'streak3',
          created_at: new Date().toISOString(),
          achievement: {
            id: 'streak3',
            name: '3-Day Streak',
            description: 'Complete check-ins for 3 consecutive days',
            icon_name: 'trophy',
            points: 50,
            requires_streak: 3,
            created_at: new Date().toISOString()
          }
        });
      }
      
      if (userStreak >= 7) {
        mockUserAchievements.push({
          id: 'ua-streak7',
          user_id: user.id,
          achievement_id: 'streak7',
          created_at: new Date().toISOString(),
          achievement: {
            id: 'streak7',
            name: '7-Day Streak',
            description: 'Complete check-ins for 7 consecutive days',
            icon_name: 'award',
            points: 100,
            requires_streak: 7,
            created_at: new Date().toISOString()
          }
        });
      }
      
      console.log('Using mock user achievements:', mockUserAchievements.length);
      setUserAchievements(mockUserAchievements);
    } catch (error) {
      console.error('Error setting up user achievements:', error);
      setUserAchievements([]);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAchievements = async () => {
    setIsLoading(true);
    try {
      await fetchAchievements();
      await fetchUserAchievements();
    } catch (error) {
      console.error('Error refreshing achievements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshAchievements();
  }, [user?.id]);

  const getAchievementById = (id: string) => {
    return achievements.find(achievement => achievement.id === id);
  };

  const addUserAchievement = async (achievementId: string) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Check if user already has this achievement
      const exists = userAchievements.some(ua => ua.achievement_id === achievementId);
      if (exists) {
        setIsLoading(false);
        return;
      }
      
      const achievement = getAchievementById(achievementId);
      
      const { error } = await supabase
        .from('user_achievements')
        .insert([
          { user_id: user.id, achievement_id: achievementId }
        ]);
        
      if (error) throw error;
      
      // Show success message
      showSuccess(`🏆 Achievement Unlocked: ${achievement?.name || 'New Achievement'}`);
      
      // Refresh user achievements
      await fetchUserAchievements();
    } catch (error: any) {
      console.error('Error adding user achievement:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const checkForPossibleAchievements = async (currentStreak = 0): Promise<Achievement[]> => {
    if (!user) return [];
    
    setIsLoading(true);
    try {
      const unlockedAchievements: Achievement[] = [];
      
      // Get all streak-based achievements user doesn't have yet
      const streakAchievements = achievements.filter(achievement => 
        achievement.requires_streak && 
        achievement.requires_streak <= currentStreak &&
        !userAchievements.some(ua => ua.achievement_id === achievement.id)
      );
      
      // Unlock any eligible achievements
      for (const achievement of streakAchievements) {
        await addUserAchievement(achievement.id);
        unlockedAchievements.push(achievement);
      }
      
      return unlockedAchievements;
    } catch (error) {
      console.error('Error checking for possible achievements:', error);
      return [];
    } finally {
      setIsLoading(false);
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