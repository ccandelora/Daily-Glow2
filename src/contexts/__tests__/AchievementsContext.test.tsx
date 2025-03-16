import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AchievementsProvider, useAchievements } from '../AchievementsContext';
import { supabase } from '@/lib/supabase';
import { Achievement } from '../UserProfileContext';

// Mock dependencies
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
  },
}));

const mockShowError = jest.fn();
const mockShowSuccess = jest.fn();
jest.mock('../AppStateContext', () => ({
  useAppState: jest.fn().mockReturnValue({
    showError: mockShowError,
    showSuccess: mockShowSuccess,
    setLoading: jest.fn(),
    isLoading: false,
  }),
}));

const mockUser = { id: 'test-user-id' };
jest.mock('../AuthContext', () => ({
  useAuth: jest.fn().mockReturnValue({
    user: mockUser,
    session: { user: { id: 'test-user-id' } },
  }),
}));

// Create a real implementation of the context for testing
const mockAchievements: Achievement[] = [
  {
    id: 'streak3',
    name: '3-Day Streak',
    description: 'Complete check-ins for 3 consecutive days',
    icon_name: 'trophy-outline',
    points: 50,
    requires_streak: 3,
    created_at: new Date().toISOString()
  },
  {
    id: 'streak7',
    name: '7-Day Streak',
    description: 'Complete check-ins for 7 consecutive days',
    icon_name: 'ribbon-outline',
    points: 100,
    requires_streak: 7,
    created_at: new Date().toISOString()
  },
  {
    id: 'firstCheckIn',
    name: 'First Check-in',
    description: 'Complete your first daily check-in',
    icon_name: 'checkmark-circle-outline',
    points: 25,
    requires_streak: null,
    created_at: new Date().toISOString()
  },
];

// Create a wrapper for the AchievementsProvider
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AchievementsProvider>{children}</AchievementsProvider>
);

