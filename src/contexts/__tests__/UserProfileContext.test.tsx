import React, { ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { UserProfileProvider, useProfile } from '../UserProfileContext';
import { Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useAppState } from '@/contexts/AppStateContext';
import { render } from '@testing-library/react-native';

// Helper function to set up mocks for tests
const setupMocks = (options: {
  user?: any,
  showError?: jest.Mock,
  tableCheck?: { data: any, error: any },
  profileFetch: { data: any, error: any },
  profileInsert?: { data: any, error: any },
  secondProfileFetch?: { data: any, error: any },
  profileFetchAfterError?: { data: any, error: any }
}) => {
  jest.clearAllMocks();
  
  // Mock auth user
  (useAuth as jest.Mock).mockReturnValue({
    user: options.user || { id: 'test-user-id', email: 'test@example.com' },
    isLoading: false
  });
  
  // Mock app state
  (useAppState as jest.Mock).mockReturnValue({
    showError: options.showError || mockAppState.showError
  });
  
  // Set default values
  const { tableCheck = { data: [{ count: 1 }], error: null }, profileFetch, profileInsert = { data: null, error: null } } = options;
  
  // Set up mock functions
  const mockTableCheckEq = jest.fn().mockResolvedValue(tableCheck);
  const mockTableCheckSelect = jest.fn().mockReturnValue({ eq: mockTableCheckEq });
  
  // Profile fetch mock
  const mockProfileFetchSingle = profileFetch.error ? 
    jest.fn().mockRejectedValue(profileFetch.error) : 
    jest.fn().mockResolvedValue(profileFetch);
  const mockProfileFetchEq = jest.fn().mockReturnValue({ single: mockProfileFetchSingle });
  const mockProfileFetchSelect = jest.fn().mockReturnValue({ eq: mockProfileFetchEq });
  
  // Second profile fetch for duplicates
  let mockSecondProfileFetchSingle: jest.Mock | undefined;
  let mockSecondProfileFetchEq: jest.Mock | undefined;
  
  if (options.secondProfileFetch) {
    mockSecondProfileFetchSingle = options.secondProfileFetch.error ?
      jest.fn().mockRejectedValue(options.secondProfileFetch.error) :
      jest.fn().mockResolvedValue(options.secondProfileFetch);
    mockSecondProfileFetchEq = jest.fn().mockReturnValue({ single: mockSecondProfileFetchSingle });
  }
  
  // Profile fetch after error (for duplicate key error handling)
  let mockProfileFetchAfterErrorSingle: jest.Mock | undefined;
  let mockProfileFetchAfterErrorEq: jest.Mock | undefined;
  
  if (options.profileFetchAfterError) {
    mockProfileFetchAfterErrorSingle = options.profileFetchAfterError.error ?
      jest.fn().mockRejectedValue(options.profileFetchAfterError.error) :
      jest.fn().mockResolvedValue(options.profileFetchAfterError);
    mockProfileFetchAfterErrorEq = jest.fn().mockReturnValue({ single: mockProfileFetchAfterErrorSingle });
  }
  
  // Insert mock
  const mockInsertSingle = profileInsert.error ?
    jest.fn().mockRejectedValue(profileInsert.error) :
    jest.fn().mockResolvedValue(profileInsert);
  const mockInsertSelect = jest.fn().mockReturnValue({ single: mockInsertSingle });
  const mockInsert = jest.fn().mockReturnValue({ select: mockInsertSelect });
  
  // Track call count for select with different versions
  let selectCallCount = 0;
  
  // Set up the select mock
  const mockSelect = jest.fn().mockImplementation((selection: string) => {
    if (selection === 'count') {
      return mockTableCheckSelect(selection);
    } else if (selection === '*') {
      selectCallCount++;
      
      // If we have a profile fetch after error and this is the third call (after insert error)
      if (options.profileFetchAfterError && selectCallCount > 2 && mockProfileFetchAfterErrorEq) {
        return {
          eq: mockProfileFetchAfterErrorEq
        };
      }
      
      // If we have a second profile fetch and this is the second call
      if (options.secondProfileFetch && selectCallCount > 1 && mockSecondProfileFetchEq) {
        return {
          eq: mockSecondProfileFetchEq
        };
      }
      
      return {
        eq: mockProfileFetchEq,
        limit: jest.fn().mockReturnValue({
          eq: mockProfileFetchEq
        })
      };
    }
    return {};
  });
  
  // Set up the from mock
  (supabase.from as jest.Mock).mockImplementation((table: string) => {
    if (table === 'profiles') {
      return {
        select: mockSelect,
        insert: mockInsert
      };
    }
    return {};
  });
  
  return {
    mockSelect,
    mockTableCheckSelect,
    mockTableCheckEq,
    mockProfileFetchEq,
    mockProfileFetchSingle,
    mockSecondProfileFetchEq,
    mockSecondProfileFetchSingle,
    mockInsert,
    mockInsertSelect,
    mockInsertSingle
  };
};

// Mock the hooks used by UserProfileContext
jest.mock('../AuthContext', () => ({
  useAuth: jest.fn()
}));

jest.mock('../AppStateContext', () => ({
  useAppState: jest.fn().mockReturnValue({
    showError: mockAppState.showError
  })
}));

// Mock data
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com'
};

