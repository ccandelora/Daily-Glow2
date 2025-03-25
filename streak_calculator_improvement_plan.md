# Streak Calculation System Improvement Plan

## Current Issues

1. The streak calculation in `calculateOverallStreak` function uses the maximum of individual period streaks without properly verifying consecutive days.
2. The `profiles` table and `user_streaks` table both track streak information but aren't properly synchronized.
3. The streak reset logic when a day is missed isn't properly implemented.
4. There's no clear definition of what constitutes "maintaining a streak" (e.g., do users need to complete all three check-ins or just one per day?).

## Database Structure

Based on the provided schema:

1. **user_streaks table**:
   - morning_streak (int4)
   - afternoon_streak (int4)
   - evening_streak (int4)
   - last_morning_check_in (timestamp)
   - last_afternoon_check_in (timestamp)
   - last_evening_check_in (timestamp)

2. **profiles table**:
   - streak (int4)
   - last_check_in (timestamp)

## Implementation Plan

### 1. Define Streak Calculation Logic

**Overall Streak Definition:**
- A day streak increases when the user completes at least one check-in per day
- A streak breaks when a full calendar day passes with no check-ins
- The overall streak should be stored in the profiles.streak field

**Period Streak Definition:**
- Each period streak (morning, afternoon, evening) increases when the user completes that specific period's check-in on consecutive days
- A period streak breaks when a day passes without that specific check-in
- Each period streak is stored in its respective field in the user_streaks table

### 2. Improve Streak Calculator

Update the `streakCalculator.ts` file to implement the proper streak logic:

```typescript
// src/utils/streakCalculator.ts

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
```

### 3. Update CheckInStreakContext

Modify the `CheckInStreakContext.tsx` to properly handle streak calculations:

```typescript
// Updated incrementStreak function in CheckInStreakContext.tsx

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
    
    // Determine which streak to update
    const streakField = `${period.toLowerCase()}_streak`;
    const lastCheckInField = `last_${period.toLowerCase()}_check_in`;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    
    let newStreakValue = 1; // Default to 1 for new streak
    let streakIncreasedOrMaintained = false;
    
    if (currentStreaks) {
      const lastCheckIn = currentStreaks[lastCheckInField];
      
      if (shouldResetStreak(lastCheckIn)) {
        // If it's been more than a day since the last check-in, reset streak to 1
        newStreakValue = 1;
        streakIncreasedOrMaintained = false;
      } else if (shouldIncreaseStreak(lastCheckIn)) {
        // If last check-in was yesterday, increment streak
        newStreakValue = (currentStreaks[streakField] || 0) + 1;
        streakIncreasedOrMaintained = true;
      } else {
        // If last check-in was today, maintain current streak
        newStreakValue = currentStreaks[streakField] || 1;
        streakIncreasedOrMaintained = true;
      }
    }
    
    // Update user_streaks table
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
    
    // Update the overall streak in the profile
    await updateProfileStreak(streakIncreasedOrMaintained);
    
    // Update local state
    setStreaks(prev => ({
      ...prev,
      [period.toLowerCase()]: newStreakValue,
      [`last${period.charAt(0).toUpperCase() + period.slice(1)}CheckIn`]: today
    }));
    
    // Call onStreakUpdated callback if provided
    if (onStreakUpdated) {
      try {
        const updatedStreaks = {
          ...streaks,
          [period.toLowerCase()]: newStreakValue,
          [`last${period.charAt(0).toUpperCase() + period.slice(1)}CheckIn`]: today
        };
        
        // Check if this is the first check-in
        const isFirstCheckIn = !streaks.morning && !streaks.afternoon && !streaks.evening && newStreakValue === 1;
        
        // Check if all periods were completed
        const now = new Date();
        const todayString = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        
        const allPeriodsCompleted = 
          (updatedStreaks.lastMorningCheckIn && 
            new Date(updatedStreaks.lastMorningCheckIn).toDateString() === new Date(todayString).toDateString()) &&
          (updatedStreaks.lastAfternoonCheckIn && 
            new Date(updatedStreaks.lastAfternoonCheckIn).toDateString() === new Date(todayString).toDateString()) &&
          (updatedStreaks.lastEveningCheckIn && 
            new Date(updatedStreaks.lastEveningCheckIn).toDateString() === new Date(todayString).toDateString());
        
        onStreakUpdated(updatedStreaks, isFirstCheckIn, allPeriodsCompleted);
      } catch (callbackError) {
        console.error('Error in streak update callback:', callbackError);
      }
    }
    
    // Show success message for milestone streaks
    if ([3, 7, 14, 30, 60, 90].includes(newStreakValue)) {
      showSuccess(`🔥 ${newStreakValue} day ${period} streak achieved!`);
    }
  } catch (error: any) {
    console.error('Error incrementing streak:', error.message);
  }
}, [user, streaks, onStreakUpdated, showSuccess]);

// New helper function to update profile streak
const updateProfileStreak = async (streakMaintained: boolean) => {
  if (!user) return;
  
  try {
    // Get current profile data
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('streak, last_check_in')
      .eq('user_id', user.id)
      .single();
      
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile:', profileError);
      return;
    }
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    
    let newOverallStreak = 1;
    
    if (profileData) {
      const lastCheckIn = profileData.last_check_in;
      
      if (shouldResetStreak(lastCheckIn)) {
        // If it's been more than a day since the last check-in, reset streak to 1
        newOverallStreak = 1;
      } else if (shouldIncreaseStreak(lastCheckIn)) {
        // If last check-in was yesterday, increment streak
        newOverallStreak = (profileData.streak || 0) + 1;
      } else {
        // If last check-in was today, maintain current streak
        newOverallStreak = profileData.streak || 1;
      }
    }
    
    // Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        streak: newOverallStreak,
        last_check_in: today
      })
      .eq('user_id', user.id);
      
    if (updateError) {
      console.error('Error updating profile streak:', updateError);
    }
  } catch (error: any) {
    console.error('Error updating profile streak:', error.message);
  }
};
```