describe('AchievementsContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock console methods to prevent noise in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Setup supabase mock behavior
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ 
        data: { streak: 5 }, 
        error: null 
      }),
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('provides achievements context with initial values', async () => {
    const { result } = renderHook(() => useAchievements(), { wrapper });
    
    // Initial loading state
    expect(result.current.achievements).toEqual([]);
    expect(result.current.userAchievements).toEqual([]);
    
    // Wait for data loading
    await waitFor(() => {
      expect(Array.isArray(result.current.achievements)).toBe(true);
    });
    
    // Now check the loaded data
    expect(Array.isArray(result.current.achievements)).toBe(true);
    expect(Array.isArray(result.current.userAchievements)).toBe(true);
    expect(typeof result.current.checkForPossibleAchievements).toBe('function');
    expect(typeof result.current.addUserAchievement).toBe('function');
    expect(typeof result.current.getAchievementById).toBe('function');
    expect(typeof result.current.refreshAchievements).toBe('function');
  });
  
  it('fetches achievements and user achievements on mount', async () => {
    const { result } = renderHook(() => useAchievements(), { wrapper });
    
    // Wait for data loading
    await waitFor(() => {
      expect(result.current.achievements.length).toBeGreaterThan(0);
    });
    
    // Verify that fetchAchievements and fetchUserAchievements were called
    expect(result.current.achievements.length).toBeGreaterThan(0);
    expect(supabase.from).toHaveBeenCalled();
  });
  
  it('gets an achievement by ID', async () => {
    const { result } = renderHook(() => useAchievements(), { wrapper });
    
    // Wait for data loading
    await waitFor(() => {
      expect(result.current.achievements.length).toBeGreaterThan(0);
    });
    
    // Mock the achievements array
    result.current.achievements = mockAchievements;
    
    // Get achievement by ID
    const achievement = result.current.getAchievementById('streak3');
    
    // Verify result
    expect(achievement).toBeDefined();
    expect(achievement?.id).toBe('streak3');
    expect(achievement?.name).toBe('3-Day Streak');
    
    // Test with non-existent ID
    const nonExistentAchievement = result.current.getAchievementById('non-existent');
    expect(nonExistentAchievement).toBeUndefined();
  });
  
  it('adds a user achievement', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
    });
    
    const { result } = renderHook(() => useAchievements(), { wrapper });
    
    // Wait for data loading
    await waitFor(() => {
      expect(result.current.achievements.length).toBeGreaterThan(0);
    });
    
    // Mock the achievements array
    result.current.achievements = mockAchievements;
    
    // Add a user achievement
    await act(async () => {
      await result.current.addUserAchievement('streak3');
    });
    
    // Verify supabase insert was called
    expect(supabase.from).toHaveBeenCalledWith('user_achievements');
    
    // Verify success message was shown
    expect(mockShowSuccess).toHaveBeenCalled();
  });
  
  it('does not add a duplicate user achievement', async () => {
    const { result } = renderHook(() => useAchievements(), { wrapper });
    
    // Wait for data loading
    await waitFor(() => {
      expect(result.current.achievements.length).toBeGreaterThan(0);
    });
    
    // Mock user achievements to include firstCheckIn
    result.current.achievements = mockAchievements;
    result.current.userAchievements = [{
      id: 'ua-firstCheckIn',
      user_id: 'test-user-id',
      achievement_id: 'firstCheckIn',
      created_at: new Date().toISOString(),
      achievement: mockAchievements[2]
    }];
    
    // Try to add a duplicate achievement
    await act(async () => {
      await result.current.addUserAchievement('firstCheckIn');
    });
    
    // Verify supabase insert was not called
    expect(supabase.from).not.toHaveBeenCalledWith('user_achievements');
  });
  
  it('checks for possible achievements based on streak', async () => {
    const { result } = renderHook(() => useAchievements(), { wrapper });
    
    // Wait for data loading
    await waitFor(() => {
      expect(result.current.achievements.length).toBeGreaterThan(0);
    });
    
    // Mock the achievements array
    result.current.achievements = mockAchievements;
    
    // Mock add user achievement method
    const addUserAchievementMock = jest.spyOn(result.current, 'addUserAchievement');
    addUserAchievementMock.mockResolvedValue();
    
    // Check for possible achievements with a streak of 4
    let unlockedAchievements: Achievement[] = [];
    await act(async () => {
      unlockedAchievements = await result.current.checkForPossibleAchievements(4);
    });
    
    // Should unlock the 3-day streak achievement
    expect(unlockedAchievements.length).toBe(1);
    expect(unlockedAchievements[0].id).toBe('streak3');
    expect(addUserAchievementMock).toHaveBeenCalledWith('streak3');
  });
  
  it('checks for multiple possible achievements based on streak', async () => {
    const { result } = renderHook(() => useAchievements(), { wrapper });
    
    // Wait for data loading
    await waitFor(() => {
      expect(result.current.achievements.length).toBeGreaterThan(0);
    });
    
    // Mock the achievements array
    result.current.achievements = mockAchievements;
    
    // Mock add user achievement method
    const addUserAchievementMock = jest.spyOn(result.current, 'addUserAchievement');
    addUserAchievementMock.mockResolvedValue();
    
    // Check for possible achievements with a streak of 8
    let unlockedAchievements: Achievement[] = [];
    await act(async () => {
      unlockedAchievements = await result.current.checkForPossibleAchievements(8);
    });
    
    // Should unlock both streak achievements
    expect(unlockedAchievements.length).toBe(2);
    expect(unlockedAchievements[0].id).toBe('streak3');
    expect(unlockedAchievements[1].id).toBe('streak7');
  });
  
  it('refreshes achievements', async () => {
    const { result } = renderHook(() => useAchievements(), { wrapper });
    
    // Wait for data loading
    await waitFor(() => {
      expect(result.current.achievements.length).toBeGreaterThan(0);
    });
    
    // Mock the fetch methods
    const fetchAchievementsSpy = jest.spyOn(result.current, 'refreshAchievements');
    
    // Call refresh
    await act(async () => {
      await result.current.refreshAchievements();
    });
    
    // Verify refresh was called
    expect(fetchAchievementsSpy).toHaveBeenCalled();
  });
  
  it('handles error when adding user achievement', async () => {
    // Mock supabase to throw an error
    (supabase.from as jest.Mock).mockReturnValue({
      insert: jest.fn().mockResolvedValue({ 
        data: null, 
        error: { message: 'Error adding achievement' } 
      }),
    });
    
    const { result } = renderHook(() => useAchievements(), { wrapper });
    
    // Wait for data loading
    await waitFor(() => {
      expect(result.current.achievements.length).toBeGreaterThan(0);
    });
    
    // Mock the achievements array
    result.current.achievements = mockAchievements;
    
    // Try to add an achievement
    await act(async () => {
      await result.current.addUserAchievement('streak3');
    });
    
    // Verify console.error was called
    expect(console.error).toHaveBeenCalled();
  });
  
  it('handles null user case', async () => {
    // Mock user as null
    jest.spyOn(require('../AuthContext'), 'useAuth').mockReturnValue({
      user: null,
      session: null,
    });
    
    const { result } = renderHook(() => useAchievements(), { wrapper });
    
    // With null user, user achievements should be empty
    expect(result.current.userAchievements).toEqual([]);
    
    // Try to add an achievement with null user
    await act(async () => {
      await result.current.addUserAchievement('streak3');
    });
    
    // Should return early without calling supabase
    expect(supabase.from).not.toHaveBeenCalledWith('user_achievements');
  });
  
  it('handles error when checking for possible achievements', async () => {
    const { result } = renderHook(() => useAchievements(), { wrapper });
    
    // Wait for data loading
    await waitFor(() => {
      expect(result.current.achievements.length).toBeGreaterThan(0);
    });
    
    // Mock the achievements array
    result.current.achievements = mockAchievements;
    
    // Mock add user achievement to throw an error
    const addUserAchievementMock = jest.spyOn(result.current, 'addUserAchievement');
    addUserAchievementMock.mockRejectedValue(new Error('Test error'));
    
    // Check for possible achievements
    let unlockedAchievements: Achievement[] = [];
    await act(async () => {
      unlockedAchievements = await result.current.checkForPossibleAchievements(4);
    });
    
    // Should still return achievements even if adding them failed
    expect(unlockedAchievements.length).toBe(1);
    expect(unlockedAchievements[0].id).toBe('streak3');
  });
}); 