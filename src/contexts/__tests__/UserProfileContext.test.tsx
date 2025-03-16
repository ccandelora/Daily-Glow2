import React, { ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { UserProfileProvider, useProfile } from '../UserProfileContext';
import { Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useAppState } from '@/contexts/AppStateContext';

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
const mockTableNotExistResponse = { 
  data: null, 
  error: { message: 'relation "profiles" does not exist' } 
};
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
  
  it('handles case when profiles table does not exist', async () => {
    // Mock the table check to return a "table does not exist" error
    const mockFrom = supabase.from;
    const mockSelect = mockFrom().select;
    const mockLimit = mockSelect().limit;
    const mockSingle = mockLimit().single;
    
    mockSingle.mockResolvedValueOnce(mockTableNotExistResponse);
    
    const { result } = renderHook(() => useProfile(), { wrapper });

    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    // Verify that a temporary profile was created
    expect(result.current.userProfile).not.toBeNull();
    expect(result.current.userProfile?.id).toBe('temp-id');
    expect(result.current.userProfile?.user_id).toBe('test-user-id');
    
    // Verify temp profile was created with expected properties
    expect(result.current.userProfile?.streak).toBe(0);
    expect(result.current.userProfile?.points).toBe(0);
  });
  
  it('handles case when user is not available', async () => {
    // Mock auth context to return null for user
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      session: null,
      isLoading: false,
    });
    
    // Mock app state context
    (useAppState as jest.Mock).mockReturnValue({
      isOnline: true,
      isAppReady: true,
    });

    const { result } = renderHook(() => useProfile(), {
      wrapper: UserProfileProvider,
    });

    // Wait for the component to update
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    // Verify that userProfile is null when no user is available
    expect(result.current.userProfile).toBeNull();
  });

  it('handles non-existent profiles table', async () => {
    // Override the mock to simulate profiles table not existing
    const mockFrom = supabase.from;
    const mockSelect = mockFrom().select;
    const mockLimit = mockSelect().limit;
    const mockSingle = mockLimit().single;
    
    mockSingle.mockResolvedValueOnce(mockTableNotExistResponse);
    
    const { result } = renderHook(() => useProfile(), { wrapper });

    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    // Verify a temporary profile was created
    expect(result.current.userProfile).toBeDefined();
    expect(result.current.userProfile?.user_id).toBe('test-user-id');
    expect(result.current.userProfile?.id).toBe('temp-id');
    
    // Verify no insert was attempted since the table doesn't exist
    expect(supabase.from().insert).not.toHaveBeenCalled();
  });

  it('handles update when profiles table does not exist', async () => {
    // Override the mock to simulate profiles table not existing
    const mockFrom = supabase.from;
    const mockSelect = mockFrom().select;
    const mockLimit = mockSelect().limit;
    const mockSingle = mockLimit().single;
    
    mockSingle.mockResolvedValueOnce(mockTableNotExistResponse);
    
    const { result } = renderHook(() => useProfile(), { wrapper });

    // Wait for loading to complete and confirm temporary profile is created
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.userProfile).toBeDefined();
    });
    
    // Try updating the profile
    const updates = { display_name: 'Local Update Only' };
    
    await act(async () => {
      await result.current.updateProfile(updates);
    });
    
    // Verify no actual update was attempted since the table doesn't exist
    expect(supabase.from().update).not.toHaveBeenCalled();
    
    // But the local state should be updated
    expect(result.current.userProfile?.display_name).toBe('Local Update Only');
  });

  it('handles duplicate key error during profile creation', async () => {
    // Mock responses for the test scenario
    const duplicateKeyError = { 
      data: null, 
      error: { code: '23505', message: 'duplicate key value violates unique constraint' }
    };
    
    // First query returns no profile
    const mockFrom = supabase.from;
    const mockSelect = mockFrom().select;
    const mockEq = mockSelect().eq;
    const mockEqSingle = mockEq().single;
    mockEqSingle.mockResolvedValueOnce(mockEmptyProfileResponse);
    
    // Insert attempt returns duplicate key error
    const mockInsert = mockFrom().insert;
    const mockInsertSelect = mockInsert().select;
    const mockInsertSelectSingle = mockInsertSelect().single;
    mockInsertSelectSingle.mockResolvedValueOnce(duplicateKeyError);
    
    // Second query returns the existing profile
    mockEqSingle.mockResolvedValueOnce(mockProfileResponse);
    
    const { result } = renderHook(() => useProfile(), { wrapper });

    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    // Verify the fallback profile fetch was successful
    expect(result.current.userProfile).toEqual(mockProfileResponse.data);
    
    // Verify the insert was attempted
    expect(supabase.from().insert).toHaveBeenCalled();
    
    // Verify a second select was attempted after the insert failed
    expect(supabase.from().select().eq().single).toHaveBeenCalledTimes(2);
  });

  it('refreshes profile data when refreshProfile is called', async () => {
    const { result } = renderHook(() => useProfile(), { wrapper });

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    // Clear the mock calls
    jest.clearAllMocks();
    
    // Call refreshProfile
    await act(async () => {
      await result.current.refreshProfile();
    });
    
    // Verify the profile was fetched again
    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect(supabase.from().select).toHaveBeenCalledWith('*');
    expect(supabase.from().select().eq).toHaveBeenCalledWith('user_id', 'test-user-id');
  });

  it('does not fetch profile when user is null', async () => {
    // Override the auth hook to return null user
    (useAuth as jest.Mock).mockReturnValueOnce({
      user: null,
      isLoading: false
    });
    
    const { result } = renderHook(() => useProfile(), { wrapper });

    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    // Verify profile is null and no API calls were made
    expect(result.current.userProfile).toBeNull();
    expect(supabase.from().select().eq).not.toHaveBeenCalled();
  });

  it('does not update profile when user is null', async () => {
    // Override the auth hook to return null user
    (useAuth as jest.Mock).mockReturnValueOnce({
      user: null,
      isLoading: false
    });
    
    const { result } = renderHook(() => useProfile(), { wrapper });

    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    // Try to update profile
    await act(async () => {
      await result.current.updateProfile({ display_name: 'Should Not Update' });
    });
    
    // Verify no API calls were made
    expect(supabase.from().update).not.toHaveBeenCalled();
  });

  it('reports errors properly during profile fetch', async () => {
    // Setup mock to return a generic error
    const genericError = { 
      data: null, 
      error: { message: 'Database connection error' } 
    };
    
    const mockFrom = supabase.from;
    const mockSelect = mockFrom().select;
    const mockLimit = mockSelect().limit;
    const mockSingle = mockLimit().single;
    
    // First check for table existence succeeds
    mockSingle.mockResolvedValueOnce(mockTableCountResponse);
    
    // But the profile fetch fails
    const mockEq = mockSelect().eq;
    const mockEqSingle = mockEq().single;
    mockEqSingle.mockResolvedValueOnce(genericError);
    
    const { result } = renderHook(() => useProfile(), { wrapper });

    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    // Verify error was shown
    expect(mockAppState.showError).toHaveBeenCalledWith('Failed to load profile');
    
    // Profile should still be null
    expect(result.current.userProfile).toBeNull();
  });
}); 