### 4. Trigger Achievement and Badge Updates

After updating streaks, trigger achievement and badge checks:

```typescript
// Add to incrementStreak after streak updates
// Check for streak-based achievements
await checkForPossibleAchievements(newOverallStreak);

// Add proper connection to the BadgeContext for awarding badges
const badgesContext = useBadges(); // You'll need to make this available in the component

// Check for streak-based badges
if ([3, 7, 14, 30, 60, 90].includes(newOverallStreak)) {
  const badgeName = `${newOverallStreak}-Day Streak`;
  await badgesContext.addUserBadge(badgeName);
}
```

### 5. UI Updates

1. Update the StreakSummary component to use the correct streak values:

```typescript
// src/components/home/StreakSummary.tsx
// Use the profile streak as the source of truth for overall streak
const { streaks } = useCheckInStreak();
const { userProfile } = useProfile();
  
// Use the profile streak as the source of truth for overall streak
const overallStreak = userProfile?.streak || calculateOverallStreak(streaks);
```

2. Add loading states and error handling.

## Testing Plan

1. Test streak increment:
   - Complete a check-in today and verify streak is 1
   - Complete a check-in tomorrow and verify streak increases to 2
   - Skip a day and verify streak resets to 1

2. Test period streaks:
   - Complete morning check-in for consecutive days and verify morning_streak increases
   - Skip a day for afternoon check-in and verify afternoon_streak resets

3. Test overall streak:
   - Complete at least one check-in per day and verify profile.streak increases
   - Skip a full day and verify profile.streak resets

4. Test achievement triggers:
   - Reach a 3-day streak and verify relevant achievement is awarded
   - Reach a 7-day streak and verify relevant achievement is awarded

5. Test badge triggers:
   - Verify streak-related badges are awarded at appropriate milestones

## Timeline

- Implementation: 2 days
- Testing: 1 day
- Verification and Fixes: 1 day

Total: 4 days 