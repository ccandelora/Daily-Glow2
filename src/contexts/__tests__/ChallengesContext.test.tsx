import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { ChallengesProvider, useChallenges } from '../ChallengesContext';

// Define types for our mocks
interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'mood' | 'gratitude' | 'mindfulness' | 'creative';
  points: number;
  active?: boolean;
}

interface UserStats {
  current_streak?: number;
  longest_streak?: number;
  total_points: number;
  total_entries?: number;
  last_check_in?: string | null;
  level: number;
  user_id?: string;
}

// Mock the AppStateContext
const mockSetLoading = jest.fn();
const mockShowError = jest.fn();
const mockShowSuccess = jest.fn();

// Mock the required hooks to avoid using the actual providers
jest.mock('../AppStateContext', () => ({
  useAppState: () => ({
    setLoading: mockSetLoading,
    showError: mockShowError,
    showSuccess: mockShowSuccess
  })
}));

// Mock the AuthContext
jest.mock('../AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
    session: { user: { id: 'test-user-id' } }
  })
}));

// Sample mock data
const mockUserStats: UserStats = {
  user_id: 'test-user-id',
  total_points: 100,
  level: 2,
  current_streak: 5,
  longest_streak: 10,
  total_entries: 20,
  last_check_in: '2023-06-01T12:00:00Z'
};

const mockDailyChallenge: Challenge = {
  id: 'challenge-1',
  title: 'Daily Gratitude',
  description: 'Write three things you are grateful for',
  type: 'gratitude',
  points: 50
};

const mockAchievements = [
  {
    id: 'ach-1',
    type: 'streak',
    name: '3-Day Streak',
    description: 'Completed check-ins for 3 days in a row',
    points: 50,
    achieved_at: '2023-05-01T12:00:00Z',
    metadata: { streak_days: 3 }
  }
];

const mockUserChallenges = [
  {
    id: 'uc-1',
    challenge_id: 'challenge-2',
    status: 'completed',
    completed_at: '2023-05-20T12:00:00Z',
    created_at: '2023-05-20T10:00:00Z'
  }
];

const mockAvailableChallenges = [
  {
    id: 'challenge-1',
    title: 'Daily Gratitude',
    description: 'Write three things you are grateful for',
    type: 'gratitude',
    points: 50,
    active: true
  },
  {
    id: 'challenge-2',
    title: 'Meditation',
    description: 'Meditate for 5 minutes',
    type: 'mindfulness',
    points: 100,
    active: true
  }
];

// Mock Supabase with better control over responses
jest.mock('@/lib/supabase', () => {
  // Setup default mock implementations
  const mockFrom = jest.fn();
  const mockRpc = jest.fn();
  
  // Return a configurable mock
  return {
    supabase: {
      from: mockFrom,
      rpc: mockRpc
    },
    // Expose these for test configuration
    __mocks: {
      mockFrom,
      mockRpc,
      // Helper to setup typical responses
      setupMockResponses: (options: {
        statsResponse?: any,
        achievementsResponse?: any,
        challengesResponse?: any,
        dailyChallengeResponse?: any,
        userChallengesResponse?: any,
        completeResponse?: any
      } = {}) => {
        const {
          statsResponse = { data: mockUserStats, error: null },
          achievementsResponse = { data: mockAchievements, error: null },
          challengesResponse = { data: mockAvailableChallenges, error: null },
          dailyChallengeResponse = { data: [mockDailyChallenge], error: null },
          userChallengesResponse = { data: mockUserChallenges, error: null },
          completeResponse = { 
            data: { success: true, total_points: 150, level: 3 }, 
            error: null 
          }
        } = options;
        
        // Reset mocks
        mockFrom.mockReset();
        mockRpc.mockReset();
        
        // Setup from responses
        mockFrom.mockImplementation((table: string) => {
          if (table === 'user_stats') {
            return {
              select: jest.fn().mockReturnThis(),
              insert: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue(statsResponse)
              })
            };
          }
          if (table === 'user_achievements') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              order: jest.fn().mockResolvedValue(achievementsResponse)
            };
          }
          if (table === 'challenges') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              order: jest.fn().mockResolvedValue(challengesResponse)
            };
          }
          if (table === 'user_challenges') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              order: jest.fn().mockResolvedValue(userChallengesResponse)
            };
          }
          return {
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({ data: [], error: null })
          };
        });
        
        // Setup RPC responses
        mockRpc.mockImplementation((funcName: string, params: Record<string, any>) => {
          if (funcName === 'get_daily_challenge') {
            return Promise.resolve(dailyChallengeResponse);
          }
          if (funcName === 'complete_challenge') {
            return Promise.resolve(completeResponse);
          }
          return Promise.resolve({ data: null, error: null });
        });
      }
    }
  };
});

// Simple wrapper for ChallengesProvider
const wrapper: React.FC<{children: React.ReactNode}> = ({ children }) => (
  <ChallengesProvider>
    {children}
  </ChallengesProvider>
);

