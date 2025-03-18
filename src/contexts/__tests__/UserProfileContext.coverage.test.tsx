import React, { ReactNode } from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { UserProfileProvider, useProfile } from '../UserProfileContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAppState } from '@/contexts/AppStateContext';

// Mock dependencies
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/contexts/AppStateContext', () => ({
  useAppState: jest.fn(),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

// Mock console methods to prevent logs during tests
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

// Mock app state
const mockShowError = jest.fn();
const mockAppState = { showError: mockShowError };

// Mock data
const mockProfileData = {
  id: 'existing-profile-id',
  user_id: 'test-user-id',
  display_name: 'test@example.com',
  avatar_url: null,
  streak: 0,
  points: 0,
  last_check_in: null,
  created_at: '2023-01-01',
  updated_at: '2023-01-01',
};

const mockInsertData = {
  id: 'new-profile-id',
  user_id: 'test-user-id',
  display_name: 'test@example.com',
  avatar_url: null,
  streak: 0,
  points: 0,
  last_check_in: null,
  created_at: '2023-01-01',
  updated_at: '2023-01-01',
};

// Wrapper component for tests
const wrapper = ({ children }: { children: ReactNode }) => (
  <UserProfileProvider>{children}</UserProfileProvider>
);

describe('UserProfileContext specific branch coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'test-user-id', email: 'test@example.com' },
      isLoading: false
    });
    
    (useAppState as jest.Mock).mockReturnValue({
      showError: mockShowError,
      isLoading: false,
      setLoading: jest.fn()
    });
    
    // Reset supabase mocks
    const mockFrom = jest.fn();
    const mockSelect = jest.fn();
    const mockEq = jest.fn();
    const mockSingle = jest.fn();
    const mockInsert = jest.fn();
    const mockUpdate = jest.fn();
    const mockLimit = jest.fn();
    
    mockFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate
    });
    
    mockSelect.mockReturnValue({
      eq: mockEq,
      limit: mockLimit
    });
    
    mockEq.mockReturnValue({
      single: mockSingle
    });
    
    mockLimit.mockReturnValue({
      single: mockSingle
    });
    
    require('@/lib/supabase').supabase.from = mockFrom;
  });

  test('throws error when used outside provider', () => {
    expect(() => {
      renderHook(() => useProfile());
    }).toThrow('useProfile must be used within a UserProfileProvider');
  });

  test('handles error when profile not found (PGRST116) and creates new profile', async () => {
    // Mock the table check to succeed
    const mockTableCheckSingle = jest.fn().mockResolvedValue({
      data: { count: 1 },
      error: null
    });
    
    const mockTableCheckLimit = jest.fn().mockReturnValue({ single: mockTableCheckSingle });
    const mockTableCheckSelect = jest.fn().mockReturnValue({ limit: mockTableCheckLimit });
    
    // Mock the profile fetch to return PGRST116 error
    const mockProfileSingle = jest.fn().mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'No profile found' }
    });
    
    const mockProfileEq = jest.fn().mockReturnValue({ single: mockProfileSingle });
    const mockProfileSelect = jest.fn().mockReturnValue({ eq: mockProfileEq });
    
    // Mock the insert to succeed
    const mockInsertSingle = jest.fn().mockResolvedValue({
      data: mockInsertData,
      error: null
    });
    
    const mockInsertSelect = jest.fn().mockReturnValue({ single: mockInsertSingle });
    const mockInsert = jest.fn().mockReturnValue({ select: mockInsertSelect });
    
    // Set up the from mock to return different mocks based on the call count
    let callCount = 0;
    const mockFrom = jest.fn().mockImplementation((table) => {
      callCount++;
      
      if (callCount === 1) {
        // First call - table check
        return {
          select: mockTableCheckSelect
        };
      } else if (callCount === 2) {
        // Second call - initial profile check
        return {
          select: mockProfileSelect
        };
      } else {
        // Third call - insert profile
        return {
          insert: mockInsert
        };
      }
    });
    
    require('@/lib/supabase').supabase.from = mockFrom;
    
    const { result } = renderHook(() => useProfile(), { wrapper });
    
    // Wait for loading to finish
    await act(async () => {
      // Artificially wait to let async operations complete
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    // Verify that the profile creation flow was triggered
    expect(mockInsert).toHaveBeenCalled();
    expect(mockShowError).not.toHaveBeenCalled();
    expect(result.current.userProfile).toEqual(mockInsertData);
  });

  test('handles duplicate key error (23505) during profile creation', async () => {
    // Mock the profile fetch to return PGRST116 error
    const mockSingle = jest.fn().mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'No profile found' }
    });
    
    const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    
    // Mock the insert to fail with duplicate key error
    const mockInsertSingle = jest.fn().mockResolvedValue({
      data: null,
      error: { code: '23505', message: 'duplicate key value' }
    });
    
    const mockInsertSelect = jest.fn().mockReturnValue({ single: mockInsertSingle });
    const mockInsert = jest.fn().mockReturnValue({ select: mockInsertSelect });
    
    // Mock the second fetch after duplicate key error
    const mockSecondSingle = jest.fn().mockResolvedValue({
      data: mockProfileData,
      error: null
    });
    
    const mockSecondEq = jest.fn().mockReturnValue({ single: mockSecondSingle });
    const mockSecondSelect = jest.fn().mockReturnValue({ eq: mockSecondEq });
    
    // Mock the table check to succeed
    const mockTableCheckSingle = jest.fn().mockResolvedValue({
      data: { count: 1 },
      error: null
    });
    
    const mockTableCheckLimit = jest.fn().mockReturnValue({ single: mockTableCheckSingle });
    const mockTableCheckSelect = jest.fn().mockReturnValue({ limit: mockTableCheckLimit });
    
    // Set up the from mock to return different mocks based on the call count
    let callCount = 0;
    const mockFrom = jest.fn().mockImplementation((table) => {
      callCount++;
      
      if (callCount === 1) {
        // First call - table check
        return {
          select: mockTableCheckSelect
        };
      } else if (callCount === 2) {
        // Second call - initial profile check
        return {
          select: mockSelect
        };
      } else if (callCount === 3) {
        // Third call - insert profile
        return {
          insert: mockInsert
        };
      } else {
        // Fourth call - fetch after duplicate key
        return {
          select: mockSecondSelect
        };
      }
    });
    
    require('@/lib/supabase').supabase.from = mockFrom;
    
    const { result } = renderHook(() => useProfile(), { wrapper });
    
    // Wait for loading to finish
    await act(async () => {
      // Artificially wait to let async operations complete
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    // Verify error was not shown to the user since we recovered by fetching the existing profile
    expect(mockShowError).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith('Profile already exists, fetching it instead');
    expect(result.current.userProfile).toEqual(mockProfileData);
  });

  test('handles the case when user ID is null', async () => {
    // Set up the mock to return no user ID
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      isLoading: false
    });
    
    const { result } = renderHook(() => useProfile(), { wrapper });
    
    // Wait for loading to finish
    await act(async () => {
      // Artificially wait to let async operations complete
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    // Verify that profile is null when user is null
    expect(result.current.userProfile).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  test('handles non-existent profiles table (lines 78-91)', async () => {
    // Mock the table check to fail with "relation does not exist" error
    const mockTableCheckSingle = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'relation "profiles" does not exist' }
    });
    
    const mockTableCheckLimit = jest.fn().mockReturnValue({ single: mockTableCheckSingle });
    const mockTableCheckSelect = jest.fn().mockReturnValue({ limit: mockTableCheckLimit });
    
    // Set up the from mock
    const mockFrom = jest.fn().mockImplementation((table) => {
      return {
        select: mockTableCheckSelect
      };
    });
    
    require('@/lib/supabase').supabase.from = mockFrom;
    
    const { result } = renderHook(() => useProfile(), { wrapper });
    
    // Wait for loading to finish
    await act(async () => {
      // Artificially wait to let async operations complete
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    // Verify that a temporary profile was created
    expect(result.current.userProfile).not.toBeNull();
    expect(result.current.userProfile?.user_id).toBe('test-user-id');
    expect(console.log).toHaveBeenCalledWith('Using temporary profile until database is updated');
  });

  test('handles fetch error after duplicate key error (lines 134-143)', async () => {
    // Mock the profile fetch to return PGRST116 error
    const mockSingle = jest.fn().mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'No profile found' }
    });
    
    const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    
    // Mock the insert to fail with duplicate key error
    const mockInsertSingle = jest.fn().mockResolvedValue({
      data: null,
      error: { code: '23505', message: 'duplicate key value' }
    });
    
    const mockInsertSelect = jest.fn().mockReturnValue({ single: mockInsertSingle });
    const mockInsert = jest.fn().mockReturnValue({ select: mockInsertSelect });
    
    // Mock the second fetch after duplicate key error to fail
    const mockSecondSingle = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Fetch after duplicate key failed' }
    });
    
    const mockSecondEq = jest.fn().mockReturnValue({ single: mockSecondSingle });
    const mockSecondSelect = jest.fn().mockReturnValue({ eq: mockSecondEq });
    
    // Mock the table check to succeed
    const mockTableCheckSingle = jest.fn().mockResolvedValue({
      data: { count: 1 },
      error: null
    });
    
    const mockTableCheckLimit = jest.fn().mockReturnValue({ single: mockTableCheckSingle });
    const mockTableCheckSelect = jest.fn().mockReturnValue({ limit: mockTableCheckLimit });
    
    // Set up the from mock to return different mocks based on the call count
    let callCount = 0;
    const mockFrom = jest.fn().mockImplementation((table) => {
      callCount++;
      
      if (callCount === 1) {
        // First call - table check
        return {
          select: mockTableCheckSelect
        };
      } else if (callCount === 2) {
        // Second call - initial profile check
        return {
          select: mockSelect
        };
      } else if (callCount === 3) {
        // Third call - insert profile
        return {
          insert: mockInsert
        };
      } else {
        // Fourth call - fetch after duplicate key
        return {
          select: mockSecondSelect
        };
      }
    });
    
    require('@/lib/supabase').supabase.from = mockFrom;
    
    const { result } = renderHook(() => useProfile(), { wrapper });
    
    // Wait for loading to finish
    await act(async () => {
      // Artificially wait to let async operations complete
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    // Verify error was shown to the user
    expect(mockShowError).toHaveBeenCalledWith('Failed to load profile');
    expect(console.error).toHaveBeenCalledWith('Error fetching profile:', 'Fetch after duplicate key failed');
  });

  test('handles non-duplicate key error during profile creation (line 140)', async () => {
    // Mock the profile fetch to return PGRST116 error
    const mockSingle = jest.fn().mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'No profile found' }
    });
    
    const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    
    // Mock the insert to fail with a non-duplicate key error
    const mockInsertSingle = jest.fn().mockResolvedValue({
      data: null,
      error: { code: 'OTHER_ERROR', message: 'Some other error' }
    });
    
    const mockInsertSelect = jest.fn().mockReturnValue({ single: mockInsertSingle });
    const mockInsert = jest.fn().mockReturnValue({ select: mockInsertSelect });
    
    // Mock the table check to succeed
    const mockTableCheckSingle = jest.fn().mockResolvedValue({
      data: { count: 1 },
      error: null
    });
    
    const mockTableCheckLimit = jest.fn().mockReturnValue({ single: mockTableCheckSingle });
    const mockTableCheckSelect = jest.fn().mockReturnValue({ limit: mockTableCheckLimit });
    
    // Set up the from mock to return different mocks based on the call count
    let callCount = 0;
    const mockFrom = jest.fn().mockImplementation((table) => {
      callCount++;
      
      if (callCount === 1) {
        // First call - table check
        return {
          select: mockTableCheckSelect
        };
      } else if (callCount === 2) {
        // Second call - initial profile check
        return {
          select: mockSelect
        };
      } else {
        // Third call - insert profile
        return {
          insert: mockInsert
        };
      }
    });
    
    require('@/lib/supabase').supabase.from = mockFrom;
    
    const { result } = renderHook(() => useProfile(), { wrapper });
    
    // Wait for loading to finish
    await act(async () => {
      // Artificially wait to let async operations complete
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    // Verify error was shown to the user
    expect(mockShowError).toHaveBeenCalledWith('Failed to load profile');
    expect(console.error).toHaveBeenCalledWith('Error fetching profile:', 'Some other error');
  });

  test('handles updating profile with non-existent profiles table (lines 154-190)', async () => {
    // Mock the table check to fail with "relation does not exist" error
    const mockTableCheckSingle = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'relation "profiles" does not exist' }
    });
    
    const mockTableCheckLimit = jest.fn().mockReturnValue({ single: mockTableCheckSingle });
    const mockTableCheckSelect = jest.fn().mockReturnValue({ limit: mockTableCheckLimit });
    
    // Set up the from mock
    const mockFrom = jest.fn().mockImplementation((table) => {
      return {
        select: mockTableCheckSelect
      };
    });
    
    require('@/lib/supabase').supabase.from = mockFrom;
    
    // Create a temporary profile first
    const { result } = renderHook(() => useProfile(), { wrapper });
    
    // Wait for loading to finish
    await act(async () => {
      // Artificially wait to let async operations complete
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    // Verify that a temporary profile was created
    expect(result.current.userProfile).not.toBeNull();
    
    // Now try to update the profile
    const updates = { display_name: 'Updated Name' };
    
    // Reset console.log mock to verify the update message
    (console.log as jest.Mock).mockClear();
    
    // Update the profile
    await act(async () => {
      await result.current.updateProfile(updates);
    });
    
    // Verify that the local state was updated
    expect(result.current.userProfile?.display_name).toBe('Updated Name');
    expect(console.log).toHaveBeenCalledWith('Cannot update profile: profiles table does not exist yet');
  });

  test('handles updating profile with error (lines 154-190)', async () => {
    // Mock the table check to succeed
    const mockTableCheckSingle = jest.fn().mockResolvedValue({
      data: { count: 1 },
      error: null
    });
    
    const mockTableCheckLimit = jest.fn().mockReturnValue({ single: mockTableCheckSingle });
    const mockTableCheckSelect = jest.fn().mockReturnValue({ limit: mockTableCheckLimit });
    
    // Mock the profile fetch to succeed
    const mockProfileSingle = jest.fn().mockResolvedValue({
      data: mockProfileData,
      error: null
    });
    
    const mockProfileEq = jest.fn().mockReturnValue({ single: mockProfileSingle });
    const mockProfileSelect = jest.fn().mockReturnValue({ eq: mockProfileEq });
    
    // Mock the update to fail
    const mockUpdateEq = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Update failed' }
    });
    
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockUpdateEq });
    
    // Set up the from mock to return different mocks based on the call count
    let callCount = 0;
    const mockFrom = jest.fn().mockImplementation((table) => {
      callCount++;
      
      if (callCount === 1) {
        // First call - table check for initial fetch
        return {
          select: mockTableCheckSelect
        };
      } else if (callCount === 2) {
        // Second call - initial profile fetch
        return {
          select: mockProfileSelect
        };
      } else if (callCount === 3) {
        // Third call - table check for update
        return {
          select: mockTableCheckSelect
        };
      } else {
        // Fourth call - update profile
        return {
          update: mockUpdate
        };
      }
    });
    
    require('@/lib/supabase').supabase.from = mockFrom;
    
    const { result } = renderHook(() => useProfile(), { wrapper });
    
    // Wait for loading to finish
    await act(async () => {
      // Artificially wait to let async operations complete
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    // Verify that the profile was loaded
    expect(result.current.userProfile).toEqual(mockProfileData);
    
    // Now try to update the profile
    const updates = { display_name: 'Updated Name' };
    
    // Reset console.error mock to verify the error message
    (console.error as jest.Mock).mockClear();
    
    // Update the profile and expect it to throw
    await act(async () => {
      try {
        await result.current.updateProfile(updates);
      } catch (error) {
        // Expected error
      }
    });
    
    // Verify that the error was shown
    expect(mockShowError).toHaveBeenCalledWith('Failed to update profile');
    expect(console.error).toHaveBeenCalledWith('Error updating profile:', 'Update failed');
  });

  test('handles refreshing profile (line 195)', async () => {
    // Mock the table check to succeed
    const mockTableCheckSingle = jest.fn().mockResolvedValue({
      data: { count: 1 },
      error: null
    });
    
    const mockTableCheckLimit = jest.fn().mockReturnValue({ single: mockTableCheckSingle });
    const mockTableCheckSelect = jest.fn().mockReturnValue({ limit: mockTableCheckLimit });
    
    // Mock the profile fetch to succeed
    const mockProfileSingle = jest.fn().mockResolvedValue({
      data: mockProfileData,
      error: null
    });
    
    const mockProfileEq = jest.fn().mockReturnValue({ single: mockProfileSingle });
    const mockProfileSelect = jest.fn().mockReturnValue({ eq: mockProfileEq });
    
    // Set up the from mock
    const mockFrom = jest.fn().mockImplementation(() => {
      return {
        select: mockProfileSelect
      };
    });
    
    require('@/lib/supabase').supabase.from = mockFrom;
    
    const { result } = renderHook(() => useProfile(), { wrapper });
    
    // Wait for loading to finish
    await act(async () => {
      // Artificially wait to let async operations complete
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    // Reset the mocks to verify they're called again
    mockFrom.mockClear();
    mockProfileSelect.mockClear();
    
    // Now refresh the profile
    await act(async () => {
      await result.current.refreshProfile();
    });
    
    // Verify that the profile was fetched again
    expect(mockFrom).toHaveBeenCalledWith('profiles');
    expect(mockProfileSelect).toHaveBeenCalled();
  });

  test('handles error when updating profile and rethrows (line 186)', async () => {
    // Mock the table check to succeed
    const mockTableCheckSingle = jest.fn().mockResolvedValue({
      data: { count: 1 },
      error: null
    });
    
    const mockTableCheckLimit = jest.fn().mockReturnValue({ single: mockTableCheckSingle });
    const mockTableCheckSelect = jest.fn().mockReturnValue({ limit: mockTableCheckLimit });
    
    // Mock the profile fetch to succeed
    const mockProfileSingle = jest.fn().mockResolvedValue({
      data: mockProfileData,
      error: null
    });
    
    const mockProfileEq = jest.fn().mockReturnValue({ single: mockProfileSingle });
    const mockProfileSelect = jest.fn().mockReturnValue({ eq: mockProfileEq });
    
    // Mock the update to fail
    const mockUpdateEq = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Update failed' }
    });
    
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockUpdateEq });
    
    // Set up the from mock to return different mocks based on the call count
    let callCount = 0;
    const mockFrom = jest.fn().mockImplementation((table) => {
      callCount++;
      
      if (callCount === 1) {
        // First call - table check for initial fetch
        return {
          select: mockTableCheckSelect
        };
      } else if (callCount === 2) {
        // Second call - initial profile fetch
        return {
          select: mockProfileSelect
        };
      } else if (callCount === 3) {
        // Third call - table check for update
        return {
          select: mockTableCheckSelect
        };
      } else {
        // Fourth call - update profile
        return {
          update: mockUpdate
        };
      }
    });
    
    require('@/lib/supabase').supabase.from = mockFrom;
    
    const { result } = renderHook(() => useProfile(), { wrapper });
    
    // Wait for loading to finish
    await act(async () => {
      // Artificially wait to let async operations complete
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    // Verify that the profile was loaded
    expect(result.current.userProfile).toEqual(mockProfileData);
    
    // Now try to update the profile
    const updates = { display_name: 'Updated Name' };
    
    // Reset console.error mock to verify the error message
    (console.error as jest.Mock).mockClear();
    
    // Update the profile and expect it to throw
    let caughtError = null;
    await act(async () => {
      try {
        await result.current.updateProfile(updates);
      } catch (error) {
        caughtError = error;
      }
    });
    
    // Verify that the error was thrown
    expect(caughtError).not.toBeNull();
    expect(mockShowError).toHaveBeenCalledWith('Failed to update profile');
    expect(console.error).toHaveBeenCalledWith('Error updating profile:', 'Update failed');
  });

  test('handles error when fetching profile (line 140)', async () => {
    // Mock the table check to succeed
    const mockTableCheckSingle = jest.fn().mockResolvedValue({
      data: { count: 1 },
      error: null
    });
    
    const mockTableCheckLimit = jest.fn().mockReturnValue({ single: mockTableCheckSingle });
    const mockTableCheckSelect = jest.fn().mockReturnValue({ limit: mockTableCheckLimit });
    
    // Mock the profile fetch to fail with a generic error
    const mockProfileSingle = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Generic fetch error' }
    });
    
    const mockProfileEq = jest.fn().mockReturnValue({ single: mockProfileSingle });
    const mockProfileSelect = jest.fn().mockReturnValue({ eq: mockProfileEq });
    
    // Set up the from mock to return different mocks based on the call count
    let callCount = 0;
    const mockFrom = jest.fn().mockImplementation((table) => {
      callCount++;
      
      if (callCount === 1) {
        // First call - table check
        return {
          select: mockTableCheckSelect
        };
      } else {
        // Second call - profile fetch
        return {
          select: mockProfileSelect
        };
      }
    });
    
    require('@/lib/supabase').supabase.from = mockFrom;
    
    const { result } = renderHook(() => useProfile(), { wrapper });
    
    // Wait for loading to finish
    await act(async () => {
      // Artificially wait to let async operations complete
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    // Verify error was shown to the user
    expect(mockShowError).toHaveBeenCalledWith('Failed to load profile');
    expect(console.error).toHaveBeenCalledWith('Error fetching profile:', 'Generic fetch error');
  });
}); 