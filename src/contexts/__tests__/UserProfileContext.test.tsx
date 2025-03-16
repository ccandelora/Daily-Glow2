import React, { ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { UserProfileProvider, useProfile } from '../UserProfileContext';
import { Alert } from 'react-native';

// Mock values
const mockUser = { id: 'test-user-id', email: 'test@example.com' };
const mockAppState = {
  appState: 'active',
  isLoading: false,
  setLoading: jest.fn(),
  showError: jest.fn(),
  showSuccess: jest.fn(),
};

// Mock the Auth context
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: mockUser,
    isLoading: false,
  })),
}));

// Mock the AppState context
jest.mock('@/contexts/AppStateContext', () => ({
  useAppState: jest.fn(() => mockAppState),
}));

// Create a proper mockup of Supabase
const mockTableCountResponse = { data: { count: 1 }, error: null };
const mockProfileResponse = {
  data: {
    id: 'profile-id',
    user_id: 'test-user-id',
    display_name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg',
    streak: 5,
    last_check_in: '2023-01-01',
    points: 100,
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
  },
  error: null,
};
const mockEmptyProfileResponse = { data: null, error: { code: 'PGRST116', message: 'No profile found' } };
const mockUpdateResponse = { data: null, error: null };
const mockInsertResponse = {
  data: {
    id: 'new-profile-id',
    user_id: 'test-user-id',
    display_name: 'test@example.com',
    avatar_url: null,
    streak: 0,
    last_check_in: null,
    points: 0,
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
  },
  error: null,
};
const mockUpdateErrorResponse = { data: null, error: { message: 'Update failed' } };

// Mock the Supabase client
jest.mock('@/lib/supabase', () => {
  // Create a mock Supabase client with chainable methods
  const mockSupabase = {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          single: jest.fn()
        }),
        eq: jest.fn().mockReturnValue({
          single: jest.fn()
        })
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn()
      }),
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn()
        })
      })
    })
  };
  
  return {
    supabase: mockSupabase
  };
});

// Get a reference to the mocked Supabase
const { supabase } = require('@/lib/supabase');

describe('UserProfileContext', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <UserProfileProvider>{children}</UserProfileProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mock implementations
    const mockFrom = supabase.from;
    const mockSelect = mockFrom().select;
    const mockLimit = mockSelect().limit;
    const mockSingle = mockLimit().single;
    const mockEq = mockSelect().eq;
    const mockEqSingle = mockEq().single;
    const mockUpdate = mockFrom().update;
    const mockUpdateEq = mockUpdate().eq;
    const mockInsert = mockFrom().insert;
    const mockInsertSelect = mockInsert().select;
    const mockInsertSelectSingle = mockInsertSelect().single;
    
    // Reset all mocks to their default state
    mockFrom.mockReturnValue({
      select: mockSelect,
      update: mockUpdate,
      insert: mockInsert
    });
    
    mockSelect.mockReturnValue({
      limit: mockLimit,
      eq: mockEq
    });
    
    mockLimit.mockReturnValue({
      single: mockSingle
    });
    
    mockEq.mockReturnValue({
      single: mockEqSingle
    });
    
    mockUpdate.mockReturnValue({
      eq: mockUpdateEq
    });
    
    mockInsert.mockReturnValue({
      select: mockInsertSelect
    });
    
    mockInsertSelect.mockReturnValue({
      single: mockInsertSelectSingle
    });
    
    // Set default responses for each mock
    mockSingle.mockResolvedValue(mockTableCountResponse);
    mockEqSingle.mockResolvedValue(mockProfileResponse);
    mockUpdateEq.mockResolvedValue(mockUpdateResponse);
    mockInsertSelectSingle.mockResolvedValue(mockInsertResponse);
  });

  it('provides the user profile context with initial values', async () => {
    const { result } = renderHook(() => useProfile(), { wrapper });

    // Check initial state
    expect(result.current).toBeDefined();
    expect(result.current.userProfile).toBeNull(); // Initially null
    expect(result.current.isLoading).toBe(true); // Initially loading
    expect(typeof result.current.updateProfile).toBe('function');
    expect(typeof result.current.refreshProfile).toBe('function');
  });

  it('loads user profile when auth user is available', async () => {
    const { result } = renderHook(() => useProfile(), { wrapper });

    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    // Verify the profile was loaded
    expect(result.current.userProfile).toEqual(mockProfileResponse.data);
    
    // Verify the correct supabase calls were made
    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect(supabase.from().select).toHaveBeenCalledWith('count');
    expect(supabase.from().select).toHaveBeenCalledWith('*');
    expect(supabase.from().select().eq).toHaveBeenCalledWith('user_id', 'test-user-id');
  });

  it('creates a new profile if none exists', async () => {
    // Override the mock to return no profile first
    const mockFrom = supabase.from;
    const mockSelect = mockFrom().select;
    const mockEq = mockSelect().eq;
    const mockEqSingle = mockEq().single;
    
    mockEqSingle.mockResolvedValueOnce(mockEmptyProfileResponse);
    
    const { result } = renderHook(() => useProfile(), { wrapper });

    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    // Verify a new profile was created
    expect(result.current.userProfile).toEqual(mockInsertResponse.data);
    
    // Verify insert was called
    expect(supabase.from().insert).toHaveBeenCalled();
  });

  it('updates user profile successfully', async () => {
    const { result } = renderHook(() => useProfile(), { wrapper });

    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    // Update the profile
    const updates = { display_name: 'Updated Name' };
    await act(async () => {
      await result.current.updateProfile(updates);
    });
    
    // Verify update was called with correct parameters
    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect(supabase.from().update).toHaveBeenCalledWith(updates);
    expect(supabase.from().update().eq).toHaveBeenCalledWith('user_id', 'test-user-id');
  });

  it('handles errors when updating profile', async () => {
    // Override the update mock to return an error
    const mockFrom = supabase.from;
    const mockUpdate = mockFrom().update;
    const mockUpdateEq = mockUpdate().eq;
    
    mockUpdateEq.mockResolvedValueOnce(mockUpdateErrorResponse);
    
    const { result } = renderHook(() => useProfile(), { wrapper });

    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    // Try to update the profile, expect error
    const updates = { display_name: 'Updated Name' };
    
    // We need to use try/catch because we're expecting a Promise rejection
    let errorThrown = false;
    try {
      await act(async () => {
        await result.current.updateProfile(updates);
      });
    } catch (error) {
      errorThrown = true;
    }
    
    // Verify an error was thrown
    expect(errorThrown).toBe(true);
    
    // Verify error was shown - need to use direct call check
    expect(mockAppState.showError).toHaveBeenCalled();
    expect(mockAppState.showError.mock.calls.some(call => 
      call[0] === 'Failed to update profile'
    )).toBe(true);
  });

  it('refreshes user profile data', async () => {
    const { result } = renderHook(() => useProfile(), { wrapper });

    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    // Clear previous calls to track new ones
    jest.clearAllMocks();
    
    // Refresh the profile
    await act(async () => {
      await result.current.refreshProfile();
    });
    
    // Verify the profile was fetched again
    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect(supabase.from().select).toHaveBeenCalledWith('count');
    expect(supabase.from().select).toHaveBeenCalledWith('*');
  });
}); 