const mockProfile = {
  id: 'test-profile-id',
  user_id: 'test-user-id',
  display_name: 'Test User',
  avatar_url: 'https://example.com/avatar.png',
  streak: 0,
  last_check_in: null,
  points: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const mockAppState = {
  showError: jest.fn()
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

// Mock Supabase client
jest.mock('@/lib/supabase', () => {
  const mockSupabase = {
    from: jest.fn().mockImplementation((table) => {
      return {
        select: jest.fn().mockImplementation((selection) => {
          if (selection === 'count') {
            return {
              limit: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: { count: 1 }, error: null })
              })
            };
          }
          return {
            eq: jest.fn().mockImplementation((field, value) => {
              return {
                single: jest.fn().mockResolvedValue({
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
                  error: null
                })
              };
            }),
            limit: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: { count: 1 }, error: null })
            })
          };
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: null })
        }),
        insert: jest.fn().mockImplementation((data) => {
          return {
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 'new-profile-id',
                  user_id: data[0].user_id,
                  display_name: data[0].display_name,
                  avatar_url: data[0].avatar_url,
                  streak: data[0].streak,
                  last_check_in: data[0].last_check_in,
                  points: data[0].points,
                  created_at: '2023-01-01',
                  updated_at: '2023-01-01',
                },
                error: null
              })
            })
          };
        })
      };
    }),
    auth: {
      onAuthStateChange: jest.fn(() => {
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      })
    }
  };
  
  return {
    supabase: mockSupabase,
    redirectUrl: 'https://example.com'
  };
});

// Get a reference to the mocked Supabase
const { supabase } = require('@/lib/supabase');

// Base mock functions for different operations
const mockEq = jest.fn().mockResolvedValue({
  data: mockProfile,
  error: null
});

const mockSingle = jest.fn().mockResolvedValue({
  data: mockProfile,
  error: null
});

const mockLimitFn = jest.fn().mockReturnValue({
  single: mockSingle
});

const mockSelect = jest.fn().mockImplementation((selection) => {
  // Handle different selection cases
  if (selection === 'count') {
    return {
      limit: mockLimitFn
    };
  }
  return {
    eq: mockEq,
    limit: mockLimitFn
  };
});

// Mock for update
const mockUpdateEq = jest.fn().mockResolvedValue({
  data: mockProfile,
  error: null
});

const mockUpdate = jest.fn().mockReturnValue({
  eq: mockUpdateEq
});

// Mock for insert
const mockInsert = jest.fn().mockResolvedValue({
  data: mockProfile,
  error: null
});

// Setup the mock Supabase client with consistent chaining
const mockFrom = jest.fn().mockImplementation((table: string) => {
  return {
    select: mockSelect,
    update: mockUpdate,
    insert: mockInsert
  };
});

// Common mock reset function to ensure clean state between tests
const resetMocks = () => {
  mockEq.mockClear();
  mockSingle.mockClear();
  mockLimitFn.mockClear();
  mockSelect.mockClear();
  mockUpdateEq.mockClear();
  mockUpdate.mockClear();
  mockInsert.mockClear();
  mockFrom.mockClear();
  supabase.auth.onAuthStateChange.mockClear();
};

