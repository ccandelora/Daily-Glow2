# Achievement, Badge, and Streak Issues in Daily Glow

## Issue Summary

The app is currently using mock achievements and badges that don't update correctly. The log message "Using mock achievements: 5" confirms this - the app is using hardcoded data instead of properly updating achievements, badges, and streaks from the database.

## Key Problems Identified

1. **Mock Achievements**: The `AchievementsContext` is using hardcoded mock achievements instead of fetching real data from the database.
   - In `src/contexts/AchievementsContext.tsx`, the code creates mock achievements instead of fetching from a real table.
   - The `fetchUserAchievements` function creates mock user achievements based on user streak, not actual earned achievements.

2. **Streak Calculation Issues**: The streak calculation in `src/utils/streakCalculator.ts` has some logic that may not accurately reflect the user's actual streaks:
   - The `calculateOverallStreak` function uses the maximum of individual period streaks without properly verifying consecutive days.
   - The streak calculation doesn't properly handle missing check-ins.

3. **Badge Update Mechanism**: Badges aren't being properly awarded when achievements or streaks are updated:
   - The `BadgeContext` contains functionality to award badges but the connection between achievements, streaks and badges seems broken.

4. **Data Refresh Issues**: Components aren't consistently refreshing when new achievements, badges, or streaks are earned:
   - The home screen components like `RecentBadges` and `StreakSummary` call refresh functions but the data may not be properly updated.

## Action Plan

### 1. Fix Achievement System

- [ ] Create a proper achievements table in the database if it doesn't exist
- [ ] Update `AchievementsContext` to fetch real achievements from the database
- [ ] Fix `checkForPossibleAchievements` to properly detect and award achievements
- [ ] Add proper notification for newly earned achievements

### 2. Fix Badge System

- [ ] Verify database tables for badges are correctly set up
- [ ] Update `BadgeContext` to handle proper badge awards based on achievements and streaks
- [ ] Create connection points between achievements and badges
- [ ] Fix the `addUserBadge` function to properly award badges

### 3. Fix Streak Calculation

- [ ] Review and fix `calculateOverallStreak` function to accurately reflect consecutive days
- [ ] Ensure streaks are properly updated when check-ins are completed
- [ ] Fix streak reset logic when a day is missed

### 4. Improve Data Refresh Mechanism

- [ ] Add proper state management for achievements, badges, and streaks
- [ ] Update components to respond to state changes
- [ ] Add proper loading states during data fetching
- [ ] Implement real-time updates when achievements, badges, or streaks change

### 5. Add Notifications and Feedback

- [ ] Implement proper notifications when new achievements or badges are earned
- [ ] Add visual feedback on the home screen for new achievements
- [ ] Create animations or highlights for newly earned badges

## Progress Tracking

| Task | Status | Notes |
|------|--------|-------|
| Implement proper achievements database | Not Started | |
| Fix mock achievements code | Not Started | |
| Correct streak calculation | Not Started | |
| Fix badge award system | Not Started | |
| Implement real-time updates | Not Started | |
| Add proper notifications | Not Started | | 