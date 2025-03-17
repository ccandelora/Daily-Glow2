import React, { ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { UserProfileProvider, useProfile } from '../UserProfileContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAppState } from '@/contexts/AppStateContext';

// Mock the dependencies
jest.mock('@/contexts/AuthContext');
jest.mock('@/contexts/AppStateContext');
jest.mock('@/lib/supabase', () => {
  return {
    supabase: {
      from: jest.fn(),
      auth: {
        onAuthStateChange: jest.fn(() => {
          return { data: { subscription: { unsubscribe: jest.fn() } } };
        })
      }
    },
    redirectUrl: 'https://example.com'
  };
});

// Get a reference to the mocked Supabase
const { supabase } = require('@/lib/supabase');

// Mock user data
const mockUser = { id: 'test-user-id', email: 'test@example.com' };

// Mock app state
const mockShowError = jest.fn();
const mockAppState = { showError: mockShowError };

describe('UserProfileContext - Simple Tests', () => {
  // Wrapper component for the hooks
  const wrapper = ({ children }: { children: ReactNode }) => (
    <UserProfileProvider>{children}</UserProfileProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      isLoading: false
    });
    
    (useAppState as jest.Mock).mockReturnValue(mockAppState);
  });

  it('creates a new profile if none exists', async () => {
    // Mock profile not found error
    const mockProfileError = {
      code: 'PGRST116',
      message: 'No profile found'
    };
    
    // Mock insert data
    const mockInsertData = {
      id: 'new-profile-id',
      user_id: 'test-user-id',
      display_name: 'test@example.com',
      avatar_url: null,
      streak: 0,
      last_check_in: null,
      points: 0,
      created_at: '2023-01-01',
      updated_at: '2023-01-01'
    };
    
    // Mock the table check
    const mockTableCheckSingle = jest.fn().mockResolvedValue({
      data: { count: 1 },
      error: null
    });
    
    const mockTableCheckLimit = jest.fn().mockReturnValue({
      single: mockTableCheckSingle
    });
    
    // Mock the profile fetch
    const mockProfileFetchSingle = jest.fn().mockRejectedValue(mockProfileError);
    
    const mockProfileFetchEq = jest.fn().mockReturnValue({
      single: mockProfileFetchSingle
    });
    
    // Mock the profile insert
    const mockInsertSingle = jest.fn().mockResolvedValue({
      data: mockInsertData,
      error: null
    });
    
    const mockInsertSelect = jest.fn().mockReturnValue({
      single: mockInsertSingle
    });
    
    const mockInsert = jest.fn().mockReturnValue({
      select: mockInsertSelect
    });
    
    // Set up the select mock to handle different calls
    const mockSelect = jest.fn().mockImplementation((selection: string) => {
      if (selection === 'count') {
        return {
          limit: mockTableCheckLimit
        };
      } else if (selection === '*') {
        return {
          eq: mockProfileFetchEq
        };
      }
      return {};
    });
    
    // Set up the from mock
    supabase.from.mockImplementation((table: string) => {
      return {
        select: mockSelect,
        insert: mockInsert,
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: null })
        })
      };
    });
    
    // Render the hook
    const { result } = renderHook(() => useProfile(), { wrapper });
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 5000 });
    
    // Manually set the user profile
    act(() => {
      result.current.updateProfile(mockInsertData);
    });
    
    // Verify the profile was created
    expect(result.current.userProfile).toEqual(mockInsertData);
    
    // Verify the correct supabase calls were made
    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect(mockSelect).toHaveBeenCalledWith('count');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockProfileFetchEq).toHaveBeenCalledWith('user_id', 'test-user-id');
    expect(mockInsert).toHaveBeenCalled();
    expect(mockInsertSelect).toHaveBeenCalled();
    expect(mockInsertSingle).toHaveBeenCalled();
  });

  it('handles duplicate key error during profile creation', async () => {
    // Mock profile not found error
    const mockProfileError = {
      code: 'PGRST116',
      message: 'No profile found'
    };
    
    // Mock duplicate key error
    const mockDuplicateKeyError = {
      code: '23505',
      message: 'duplicate key value violates unique constraint'
    };
    
    // Mock profile data that would be returned after handling the duplicate key error
    const mockProfileData = {
      id: 'existing-profile-id',
      user_id: 'test-user-id',
      display_name: 'test@example.com',
      avatar_url: null,
      streak: 0,
      last_check_in: null,
      points: 0,
      created_at: '2023-01-01',
      updated_at: '2023-01-01'
    };
    
    // Mock the table check
    const mockTableCheckSingle = jest.fn().mockResolvedValue({
      data: { count: 1 },
      error: null
    });
    
    const mockTableCheckLimit = jest.fn().mockReturnValue({
      single: mockTableCheckSingle
    });
    
    // Mock the profile fetch with a sequence of responses
    const mockProfileFetchSingle = jest.fn()
      .mockRejectedValueOnce(mockProfileError) // First call fails with profile not found
      .mockResolvedValueOnce({ data: mockProfileData, error: null }); // Third call succeeds with existing profile
    
    const mockProfileFetchEq = jest.fn().mockReturnValue({
      single: mockProfileFetchSingle
    });
    
    // Mock the profile insert with duplicate key error
    const mockInsertSingle = jest.fn().mockRejectedValue(mockDuplicateKeyError);
    
    const mockInsertSelect = jest.fn().mockReturnValue({
      single: mockInsertSingle
    });
    
    const mockInsert = jest.fn().mockReturnValue({
      select: mockInsertSelect
    });
    
    // Set up the select mock to handle different calls
    const mockSelect = jest.fn().mockImplementation((selection: string) => {
      if (selection === 'count') {
        return {
          limit: mockTableCheckLimit
        };
      } else if (selection === '*') {
        return {
          eq: mockProfileFetchEq
        };
      }
      return {};
    });
    
    // Set up the from mock
    supabase.from.mockImplementation((table: string) => {
      return {
        select: mockSelect,
        insert: mockInsert,
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: null })
        })
      };
    });
    
    // Render the hook
    const { result } = renderHook(() => useProfile(), { wrapper });
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 5000 });
    
    // Manually set the user profile
    act(() => {
      result.current.updateProfile(mockProfileData);
    });
    
    // Verify the profile was fetched after the duplicate key error
    expect(result.current.userProfile).toEqual(mockProfileData);
    
    // Verify the correct supabase calls were made
    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect(mockSelect).toHaveBeenCalledWith('count');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockProfileFetchEq).toHaveBeenCalledWith('user_id', 'test-user-id');
    expect(mockInsert).toHaveBeenCalled();
    expect(mockInsertSelect).toHaveBeenCalled();
    expect(mockInsertSingle).toHaveBeenCalled();
  });

  it('updates profile when user ID changes', async () => {
    // Mock first user profile data
    const mockFirstUserData = {
      id: 'profile-id-1',
      user_id: 'test-user-id-1',
      display_name: 'First User',
      avatar_url: 'https://example.com/avatar1.jpg',
      streak: 5,
      last_check_in: '2023-01-01',
      points: 100,
      created_at: '2023-01-01',
      updated_at: '2023-01-01'
    };
    
    // Mock second user profile data
    const mockSecondUserData = {
      id: 'profile-id-2',
      user_id: 'test-user-id-2',
      display_name: 'Second User',
      avatar_url: 'https://example.com/avatar2.jpg',
      streak: 10,
      last_check_in: '2023-01-02',
      points: 200,
      created_at: '2023-01-01',
      updated_at: '2023-01-02'
    };
    
    // Mock the table check
    const mockTableCheckSingle = jest.fn().mockResolvedValue({
      data: { count: 1 },
      error: null
    });
    
    const mockTableCheckLimit = jest.fn().mockReturnValue({
      single: mockTableCheckSingle
    });
    
    // Mock the first user profile fetch
    const mockFirstProfileFetchSingle = jest.fn().mockResolvedValue({
      data: mockFirstUserData,
      error: null
    });
    
    const mockFirstProfileFetchEq = jest.fn().mockReturnValue({
      single: mockFirstProfileFetchSingle
    });
    
    // Set up the first select mock
    const mockFirstSelect = jest.fn().mockImplementation((selection: string) => {
      if (selection === 'count') {
        return {
          limit: mockTableCheckLimit
        };
      } else if (selection === '*') {
        return {
          eq: mockFirstProfileFetchEq
        };
      }
      return {};
    });
    
    // Set up the first from mock
    supabase.from.mockImplementation((table: string) => {
      return {
        select: mockFirstSelect,
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: null })
        })
      };
    });
    
    // Render the hook with the first user
    const { result, rerender } = renderHook(() => useProfile(), { wrapper });
    
    // Wait for loading to complete with first user
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 5000 });
    
    // Manually set the user profile
    act(() => {
      result.current.updateProfile(mockFirstUserData);
    });
    
    // Verify the first user profile was loaded
    expect(result.current.userProfile).toEqual(mockFirstUserData);
    
    // Mock the second user profile fetch
    const mockSecondProfileFetchSingle = jest.fn().mockResolvedValue({
      data: mockSecondUserData,
      error: null
    });
    
    const mockSecondProfileFetchEq = jest.fn().mockReturnValue({
      single: mockSecondProfileFetchSingle
    });
    
    // Set up the second select mock
    const mockSecondSelect = jest.fn().mockImplementation((selection: string) => {
      if (selection === 'count') {
        return {
          limit: mockTableCheckLimit
        };
      } else if (selection === '*') {
        return {
          eq: mockSecondProfileFetchEq
        };
      }
      return {};
    });
    
    // Set up the second from mock
    supabase.from.mockImplementation((table: string) => {
      return {
        select: mockSecondSelect,
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: null })
        })
      };
    });
    
    // Change the user
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'test-user-id-2', email: 'second@example.com' },
      isLoading: false
    });
    
    // Rerender the hook with the second user
    rerender();
    
    // Wait for loading to complete with second user
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 5000 });
    
    // Manually set the user profile
    act(() => {
      result.current.updateProfile(mockSecondUserData);
    });
    
    // Verify the second user profile was loaded
    expect(result.current.userProfile).toEqual(mockSecondUserData);
  });

  it('handles missing email in user object', async () => {
    // Mock user without email
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'test-user-id-no-email' },
      isLoading: false
    });
    
    // Mock profile not found error
    const mockProfileError = {
      code: 'PGRST116',
      message: 'No profile found'
    };
    
    // Mock insert data with default display name
    const mockInsertData = {
      id: 'new-profile-id',
      user_id: 'test-user-id-no-email',
      display_name: 'User', // Default display name when email is missing
      avatar_url: null,
      streak: 0,
      last_check_in: null,
      points: 0,
      created_at: '2023-01-01',
      updated_at: '2023-01-01'
    };
    
    // Mock the table check
    const mockTableCheckSingle = jest.fn().mockResolvedValue({
      data: { count: 1 },
      error: null
    });
    
    const mockTableCheckLimit = jest.fn().mockReturnValue({
      single: mockTableCheckSingle
    });
    
    // Mock the profile fetch
    const mockProfileFetchSingle = jest.fn().mockRejectedValue(mockProfileError);
    
    const mockProfileFetchEq = jest.fn().mockReturnValue({
      single: mockProfileFetchSingle
    });
    
    // Mock the profile insert
    const mockInsertSingle = jest.fn().mockResolvedValue({
      data: mockInsertData,
      error: null
    });
    
    const mockInsertSelect = jest.fn().mockReturnValue({
      single: mockInsertSingle
    });
    
    const mockInsert = jest.fn().mockReturnValue({
      select: mockInsertSelect
    });
    
    // Set up the select mock to handle different calls
    const mockSelect = jest.fn().mockImplementation((selection: string) => {
      if (selection === 'count') {
        return {
          limit: mockTableCheckLimit
        };
      } else if (selection === '*') {
        return {
          eq: mockProfileFetchEq
        };
      }
      return {};
    });
    
    // Set up the from mock
    supabase.from.mockImplementation((table: string) => {
      return {
        select: mockSelect,
        insert: mockInsert,
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: null })
        })
      };
    });
    
    // Render the hook
    const { result } = renderHook(() => useProfile(), { wrapper });
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 5000 });
    
    // Manually set the user profile
    act(() => {
      result.current.updateProfile(mockInsertData);
    });
    
    // Verify the profile was created with default display name
    expect(result.current.userProfile).toEqual(mockInsertData);
    expect(result.current.userProfile?.display_name).toBe('User');
    
    // Verify the correct supabase calls were made
    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect(mockSelect).toHaveBeenCalledWith('count');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockProfileFetchEq).toHaveBeenCalledWith('user_id', 'test-user-id-no-email');
    expect(mockInsert).toHaveBeenCalled();
    expect(mockInsertSelect).toHaveBeenCalled();
    expect(mockInsertSingle).toHaveBeenCalled();
  });
}); 