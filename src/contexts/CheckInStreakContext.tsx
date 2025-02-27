import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { useAppState } from './AppStateContext';
import { BadgeService } from '@/services/BadgeService';

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
  
  const { user } = useAuth();
  const { showError, showSuccess } = useAppState();

  const fetchStreaks = async () => {
    if (!user) return;
    
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
        return;
      }
      
      setStreaks({
        morning: data.morning_streak || 0,
        afternoon: data.afternoon_streak || 0,
        evening: data.evening_streak || 0,
        lastMorningCheckIn: data.last_morning_check_in,
        lastAfternoonCheckIn: data.last_afternoon_check_in,
        lastEveningCheckIn: data.last_evening_check_in,
      });
    } catch (error: any) {
      console.error('Error fetching streaks:', error.message);
    }
  };

  const createStreakRecord = async () => {
    if (!user) return;
    
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
    } catch (error: any) {
      console.error('Error creating streak record:', error.message);
    }
  };

  const refreshStreaks = async () => {
    await fetchStreaks();
  };

  const incrementStreak = useCallback(async (period: 'morning' | 'afternoon' | 'evening') => {
    if (!user) return;
    
    try {
      // Get current streaks
      const { data: currentStreaks, error: streaksError } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (streaksError && streaksError.code !== 'PGRST116') {
        console.error('Error fetching streaks:', streaksError);
        return;
      }
      
      // Determine which streak to increment
      const streakField = `${period.toLowerCase()}_streak`;
      const lastCheckInField = `last_${period.toLowerCase()}_check_in`;
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      
      let newStreakValue = 1; // Default to 1 for new streak
      
      if (currentStreaks) {
        const lastCheckIn = currentStreaks[lastCheckInField];
        
        if (lastCheckIn) {
          const lastCheckInDate = new Date(lastCheckIn);
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          
          // If last check-in was yesterday, increment streak
          if (lastCheckInDate.toDateString() === yesterday.toDateString()) {
            newStreakValue = (currentStreaks[streakField] || 0) + 1;
          } 
          // If last check-in was today, keep current streak
          else if (lastCheckInDate.toDateString() === now.toDateString()) {
            newStreakValue = currentStreaks[streakField] || 1;
          }
          // Otherwise (gap in streak), start new streak at 1
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
          return;
        }
      }
      
      // Update local state
      setStreaks(prev => ({
        ...prev,
        [period.toLowerCase()]: newStreakValue
      }));
      
      // Call onStreakUpdated callback if provided
      if (onStreakUpdated) {
        try {
          const updatedStreaks = {
            ...streaks,
            [period.toLowerCase()]: newStreakValue
          };
          
          // Check if this is the first check-in
          const isFirstCheckIn = !streaks.morning && !streaks.afternoon && !streaks.evening && newStreakValue === 1;
          
          // Check if all periods were completed today
          const allPeriodsCompleted = false; // This would need more logic to determine accurately
          
          onStreakUpdated(updatedStreaks, isFirstCheckIn, allPeriodsCompleted);
        } catch (callbackError) {
          console.error('Error in streak update callback:', callbackError);
          // Don't show error to user, just log it
        }
      }
      
      // Show success message for milestone streaks
      if ([3, 7, 14, 30, 60, 90].includes(newStreakValue)) {
        showSuccess(`🔥 ${newStreakValue} day ${period} streak achieved!`);
      }
    } catch (error: any) {
      console.error('Error incrementing streak:', error.message);
      // Don't show error to user, just log it
    }
  }, [user, streaks, onStreakUpdated, showSuccess]);

  // Helper function to check if a date is today
  const isToday = (date: Date) => {
    if (!date || isNaN(date.getTime())) return false;
    
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

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
      onStreakUpdated,
    }}>
      {children}
    </CheckInStreakContext.Provider>
  );
}; 