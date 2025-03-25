import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { useAppState } from './AppStateContext';
import { BadgeService } from '@/services/BadgeService';
import { shouldIncreaseStreak, shouldResetStreak, calculateOverallStreak, isSameDay } from '@/utils/streakCalculator';

export interface CheckInStreak {
  morning: number;
  afternoon: number;
  evening: number;
  lastMorningCheckIn: string | null;
  lastAfternoonCheckIn: string | null;
  lastEveningCheckIn: string | null;
}

interface CheckInStreakContextType {
  streaks: CheckInStreak;
  incrementStreak: (period: 'morning' | 'afternoon' | 'evening') => Promise<void>;
  refreshStreaks: () => Promise<void>;
  overallStreak: number;
  isLoading: boolean;
  isFirstCheckIn: boolean;
  onStreakUpdated?: (streaks: CheckInStreak, isFirstCheckIn: boolean, allPeriodsCompleted: boolean) => void;
}

const CheckInStreakContext = createContext<CheckInStreakContextType | undefined>(undefined);

export const useCheckInStreak = () => {
  const context = useContext(CheckInStreakContext);
  if (!context) {
    throw new Error('useCheckInStreak must be used within a CheckInStreakProvider');
  }
  return context;
};

interface CheckInStreakProviderProps {
  children: React.ReactNode;
  onStreakUpdated?: (streaks: CheckInStreak, isFirstCheckIn: boolean, allPeriodsCompleted: boolean) => void;
}

