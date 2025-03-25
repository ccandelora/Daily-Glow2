import { CheckInStreak } from '@/contexts/CheckInStreakContext';

/**
 * Calculates the overall streak based on check-in data
 * A streak is maintained when at least one check-in is completed per day
 * 
 * @param streaks The check-in streak data
 * @returns The calculated overall streak count
 */
export const calculateOverallStreak = (streaks: CheckInStreak | null | undefined): number => {
  if (!streaks) return 0;
  
  // Get the dates of the last check-ins for each period
  const lastCheckIns = [
    streaks.lastMorningCheckIn ? new Date(streaks.lastMorningCheckIn) : null,
    streaks.lastAfternoonCheckIn ? new Date(streaks.lastAfternoonCheckIn) : null,
    streaks.lastEveningCheckIn ? new Date(streaks.lastEveningCheckIn) : null,
  ].filter(Boolean) as Date[];
  
  if (lastCheckIns.length === 0) return 0;
  
  // Sort dates in descending order (most recent first)
  lastCheckIns.sort((a, b) => b.getTime() - a.getTime());
  
  const mostRecentCheckIn = lastCheckIns[0];
  const today = new Date();
  
  // Check if the most recent check-in was today or yesterday
  const isToday = isSameDay(mostRecentCheckIn, today);
  const isYesterday = isSameDay(mostRecentCheckIn, getPreviousDay(today));
  
  // If the most recent check-in wasn't today or yesterday, streak is broken
  if (!isToday && !isYesterday) return 0;
  
  // Find the highest period streak
  // This assumes at least one period streak is being properly maintained
  const highestPeriodStreak = Math.max(
    streaks.morning || 0,
    streaks.afternoon || 0,
    streaks.evening || 0
  );
  
  return highestPeriodStreak;
};

/**
 * Checks if a check-in should increase the streak
 * 
 * @param lastCheckIn Last check-in timestamp for the period
 * @returns Whether the streak should be increased
 */
export const shouldIncreaseStreak = (lastCheckIn: string | null): boolean => {
  if (!lastCheckIn) return true; // First check-in
  
  const lastDate = new Date(lastCheckIn);
  const today = new Date();
  
  // Reset time portion to compare dates only
  const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterdayDay = new Date(todayDay);
  yesterdayDay.setDate(yesterdayDay.getDate() - 1);
  
  // If last check-in was yesterday, increase streak
  if (lastDay.getTime() === yesterdayDay.getTime()) {
    return true;
  }
  
  // If last check-in was today, maintain streak (don't increase)
  if (lastDay.getTime() === todayDay.getTime()) {
    return false;
  }
  
  // Otherwise, reset streak (more than 1 day ago)
  return false;
};

/**
 * Checks if a streak should be reset
 * 
 * @param lastCheckIn Last check-in timestamp for the period
 * @returns Whether the streak should be reset to 1
 */
export const shouldResetStreak = (lastCheckIn: string | null): boolean => {
  if (!lastCheckIn) return false; // First check-in
  
  const lastDate = new Date(lastCheckIn);
  const today = new Date();
  
  // Reset time portion to compare dates only
  const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterdayDay = new Date(todayDay);
  yesterdayDay.setDate(yesterdayDay.getDate() - 1);
  
  // If last check-in was before yesterday, reset streak
  return lastDay.getTime() < yesterdayDay.getTime();
};

/**
 * Helper function to check if two dates are the same day
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear();
};

/**
 * Helper function to get the previous day
 */
export const getPreviousDay = (date: Date): Date => {
  const prevDay = new Date(date);
  prevDay.setDate(prevDay.getDate() - 1);
  return prevDay;
};

/**
 * Calculates a streak based on an array of dates
 * This is useful for journal entries or other date-based activities
 * 
 * @param dates Array of dates to calculate streak from
 * @returns The calculated streak count
 */
export const calculateDateStreak = (dates: Date[]): number => {
  if (!dates || dates.length === 0) return 0;
  
  // Sort dates (newest first)
  const sortedDates = [...dates].sort((a, b) => b.getTime() - a.getTime());
  
  // Calculate streak by checking for consecutive days
  let streak = 1; // Start with 1 for the most recent day
  
  for (let i = 0; i < sortedDates.length - 1; i++) {
    const currentDate = sortedDates[i];
    const nextDate = sortedDates[i + 1];
    
    // Calculate difference in days
    const diffTime = currentDate.getTime() - nextDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // If the difference is exactly 1 day, continue the streak
    if (diffDays === 1) {
      streak++;
    } else {
      // Break in the streak
      break;
    }
  }
  
  return streak;
}; 