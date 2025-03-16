import React from 'react';

// Mock achievements data
const mockAchievements = [
  {
    id: 'streak3',
    name: '3-Day Streak',
    description: 'Complete check-ins for 3 consecutive days',
    icon_name: 'trophy-outline',
    points: 50,
    requires_streak: 3,
    created_at: '2023-01-01T00:00:00Z'
  },
  {
    id: 'streak7',
    name: '7-Day Streak',
    description: 'Complete check-ins for 7 consecutive days',
    icon_name: 'ribbon-outline',
    points: 100,
    requires_streak: 7,
    created_at: '2023-01-01T00:00:00Z'
  },
  {
    id: 'firstCheckIn',
    name: 'First Check-in',
    description: 'Complete your first daily check-in',
    icon_name: 'checkmark-circle-outline',
    points: 25,
    requires_streak: null,
    created_at: '2023-01-01T00:00:00Z'
  },
];

// Mock user achievements data
const mockUserAchievements = [
  {
    id: 'ua-firstCheckIn',
    user_id: 'test-user-id',
    achievement_id: 'firstCheckIn',
    created_at: '2023-01-01T00:00:00Z',
    achievement: {
      id: 'firstCheckIn',
      name: 'First Check-in',
      description: 'Complete your first daily check-in',
      icon_name: 'checkmark-circle-outline',
      points: 25,
      requires_streak: null,
      created_at: '2023-01-01T00:00:00Z'
    }
  },
];

// Create mock functions
const addUserAchievement = jest.fn().mockImplementation(async (achievementId) => {
  // Check if user already has this achievement
  const exists = mockUserAchievements.some(ua => ua.achievement_id === achievementId);
  if (exists) return;
  
  // Mock supabase call
  const mockSupabase = require('@/lib/supabase').supabase;
  await mockSupabase.from('user_achievements').insert([
    { user_id: 'test-user-id', achievement_id: achievementId }
  ]);
  
  // Show success message
  const { showSuccess } = require('../AppStateContext').useAppState();
  const achievement = mockAchievements.find(a => a.id === achievementId);
  showSuccess(`🏆 Achievement Unlocked: ${achievement?.name || 'New Achievement'}`);
});

const checkForPossibleAchievements = jest.fn().mockImplementation(async (currentStreak = 0) => {
  const unlockedAchievements = [];
  
  // Get all streak-based achievements user doesn't have yet
  const streakAchievements = mockAchievements.filter(achievement => 
    achievement.requires_streak && 
    achievement.requires_streak <= currentStreak &&
    !mockUserAchievements.some(ua => ua.achievement_id === achievement.id)
  );
  
  // Unlock any eligible achievements
  for (const achievement of streakAchievements) {
    await addUserAchievement(achievement.id);
    unlockedAchievements.push(achievement);
  }
  
  return unlockedAchievements;
});

const getAchievementById = jest.fn().mockImplementation((id) => {
  return mockAchievements.find(achievement => achievement.id === id);
});

const refreshAchievements = jest.fn().mockResolvedValue(undefined);

// Create the mock context
export const useAchievements = jest.fn().mockReturnValue({
  achievements: mockAchievements,
  userAchievements: mockUserAchievements,
  addUserAchievement,
  checkForPossibleAchievements,
  getAchievementById,
  refreshAchievements,
});

// Create the mock provider
export const AchievementsProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
}; 