export const CheckInStreakProvider: React.FC<CheckInStreakProviderProps> = ({ 
  children, 
  onStreakUpdated 
}) => {
  const [streaks, setStreaks] = useState<CheckInStreak>({
    morning: 0,
    afternoon: 0,
    evening: 0,
    lastMorningCheckIn: null,
    lastAfternoonCheckIn: null,
    lastEveningCheckIn: null,
  });
  
  const [overallStreak, setOverallStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isFirstCheckIn, setIsFirstCheckIn] = useState(false);
  const { user } = useAuth();
  const { showError, showSuccess } = useAppState();

  const fetchStreaks = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (error) {
        // If no record exists, create one without logging an error
        if (error.code === 'PGRST116') {
          console.log('No streak record found for user, creating one...');
          await createStreakRecord();
        } else {
          console.error('Error fetching streaks:', error);
        }
        setIsLoading(false);
        return;
      }
      
      const streakData = {
        morning: data.morning_streak || 0,
        afternoon: data.afternoon_streak || 0,
        evening: data.evening_streak || 0,
        lastMorningCheckIn: data.last_morning_check_in,
        lastAfternoonCheckIn: data.last_afternoon_check_in,
        lastEveningCheckIn: data.last_evening_check_in,
      };
      
      setStreaks(streakData);
      
      // Calculate overall streak
      const calculatedOverallStreak = calculateOverallStreak(streakData);
      setOverallStreak(calculatedOverallStreak);
    } catch (error: any) {
      console.error('Error fetching streaks:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const createStreakRecord = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('user_streaks')
        .insert([
          {
            user_id: user.id,
            morning_streak: 0,
            afternoon_streak: 0,
            evening_streak: 0,
          }
        ]);
        
      if (error) {
        // If it's a duplicate key error, another process might have created the record
        // This is not a critical error, so we can just fetch the record again
        if (error.code === '23505') {
          console.log('Streak record already exists, fetching it instead');
          await fetchStreaks();
          return;
        }
        
        console.error('Error creating streak record:', error);
        return;
      }
      
      setStreaks({
        morning: 0,
        afternoon: 0,
        evening: 0,
        lastMorningCheckIn: null,
        lastAfternoonCheckIn: null,
        lastEveningCheckIn: null,
      });
      
      setOverallStreak(0);
    } catch (error: any) {
      console.error('Error creating streak record:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshStreaks = async () => {
    await fetchStreaks();
  };

  const updateProfileStreak = async (newOverallStreak: number) => {
    if (!user) return;
    
    try {
      // Update the profile streak
      const { error } = await supabase
        .from('profiles')
        .update({
          streak: newOverallStreak,
          last_check_in: new Date().toISOString()
        })
        .eq('user_id', user.id);
        
      if (error) {
        console.error('Error updating profile streak:', error);
      }
    } catch (error: any) {
      console.error('Error updating profile streak:', error.message);
    }
  };

  // Helper function to safely check if a date is the same day as another date
  const isSameDayOrFalse = (dateStr: string | null, compareDate: Date): boolean => {
    if (!dateStr) return false;
    try {
      return isSameDay(new Date(dateStr), compareDate);
    } catch (e) {
      return false;
    }
  };

  const incrementStreak = useCallback(async (period: 'morning' | 'afternoon' | 'evening') => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Get current streaks
      const { data: currentStreaks, error: streaksError } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (streaksError && streaksError.code !== 'PGRST116') {
        console.error('Error fetching streaks:', streaksError);
        setIsLoading(false);
        return;
      }
      
      // Determine which streak to update
      const streakField = `${period.toLowerCase()}_streak`;
      const lastCheckInField = `last_${period.toLowerCase()}_check_in`;
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      
      let newStreakValue = 1; // Default to 1 for new streak
      
      if (currentStreaks) {
        const lastCheckIn = currentStreaks[lastCheckInField];
        
        if (shouldResetStreak(lastCheckIn)) {
          // If it's been more than a day since the last check-in, reset streak to 1
          newStreakValue = 1;
        } else if (shouldIncreaseStreak(lastCheckIn)) {
          // If last check-in was yesterday, increment streak
          newStreakValue = (currentStreaks[streakField] || 0) + 1;
        } else {
          // If last check-in was today, maintain current streak
          newStreakValue = currentStreaks[streakField] || 1;
        }
      }
      
      // Update or insert streak
      if (currentStreaks) {
        // Update existing streak
        const { error: updateError } = await supabase
          .from('user_streaks')
          .update({
            [streakField]: newStreakValue,
            [lastCheckInField]: today
          })
          .eq('user_id', user.id);
          
        if (updateError) {
          console.error('Error updating streak:', updateError);
          setIsLoading(false);
          return;
        }
      } else {
        // Create new streak record
        const { error: insertError } = await supabase
          .from('user_streaks')
          .insert([{
            user_id: user.id,
            [streakField]: newStreakValue,
            [lastCheckInField]: today
          }]);
          
        if (insertError) {
          console.error('Error creating streak:', insertError);
          setIsLoading(false);
          return;
        }
      }
      
      // Update local state
      const updatedStreaks = {
        ...streaks,
        [period.toLowerCase()]: newStreakValue,
        [`last${period.charAt(0).toUpperCase() + period.slice(1)}CheckIn`]: today
      };
      
      setStreaks(updatedStreaks);
      
      // Calculate new overall streak
      const newOverallStreak = calculateOverallStreak(updatedStreaks);
      setOverallStreak(newOverallStreak);
      
      // Update profile streak
      await updateProfileStreak(newOverallStreak);
      
      // Check if this is the first check-in
      const firstCheckIn = !streaks.morning && !streaks.afternoon && !streaks.evening && newStreakValue === 1;
      setIsFirstCheckIn(firstCheckIn);
      
      // Call onStreakUpdated callback if provided
      if (onStreakUpdated) {
        try {
          // Check if all periods were completed
          const nowDate = new Date();
          
          const allPeriodsCompleted = 
            isSameDayOrFalse(updatedStreaks.lastMorningCheckIn, nowDate) &&
            isSameDayOrFalse(updatedStreaks.lastAfternoonCheckIn, nowDate) &&
            isSameDayOrFalse(updatedStreaks.lastEveningCheckIn, nowDate);
          
          onStreakUpdated(updatedStreaks, firstCheckIn, allPeriodsCompleted);
        } catch (callbackError) {
          console.error('Error in streak update callback:', callbackError);
          // Don't show error to user, just log it
        }
      }
      
      // Show success message for milestone streaks
      if ([3, 7, 14, 30, 60, 90].includes(newStreakValue)) {
        showSuccess(`🔥 ${newStreakValue} day ${period} streak achieved!`);
      }
      
      // For overall milestone streaks
      if ([3, 7, 14, 30, 60, 90].includes(newOverallStreak)) {
        showSuccess(`🔥 ${newOverallStreak} day streak achieved!`);
        
        // This is where we would trigger achievement checks
        // await checkForPossibleAchievements(newOverallStreak);
      }
    } catch (error: any) {
      console.error('Error incrementing streak:', error.message);
      // Don't show error to user, just log it
    } finally {
      setIsLoading(false);
    }
  }, [user, streaks, onStreakUpdated, showSuccess]);

  // Initialize on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchStreaks();
    }
  }, [user?.id]);

  return (
    <CheckInStreakContext.Provider value={{
      streaks,
      incrementStreak,
      refreshStreaks,
      overallStreak,
      isLoading,
      isFirstCheckIn,
      onStreakUpdated,
    }}>
      {children}
    </CheckInStreakContext.Provider>
  );
}; 