describe('ChallengesContext', () => {
  // Add jest.useFakeTimers() to control setTimeout/setInterval
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockShowError.mockClear();
    mockSetLoading.mockClear();
    
    // Setup default mock responses
    const { __mocks } = require('@/lib/supabase');
    __mocks.setupMockResponses();
  });

  // Add afterEach to clean up any pending timers
  afterEach(() => {
    jest.clearAllTimers();
  });

  it('provides the expected context structure', async () => {
    const { result, unmount } = renderHook(() => useChallenges(), { wrapper });
    
    // Check that the context provides all expected properties
    expect(result.current).toHaveProperty('dailyChallenge');
    expect(result.current).toHaveProperty('userChallenges');
    expect(result.current).toHaveProperty('achievements');
    expect(result.current).toHaveProperty('userStats');
    expect(result.current).toHaveProperty('refreshDailyChallenge');
    expect(result.current).toHaveProperty('completeChallenge');
    expect(result.current).toHaveProperty('getAvailableChallenges');
    
    unmount();
  });

  it('initializes with default values', async () => {
    const { result, unmount } = renderHook(() => useChallenges(), { wrapper });
    
    expect(result.current.dailyChallenge).toBeNull();
    expect(result.current.userChallenges).toEqual([]);
    expect(result.current.achievements).toEqual([]);
    expect(result.current.userStats).toBeNull();
    
    unmount();
  });

  it('loads the daily challenge during initialization', async () => {
    const { result, unmount } = renderHook(() => useChallenges(), { wrapper });
    
    // Wait for useEffect to run and fetch data
    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    
    // Verify that loading state was set during initialization
    expect(mockSetLoading).toHaveBeenCalledWith(true);
    
    // Verify that the user data was loaded
    expect(result.current.dailyChallenge).toEqual(mockDailyChallenge);
    expect(result.current.achievements).toEqual(mockAchievements);
    expect(result.current.userChallenges).toEqual(mockUserChallenges);
    expect(result.current.userStats).toEqual(mockUserStats);
    
    unmount();
  });

  it('refreshes the daily challenge when requested', async () => {
    // Setup a new daily challenge to be returned on refresh
    const newDailyChallenge = {
      id: 'challenge-2',
      title: 'Mindfulness Meditation',
      description: 'Practice mindfulness for 5 minutes',
      type: 'mindfulness',
      points: 30
    };
    
    const { __mocks } = require('@/lib/supabase');
    __mocks.setupMockResponses({
      dailyChallengeResponse: { data: [newDailyChallenge], error: null }
    });

    const { result, unmount } = renderHook(() => useChallenges(), { wrapper });
    
    // Wait for initial loading
    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    
    // Clear mocks to check new calls
    mockSetLoading.mockClear();
    const { mockRpc } = __mocks;
    mockRpc.mockClear();
    
    // Call refreshDailyChallenge
    await act(async () => {
      await result.current.refreshDailyChallenge();
    });
    
    // Verify RPC was called with the right function and params
    expect(mockRpc).toHaveBeenCalledWith('get_daily_challenge', {
      p_user_id: 'test-user-id'
    });
    
    // Verify state was updated
    expect(result.current.dailyChallenge).toEqual(newDailyChallenge);
    
    unmount();
  });

  it('completes a challenge successfully', async () => {
    const { __mocks } = require('@/lib/supabase');
    const { mockRpc } = __mocks;
    
    // Setup expected response
    __mocks.setupMockResponses({
      completeResponse: {
        data: {
          success: true,
          total_points: 150, // Initial 100 + 50 points
          level: 3
        },
        error: null
      }
    });

    const { result, unmount } = renderHook(() => useChallenges(), { wrapper });

    // Wait for initial loading
    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    
    // Clear mocks for clean testing
    mockRpc.mockClear();
    
    // Complete the challenge
    await act(async () => {
      await result.current.completeChallenge('challenge-1', 'Test response');
    });

    // Verify RPC was called with the right parameters
    expect(mockRpc).toHaveBeenCalledWith('complete_challenge', {
      p_user_id: 'test-user-id',
      p_challenge_id: 'challenge-1',
      p_response: 'Test response'
    });

    // Verify that the userStats were updated correctly
    expect(result.current.userStats).toBeDefined();
    expect(result.current.userStats?.total_points).toBe(150);
    expect(result.current.userStats?.level).toBe(3);
    
    // Verify that userChallenges was updated
    expect(result.current.userChallenges.length).toBe(2); // Original 1 + new 1
    expect(result.current.userChallenges[0].challenge_id).toBe('challenge-1');
    expect(result.current.userChallenges[0].status).toBe('completed');
    
    unmount();
  });

  it('fetches available challenges', async () => {
    const { __mocks } = require('@/lib/supabase');
    const { mockFrom } = __mocks;
    
    const { result, unmount } = renderHook(() => useChallenges(), { wrapper });

    // Wait for initial loading
    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    
    // Clear mocks for clean testing
    mockFrom.mockClear();
    
    // Fetch available challenges
    let availableChallenges: Challenge[] = [];
    await act(async () => {
      availableChallenges = await result.current.getAvailableChallenges();
    });

    // Verify from was called with the right table
    expect(mockFrom).toHaveBeenCalledWith('challenges');
    
    // Verify the returned challenges
    expect(availableChallenges).toEqual(mockAvailableChallenges);
    
    unmount();
  });

  it('handles errors when fetching the daily challenge', async () => {
    const mockError = { message: 'Failed to fetch daily challenge' };
    
    // Setup error response
    const { __mocks } = require('@/lib/supabase');
    __mocks.setupMockResponses({
      dailyChallengeResponse: { data: null, error: mockError }
    });

    const { result, unmount } = renderHook(() => useChallenges(), { wrapper });

    // Wait for initial loading
    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    
    // Clear error mock
    mockShowError.mockClear();
    
    // Try to refresh the daily challenge
    await act(async () => {
      await result.current.refreshDailyChallenge();
    });

    // Verify the error was shown to the user
    expect(mockShowError).toHaveBeenCalledWith(mockError.message);
    
    // Verify the daily challenge is still null
    expect(result.current.dailyChallenge).toBeNull();
    
    unmount();
  });

  it('handles errors when completing a challenge', async () => {
    const mockError = { message: 'Failed to complete challenge' };
    
    // Setup error response
    const { __mocks } = require('@/lib/supabase');
    __mocks.setupMockResponses({
      completeResponse: { data: null, error: mockError }
    });

    const { result, unmount } = renderHook(() => useChallenges(), { wrapper });

    // Wait for initial loading
    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    // Try to complete the challenge
    await act(async () => {
      try {
        await result.current.completeChallenge('challenge-1', 'Test response');
        fail('Expected completeChallenge to throw an error');
      } catch (error: any) {
        // This is expected, so check the error
        expect(error.message).toBe(mockError.message);
      }
    });
    
    // No changes to userStats should have occurred
    expect(result.current.userStats?.total_points).toBe(100);
    expect(result.current.userStats?.level).toBe(2);
    
    unmount();
  });

  it('handles errors when fetching available challenges', async () => {
    const mockError = { message: 'Failed to fetch challenges' };
    
    // Setup error response
    const { __mocks } = require('@/lib/supabase');
    __mocks.setupMockResponses({
      challengesResponse: { data: null, error: mockError }
    });

    const { result, unmount } = renderHook(() => useChallenges(), { wrapper });

    // Wait for initial loading
    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    
    // Clear error mock
    mockShowError.mockClear();
    
    // Try to get available challenges
    let challenges: Challenge[] = [];
    await act(async () => {
      challenges = await result.current.getAvailableChallenges();
    });

    // Should return empty array on error
    expect(challenges).toEqual([]);
    
    // Should show error to user
    expect(mockShowError).toHaveBeenCalledWith(mockError.message);
    
    unmount();
  });

  it('creates initial user stats if none exist', async () => {
    // Setup response to indicate no stats exist yet
    const { __mocks } = require('@/lib/supabase');
    __mocks.setupMockResponses({
      statsResponse: { 
        data: null, 
        error: { code: 'PGRST116', message: 'No stats found' }
      }
    });
    
    // Mock for insert operation
    const mockFrom = __mocks.mockFrom;
    mockFrom.mockImplementation((table: string) => {
      if (table === 'user_stats') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ 
              data: null, 
              error: { code: 'PGRST116', message: 'No stats found' }
            })
          }),
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  user_id: 'test-user-id',
                  total_points: 0,
                  level: 1
                },
                error: null
              })
            })
          })
        };
      }
      // Default implementation for other tables
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null })
      };
    });

    const { result, unmount } = renderHook(() => useChallenges(), { wrapper });

    // Wait for initial loading
    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    
    // Verify that new user stats were created
    expect(result.current.userStats).toEqual({
      user_id: 'test-user-id',
      total_points: 0,
      level: 1
    });
    
    unmount();
  });

  it('handles duplicate key error when creating user stats', async () => {
    // Setup responses for the scenario where another process already created the stats
    const { __mocks } = require('@/lib/supabase');
    
    // First return no stats, then an error on insert, then stats on retry
    const mockFrom = __mocks.mockFrom;
    mockFrom.mockImplementation((table: string) => {
      if (table === 'user_stats') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnValue({
            single: jest.fn()
              // Initial check - no stats
              .mockResolvedValueOnce({ 
                data: null, 
                error: { code: 'PGRST116', message: 'No stats found' }
              })
              // Retry after error - stats now exist
              .mockResolvedValueOnce({
                data: {
                  user_id: 'test-user-id',
                  total_points: 5,
                  level: 1
                },
                error: null
              })
          }),
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: '23505', message: 'Duplicate key violation' }
              })
            })
          })
        };
      }
      // Default implementation for other tables
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null })
      };
    });

    const { result, unmount } = renderHook(() => useChallenges(), { wrapper });

    // Wait for initial loading and retry logic
    await act(async () => {
      jest.advanceTimersByTime(200);
    });
    
    // Should recover by fetching the existing stats
    expect(result.current.userStats).toEqual({
      user_id: 'test-user-id',
      total_points: 5,
      level: 1
    });
    
    // Check that error was handled gracefully (no error shown to user)
    expect(mockShowError).not.toHaveBeenCalled();
    
    unmount();
  });
}); 