// Setup for each test
beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
  resetMocks();

  // Set default mock implementation for useAuth
  (useAuth as jest.Mock).mockReturnValue({
    user: mockUser,
    isLoading: false
  });

  // Set default mock implementation for useAppState
  (useAppState as jest.Mock).mockReturnValue({
    showError: mockAppState.showError
  });
});

describe('UserProfileContext', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <UserProfileProvider>{children}</UserProfileProvider>
  );

  beforeEach(() => {
    // Reset all Jest mocks
    jest.clearAllMocks();
    
    // Reset the mock implementations
    (useAuth as jest.Mock).mockImplementation(() => ({
      user: mockUser,
      isLoading: false,
    }));
    
    (useAppState as jest.Mock).mockImplementation(() => mockAppState);
    
    // Setup a more robust mock for Supabase
    // Create mock functions that we can reference later for assertions
    const mockCountSelect = jest.fn().mockReturnValue({
      single: jest.fn().mockResolvedValue(mockTableCountResponse)
    });
    
    const mockProfileSelect = jest.fn().mockReturnValue({
      single: jest.fn().mockResolvedValue(mockProfileResponse)
    });
    
    const mockUpdate = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue(mockUpdateResponse)
    });
    
    const mockInsert = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue(mockInsertResponse)
      })
    });
    
    // Set up the base mock implementation
    supabase.from.mockImplementation(() => ({
      select: mockSelect
    }));
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
    // Create named mock functions for assertions
    const mockSelect = jest.fn();
    const mockCountSelect = jest.fn();
    const mockProfileSelect = jest.fn();
    
    // Set up the select mock to track calls
    mockSelect.mockImplementation((selection) => {
      if (selection === 'count') {
        return {
          limit: mockCountSelect.mockReturnValue({
            single: jest.fn().mockResolvedValue(mockTableCountResponse)
          })
        };
      } else if (selection === '*') {
        return {
          eq: mockProfileSelect.mockReturnValue({
            single: jest.fn().mockResolvedValue(mockProfileResponse)
          })
        };
      }
      return mockSelect;
    });
    
    // Set up the from mock
    supabase.from.mockImplementation(() => ({
      select: mockSelect
    }));
    
    const { result } = renderHook(() => useProfile(), { wrapper });

    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    // Verify the profile was loaded
    expect(result.current.userProfile).toEqual(mockProfileResponse.data);
    
    // Verify the correct supabase calls were made
    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect(mockSelect).toHaveBeenCalledWith('count');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockProfileSelect).toHaveBeenCalledWith('user_id', 'test-user-id');
  });

  it('refreshes user profile data', async () => {
    // Mock the Supabase client for table check
    const mockTableCheckResponse = { data: [{ count: 1 }], error: null };
    const mockTableCheckSingle = jest.fn().mockResolvedValue(mockTableCheckResponse);
    const mockTableCheckLimit = jest.fn().mockReturnValue({ single: mockTableCheckSingle });
    const mockTableCheckSelect = jest.fn().mockReturnValue({ limit: mockTableCheckLimit });
    
    // Mock the Supabase client for profile fetch
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
        updated_at: '2023-01-01'
      },
      error: null
    };
    const mockProfileSingle = jest.fn().mockResolvedValue(mockProfileResponse);
    const mockProfileEq = jest.fn().mockReturnValue({ single: mockProfileSingle });
    const mockProfileSelect = jest.fn().mockReturnValue({ eq: mockProfileEq });
    
    // Create a mock implementation that handles different calls
    const mockFrom = jest.fn().mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: (selection: string) => {
            if (selection === 'count') {
              return mockTableCheckSelect(selection);
            } else if (selection === '*') {
              return mockProfileSelect(selection);
            }
            return {};
          }
        };
      }
      return {};
    });
    
    // Set up the mock
    (supabase.from as jest.Mock).mockImplementation(mockFrom);
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <UserProfileProvider>{children}</UserProfileProvider>
    );
    
    const { result } = renderHook(() => useProfile(), { wrapper });

    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    // Reset the mock counters to track new calls
    mockTableCheckSelect.mockClear();
    mockProfileSelect.mockClear();
    mockProfileEq.mockClear();
    mockProfileSingle.mockClear();
    
    // Refresh the profile
    await act(async () => {
      await result.current.refreshProfile();
    });
    
    // Verify the profile was fetched again
    expect(mockTableCheckSelect).toHaveBeenCalledWith('count');
    expect(mockProfileSelect).toHaveBeenCalledWith('*');
    expect(mockProfileEq).toHaveBeenCalledWith('user_id', 'test-user-id');
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
    
    // Setup mocks for this test
    setupMocks({
      profileFetch: { data: null, error: mockProfileError },
      profileInsert: { data: mockInsertData, error: null }
    });
    
    // Render the hook
    const { result } = renderHook(() => useProfile(), { wrapper });
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    // Verify the profile was created
    expect(result.current.userProfile).toEqual(mockInsertData);
    
    // Verify the correct supabase calls were made
    expect(supabase.from).toHaveBeenCalledWith('profiles');
  });

  it('updates user profile successfully', async () => {
    // Mock the Supabase client for table check
    const mockTableCheckResponse = { data: [{ count: 1 }], error: null };
    const mockTableCheckSingle = jest.fn().mockResolvedValue(mockTableCheckResponse);
    const mockTableCheckLimit = jest.fn().mockReturnValue({ single: mockTableCheckSingle });
    const mockTableCheckSelect = jest.fn().mockReturnValue({ limit: mockTableCheckLimit });
    
    // Mock the profile fetch
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
        updated_at: '2023-01-01'
      },
      error: null
    };
    const mockProfileSingle = jest.fn().mockResolvedValue(mockProfileResponse);
    const mockProfileEq = jest.fn().mockReturnValue({ single: mockProfileSingle });
    const mockProfileSelect = jest.fn().mockReturnValue({ eq: mockProfileEq });
    
    // Mock the update operation
    const mockUpdateResponse = { data: null, error: null };
    const mockUpdateEq = jest.fn().mockResolvedValue(mockUpdateResponse);
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockUpdateEq });
    
    // Create a mock implementation that handles different calls
    const mockFrom = jest.fn().mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: (selection: string) => {
            if (selection === 'count') {
              return mockTableCheckSelect(selection);
            } else if (selection === '*') {
              return mockProfileSelect(selection);
            }
            return {};
          },
          update: mockUpdate
        };
      }
      return {};
    });
    
    // Set up the mock
    (supabase.from as jest.Mock).mockImplementation(mockFrom);
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <UserProfileProvider>{children}</UserProfileProvider>
    );
    
    const { result } = renderHook(() => useProfile(), { wrapper });

    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.userProfile).not.toBeNull();
    });
    
    // Update the profile
    const updates = { display_name: 'Updated Name' };
    await act(async () => {
      await result.current.updateProfile(updates);
    });
    
    // Verify update was called with correct parameters
    expect(mockUpdate).toHaveBeenCalledWith(updates);
    expect(mockUpdateEq).toHaveBeenCalledWith('user_id', 'test-user-id');
    
    // Verify the correct supabase calls were made
    expect(mockFrom).toHaveBeenCalledWith('profiles');
    expect(mockTableCheckSelect).toHaveBeenCalledWith('count');
  });

  it('handles errors when updating profile with proper error handling - fixed', async () => {
    // Mock the Supabase client for table check
    const mockTableCheckResponse = { data: [{ count: 1 }], error: null };
    const mockTableCheckSingle = jest.fn().mockResolvedValue(mockTableCheckResponse);
    const mockTableCheckLimit = jest.fn().mockReturnValue({ single: mockTableCheckSingle });
    const mockTableCheckSelect = jest.fn().mockReturnValue({ limit: mockTableCheckLimit });
    
    // Mock the profile fetch
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
        updated_at: '2023-01-01'
      },
      error: null
    };
    const mockProfileSingle = jest.fn().mockResolvedValue(mockProfileResponse);
    const mockProfileEq = jest.fn().mockReturnValue({ single: mockProfileSingle });
    const mockProfileSelect = jest.fn().mockReturnValue({ eq: mockProfileEq });
    
    // Mock the update operation that fails
    const updateError = new Error('Update failed');
    const mockUpdateEq = jest.fn().mockRejectedValue(updateError);
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockUpdateEq });
    
    // Create a mock implementation that handles different calls
    const mockFrom = jest.fn().mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: (selection: string) => {
            if (selection === 'count') {
              return mockTableCheckSelect(selection);
            } else if (selection === '*') {
              return mockProfileSelect(selection);
            }
            return {};
          },
          update: mockUpdate
        };
      }
      return {};
    });
    
    // Set up the mock
    (supabase.from as jest.Mock).mockImplementation(mockFrom);
    
    // Mock the app state to track error calls
    mockAppState.showError.mockClear();
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <UserProfileProvider>{children}</UserProfileProvider>
    );
    
    const { result } = renderHook(() => useProfile(), { wrapper });
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.userProfile).toEqual(mockProfileResponse.data);
    });
    
    // Try to update the profile - expect it to throw
    let threwError = false;
    try {
      await act(async () => {
        await result.current.updateProfile({ display_name: 'Updated Name' });
      });
    } catch (error) {
      threwError = true;
      // Verify error was shown
      expect(mockAppState.showError).toHaveBeenCalledWith('Failed to update profile');
    }
    
    // Verify that an error was thrown
    expect(threwError).toBe(true);
    
    // Verify update was called with correct parameters
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockUpdateEq).toHaveBeenCalledWith('user_id', 'test-user-id');
  });

  it('handles case when profiles table does not exist', async () => {
    // Override the mock to simulate profiles table not existing
    const mockLimitSingle = jest.fn().mockResolvedValue(mockTableNotExistResponse);
    
    // Create a mockLimit function that returns an object with single
    const mockLimit = jest.fn().mockReturnValue({
      single: mockLimitSingle
    });
    
    // Setup the mock chain for the table check
    const mockInsert = jest.fn();
    supabase.from.mockImplementation(() => ({
      select: jest.fn().mockReturnValue({
        limit: mockLimit
      }),
      insert: mockInsert
    }));
    
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
    expect(mockInsert).not.toHaveBeenCalled();
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
    const mockLimitSingle = jest.fn().mockResolvedValue(mockTableNotExistResponse);
    
    // Create a mockLimit function that returns an object with single
    const mockLimit = jest.fn().mockReturnValue({
      single: mockLimitSingle
    });
    
    // Setup the mock chain for the table check
    const mockInsert = jest.fn();
    supabase.from.mockImplementation(() => ({
      select: jest.fn().mockReturnValue({
        limit: mockLimit
      }),
      insert: mockInsert
    }));
    
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
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('handles update when profiles table does not exist', async () => {
    // Override the mock to simulate profiles table not existing
    const mockLimitSingle = jest.fn().mockResolvedValue(mockTableNotExistResponse);
    
    // Create a mockLimit function that returns an object with single
    const mockLimit = jest.fn().mockReturnValue({
      single: mockLimitSingle
    });
    
    // Setup the mock chain for the table check
    const mockUpdateEq = jest.fn();
    const mockUpdate = jest.fn().mockReturnValue({
      eq: mockUpdateEq
    });
    
    supabase.from.mockImplementation(() => ({
      select: jest.fn().mockReturnValue({
        limit: mockLimit
      }),
      update: mockUpdate
    }));
    
    const { result } = renderHook(() => useProfile(), { wrapper });

    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.userProfile).toBeDefined();
    });
    
    // Try updating the profile
    const updates = { display_name: 'Local Update Only' };
    
    await act(async () => {
      await result.current.updateProfile(updates);
    });
    
    // Verify the local state was updated correctly
    expect(result.current.userProfile?.display_name).toBe('Local Update Only');
    
    // Verify no actual update was attempted since the table doesn't exist
    expect(mockUpdate).not.toHaveBeenCalled();
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
    
    // Setup mocks for this test
    setupMocks({
      profileFetch: { data: null, error: mockProfileError },
      profileInsert: { data: null, error: mockDuplicateKeyError },
      profileFetchAfterError: { data: mockProfileData, error: null }
    });
    
    // Render the hook
    const { result } = renderHook(() => useProfile(), { wrapper });
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    // Verify the profile was fetched after the duplicate key error
    expect(result.current.userProfile).toEqual(mockProfileData);
    
    // Verify the correct supabase calls were made
    expect(supabase.from).toHaveBeenCalledWith('profiles');
  });

  it('handles fetch error after duplicate key error with different error message', async () => {
    // Set up mock to return a profile-not-found error first
    supabase.from.mockImplementationOnce(() => ({
      select: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue(mockTableCountResponse)
        })
      })
    }));
    
    // Set up mock for the first select to return no profile
    supabase.from.mockImplementationOnce(() => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockRejectedValue({ code: 'PGRST116', message: 'No profile found' })
        })
      })
    }));
    
    // Set up a specific error for the insert - with a specific duplicate key error code
    supabase.from.mockImplementationOnce(() => ({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockRejectedValue({ code: '23505', message: 'duplicate key value violates unique constraint' })
        })
      })
    }));
    
    // Set up a specific error for the subsequent fetch - with a specific non-PGRST116 error code
    supabase.from.mockImplementationOnce(() => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockRejectedValue({ code: 'OTHER_ERROR', message: 'Some other error' })
        })
      })
    }));
    
    const { result } = renderHook(() => useProfile(), { wrapper });
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    // Verify error was shown
    expect(mockAppState.showError).toHaveBeenCalledWith('Failed to load profile');
  });
  
  it('updates profile when user ID changes', async () => {
    jest.clearAllMocks();
    
    // Mock data for the test
    const mockTableCheck = {
      data: [{ count: 1 }],
      error: null
    };
    
    const mockFirstUserData = {
      id: 'profile-id',
      user_id: 'test-user-id',
      display_name: 'Test User',
      avatar_url: 'https://example.com/avatar.jpg',
      streak: 5,
      last_check_in: '2023-01-01',
      points: 100,
      created_at: '2023-01-01',
      updated_at: '2023-01-01'
    };
    
    const mockNewUserData = {
      id: 'new-profile-id',
      user_id: 'new-user-id',
      display_name: 'New User',
      avatar_url: 'https://example.com/new-avatar.jpg',
      streak: 10,
      last_check_in: '2023-02-01',
      points: 200,
      created_at: '2023-01-15',
      updated_at: '2023-02-01'
    };
    
    // Set up a variable to track the current user ID
    let currentUserId = 'test-user-id';
    
    // Mock the auth hook to return the initial user
    (useAuth as jest.Mock).mockReturnValue({
      user: { ...mockUser, id: currentUserId },
      isLoading: false
    });
    
    // Mock the Supabase client
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === 'profiles') {
        return {
          select: jest.fn().mockImplementation((selection) => {
            if (selection === 'count') {
              return {
                limit: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue(mockTableCheck)
                })
              };
            } else {
              return {
                eq: jest.fn().mockImplementation((field, value) => {
                  expect(field).toBe('user_id');
                  expect(value).toBe(currentUserId);
                  
                  return {
                    single: jest.fn().mockResolvedValue({
                      data: value === 'test-user-id' ? mockFirstUserData : mockNewUserData,
                      error: null
                    })
                  };
                })
              };
            }
          })
        };
      }
      return {
        select: jest.fn()
      };
    });
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <UserProfileProvider>{children}</UserProfileProvider>
    );
    
    const { result, rerender } = renderHook(() => useProfile(), { wrapper });
    
    // Wait for loading to complete with first user
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.userProfile).toEqual(mockFirstUserData);
    }, { timeout: 5000 });
    
    // Change the user ID
    currentUserId = 'new-user-id';
    (useAuth as jest.Mock).mockReturnValue({
      user: { ...mockUser, id: 'new-user-id' },
      isLoading: false
    });
    
    // Rerender to trigger the useEffect with the new user ID
    rerender();
    
    // Verify the profile was fetched for the new user
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.userProfile).toEqual(mockNewUserData);
    }, { timeout: 5000 });
    
    // Verify the correct supabase calls were made
    expect(supabase.from).toHaveBeenCalledWith('profiles');
  });

  it('handles error when creating new profile', async () => {
    // Mock initial profile fetch to return no profile
    supabase.from.mockImplementationOnce(() => ({
      select: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue(mockTableCountResponse)
        })
      })
    }));
    
    supabase.from.mockImplementationOnce(() => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockRejectedValue({ code: 'PGRST116', message: 'No profile found' })
        })
      })
    }));
    
    // Mock insert to return an error
    supabase.from.mockImplementationOnce(() => ({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockRejectedValue(new Error('Insert failed'))
        })
      })
    }));
    
    const { result } = renderHook(() => useProfile(), { wrapper });
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(mockAppState.showError).toHaveBeenCalledWith('Failed to load profile');
  });

  it('handles missing email in user object', async () => {
    jest.clearAllMocks();
    
    // Mock user with no email
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'test-user-id', email: undefined },
      isLoading: false
    });
    
    // Mock the table check
    const mockTableCheck = {
      data: [{ count: 1 }],
      error: null
    };
    
    // Mock the profile fetch error
    const mockProfileError = {
      code: 'PGRST116',
      message: 'No profile found'
    };
    
    // Mock the new profile data
    const mockNewProfileData = {
      id: 'new-profile-id',
      user_id: 'test-user-id',
      display_name: 'User',
      avatar_url: null,
      streak: 0,
      last_check_in: null,
      points: 0,
      created_at: '2023-01-01',
      updated_at: '2023-01-01'
    };
    
    // Track insert calls
    let insertCallCount = 0;
    
    // Set up the mock implementation
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === 'profiles') {
        return {
          select: jest.fn().mockImplementation((selection) => {
            if (selection === 'count') {
              return {
                limit: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue(mockTableCheck)
                })
              };
            } else {
              return {
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockRejectedValue(mockProfileError)
                })
              };
            }
          }),
          insert: jest.fn().mockImplementation((data) => {
            insertCallCount++;
            expect(data).toEqual({
              user_id: 'test-user-id',
              display_name: 'User',
              avatar_url: null
            });
            return {
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockNewProfileData,
                  error: null
                })
              })
            };
          })
        };
      }
      return {
        select: jest.fn(),
        insert: jest.fn()
      };
    });
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <UserProfileProvider>{children}</UserProfileProvider>
    );
    
    const { result } = renderHook(() => useProfile(), { wrapper });
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.userProfile).not.toBeNull();
    }, { timeout: 5000 });
    
    // Verify the profile was created with expected values
    expect(result.current.userProfile).toEqual(mockNewProfileData);
    
    // Verify the correct supabase calls were made
    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect(insertCallCount).toBe(1);
  });

  it('handles error when creating new profile with a non-duplicate key error', async () => {
    jest.clearAllMocks();
    
    // Mock user with email
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'test-user-id', email: 'test@example.com' },
      isLoading: false
    });
    
    // Mock app state to track error calls
    (useAppState as jest.Mock).mockReturnValue({
      showError: mockAppState.showError
    });
    
    // Mock data for the test
    const mockTableCheckResponse = { 
      data: [{ count: 1 }], 
      error: null 
    };
    
    const mockProfileError = {
      code: 'PGRST116',
      message: 'No profile found'
    };
    
    const mockGenericError = {
      code: 'OTHER_ERROR',
      message: 'Some other error occurred'
    };
    
    // Set up the mock implementation
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: jest.fn().mockImplementation((selection) => {
            if (selection === 'count') {
              return {
                limit: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue(mockTableCheckResponse)
                })
              };
            } else if (selection === '*') {
              return {
                eq: jest.fn().mockImplementation((field, value) => {
                  expect(field).toBe('user_id');
                  expect(value).toBe('test-user-id');
                  return {
                    single: jest.fn().mockRejectedValue(mockProfileError)
                  };
                })
              };
            }
            return {};
          }),
          insert: jest.fn().mockImplementation((data) => {
            expect(data).toEqual([{
              user_id: 'test-user-id',
              display_name: 'test@example.com',
              avatar_url: null,
              streak: 0,
              last_check_in: null,
              points: 0
            }]);
            
            return {
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: mockGenericError
                })
              })
            };
          })
        };
      }
      return {};
    });
    
    const { result } = renderHook(() => useProfile(), { wrapper });
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    // Verify the error was set correctly
    expect(mockAppState.showError).toHaveBeenCalledWith('Failed to load profile');
    
    // Verify the correct supabase calls were made
    expect(supabase.from).toHaveBeenCalledWith('profiles');
  });

  it('throws error when used outside provider', () => {
    // Silence the expected console error
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    // Reset the mock to prevent interference
    jest.clearAllMocks();
    
    // Expect the hook to throw when used outside provider
    expect(() => {
      renderHook(() => useProfile(), {
        wrapper: ({ children }) => <>{children}</>
      });
    }).toThrow('useProfile must be used within a UserProfileProvider');
    
    // Restore console.error
    console.error = originalConsoleError;
  });
}); 