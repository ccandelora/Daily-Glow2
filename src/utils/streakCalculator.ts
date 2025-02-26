import { CheckInStreak } from '@/contexts/CheckInStreakContext';

/**
 * Calculates the overall streak based on check-in data
 * This is the standard way to calculate streaks across the app
 * 
 * @param streaks The check-in streak data
 * @returns The calculated overall streak count
 */
export const calculateOverallStreak = (streaks: CheckInStreak | null | undefined): number => {
  if (!streaks) return 0;
  
  const { morning, afternoon, evening } = streaks;
  
  // Get the dates of the last check-ins for each period
  const lastMorningDate = streaks.lastMorningCheckIn ? new Date(streaks.lastMorningCheckIn) : null;
  const lastAfternoonDate = streaks.lastAfternoonCheckIn ? new Date(streaks.lastAfternoonCheckIn) : null;
  const lastEveningDate = streaks.lastEveningCheckIn ? new Date(streaks.lastEveningCheckIn) : null;
  
  // Get the most recent check-in date
  const checkInDates = [lastMorningDate, lastAfternoonDate, lastEveningDate].filter(Boolean) as Date[];
  
  if (checkInDates.length === 0) return 0;
  
  // Sort dates in descending order (most recent first)
  checkInDates.sort((a, b) => b.getTime() - a.getTime());
  
  const mostRecentDate = checkInDates[0];
  const today = new Date();
  const isToday = mostRecentDate.getDate() === today.getDate() && 
                  mostRecentDate.getMonth() === today.getMonth() && 
                  mostRecentDate.getFullYear() === today.getFullYear();
  
  // Calculate streak based on the maximum streak value
  let calculatedStreak = Math.max(morning, afternoon, evening);
  
  // If we have multiple periods with streaks, we can be more confident in the streak
  const periodsWithStreaks = [
    morning > 0 ? 1 : 0,
    afternoon > 0 ? 1 : 0,
    evening > 0 ? 1 : 0
  ].reduce((sum, val) => sum + val, 0);
  
  if (periodsWithStreaks >= 2) {
    // If we have an afternoon streak of 2 and a morning streak of 1,
    // it's likely the user has checked in for 2 consecutive days
    calculatedStreak = Math.max(calculatedStreak, afternoon);
  }
  
  return calculatedStreak;
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