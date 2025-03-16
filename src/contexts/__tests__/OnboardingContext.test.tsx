import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { OnboardingProvider, useOnboarding } from '../OnboardingContext';

// Mock dependencies using the dynamic require approach
jest.mock('@/lib/supabase', () => {
  // Create mock responses that can be customized in each test
  const mockRpcResponse = { data: false, error: null };
  const mockQueryResponse = { data: null, error: null };
  const mockInsertResponse = { data: { id: 'test-profile-id' }, error: null };
  const mockUpdateResponse = { data: null, error: null };
  
  return {
    supabase: {
      rpc: jest.fn(() => mockRpcResponse),
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => mockQueryResponse)
        })),
        insert: jest.fn(() => ({
          single: jest.fn(() => mockInsertResponse)
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => mockUpdateResponse)
        }))
      }))
    }
  };
});

// Mock AuthContext using our shared ContextMocks
jest.mock('@/contexts/AuthContext', () => {
  const { createAuthContextMock } = require('../../__mocks__/ContextMocks');
  
  // Create a default mock that can be modified in each test
  const defaultMock = createAuthContextMock();
  
  return {
    useAuth: jest.fn(() => defaultMock),
    // The test can access this to customize the mock for specific tests
    __mocks: {
      setMockUser: (user: { id: string; email: string } | null) => {
        defaultMock.user = user;
      },
      setMockSession: (session: { access_token: string } | null) => {
        defaultMock.session = session;
      },
      setIsAuthenticated: (value: boolean) => {
        defaultMock.isAuthenticated = value;
      }
    }
  };
});

// Mock AppStateContext using our shared ContextMocks
jest.mock('@/contexts/AppStateContext', () => {
  const { createAppStateMock } = require('../../__mocks__/ContextMocks');
  
  // Create a default mock with all required functions
  const mockAppState = createAppStateMock();
  
  return {
    useAppState: jest.fn(() => mockAppState),
    // Expose the mock for test customization
    __setLoading: mockAppState.setLoading,
    __showError: mockAppState.showError
  };
});

// Mock storage
const mockAsyncStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Create a wrapper for the OnboardingProvider
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <OnboardingProvider>{children}</OnboardingProvider>
);

describe('OnboardingContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset AsyncStorage mocks
    mockAsyncStorage.getItem.mockReset();
    mockAsyncStorage.setItem.mockReset();
    mockAsyncStorage.removeItem.mockReset();
    
    // Reset auth mocks to default values
    const { __mocks } = require('@/contexts/AuthContext');
    __mocks.setMockUser({ id: 'test-user-id', email: 'test@example.com' });
    __mocks.setMockSession({ access_token: 'test-token' });
    __mocks.setIsAuthenticated(true);
    
    // Reset AppState mocks
    const { __setLoading, __showError } = require('@/contexts/AppStateContext');
    __setLoading.mockClear();
    __showError.mockClear();
    
    // Reset supabase mocks
    const { supabase } = require('@/lib/supabase');
    supabase.rpc.mockImplementation(() => ({
      data: false,
      error: null
    }));
    
    supabase.from().select().eq.mockImplementation(() => ({
      data: null,
      error: null
    }));
    
    supabase.from().insert().single.mockImplementation(() => ({
      data: { id: 'test-profile-id' },
      error: null
    }));
    
    supabase.from().update().eq.mockImplementation(() => ({
      data: { has_completed_onboarding: true },
      error: null
    }));
    
    // Mock console methods to prevent noise in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('provides the onboarding context with initial values', async () => {
    const { result } = renderHook(() => useOnboarding(), { wrapper });

    // Check initial state
    expect(result.current).toBeDefined();
    expect(result.current.hasCompletedOnboarding).toBeDefined();
    expect(result.current.loading).toBe(true);
    expect(typeof result.current.completeOnboarding).toBe('function');
    
    // Wait for the component to initialize
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('initializes with default onboarding status', async () => {
    const { result } = renderHook(() => useOnboarding(), { wrapper });

    // Wait for the component to initialize
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Check default state
    expect(result.current.hasCompletedOnboarding).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it('checks onboarding status for existing user', async () => {
    // Setup Supabase to return a completed status
    const { supabase } = require('@/lib/supabase');
    supabase.rpc.mockImplementation(() => ({
      data: true,
      error: null
    }));
    
    const { result } = renderHook(() => useOnboarding(), { wrapper });
    
    // Wait for the component to initialize
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Check that RPC was called with the user ID
    expect(supabase.rpc).toHaveBeenCalledWith(expect.any(String), { 
      user_id_param: 'test-user-id' 
    });
    
    // The initialization should have set hasCompletedOnboarding to the RPC result
    expect(result.current.hasCompletedOnboarding).toBe(true);
  });
  
  it('falls back to direct query when RPC fails', async () => {
    // Setup Supabase RPC to return an error
    const { supabase } = require('@/lib/supabase');
    supabase.rpc.mockImplementation(() => ({
      data: null,
      error: { message: 'RPC error' }
    }));
    
    // Setup Supabase direct query to return a value
    supabase.from().select().eq.mockImplementation(() => ({
      data: { has_completed_onboarding: true },
      error: null
    }));
    
    const { result } = renderHook(() => useOnboarding(), { wrapper });
    
    // Wait for the component to initialize
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Check that both RPC and direct query were called
    expect(supabase.rpc).toHaveBeenCalled();
    expect(supabase.from).toHaveBeenCalled();
    
    // The initialization should have set hasCompletedOnboarding to the query result
    expect(result.current.hasCompletedOnboarding).toBe(true);
  });
  
  it('creates a user profile if none exists', async () => {
    // Setup Supabase RPC to return an error
    const { supabase } = require('@/lib/supabase');
    supabase.rpc.mockImplementation(() => ({
      data: null,
      error: { message: 'RPC error' }
    }));
    
    // Setup Supabase direct query to return no data
    supabase.from().select().eq.mockImplementation(() => ({
      data: null,
      error: { code: 'PGRST116', message: 'No rows found' }
    }));
    
    // Setup insert to succeed
    supabase.from().insert().single.mockImplementation(() => ({
      data: { has_completed_onboarding: false },
      error: null
    }));
    
    const { result } = renderHook(() => useOnboarding(), { wrapper });
    
    // Wait for the component to initialize
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Check that insert was called to create a profile
    expect(supabase.from).toHaveBeenCalled();
    expect(result.current.hasCompletedOnboarding).toBe(false);
  });
  
  it('completes onboarding successfully', async () => {
    const { supabase } = require('@/lib/supabase');
    const { __setLoading } = require('@/contexts/AppStateContext');
    
    // Setup mock responses
    supabase.from().update().eq.mockImplementation(() => ({
      data: { has_completed_onboarding: true },
      error: null
    }));
    
    // Render the hook
    const { result } = renderHook(() => useOnboarding(), { wrapper });
    
    // Wait for initialization
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Complete onboarding
    await act(async () => {
      await result.current.completeOnboarding();
    });
    
    // Verify that setLoading was called correctly
    expect(__setLoading).toHaveBeenCalledWith(true);
    expect(__setLoading).toHaveBeenCalledWith(false);
    
    // Verify that the profile was updated
    expect(supabase.from).toHaveBeenCalledWith('user_profiles');
    expect(supabase.from().update).toHaveBeenCalledWith({
      has_completed_onboarding: true
    });
    
    // Verify that the state was updated
    expect(result.current.hasCompletedOnboarding).toBe(true);
  });
  
  it('handles errors when completing onboarding', async () => {
    const { supabase } = require('@/lib/supabase');
    const { __setLoading, __showError } = require('@/contexts/AppStateContext');
    
    // Setup mock to return an error
    supabase.from().update().eq.mockImplementation(() => ({
      data: null,
      error: { message: 'Database error' }
    }));
    
    // Render the hook
    const { result } = renderHook(() => useOnboarding(), { wrapper });
    
    // Wait for initialization
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Complete onboarding (will trigger error)
    await act(async () => {
      await result.current.completeOnboarding();
    });
    
    // Verify that setLoading was toggled correctly
    expect(__setLoading).toHaveBeenCalledWith(true);
    expect(__setLoading).toHaveBeenCalledWith(false);
    
    // Verify that showError was called
    expect(__showError).toHaveBeenCalled();
    
    // Verify that the error was logged
    expect(console.error).toHaveBeenCalled();
    
    // State should remain unchanged
    expect(result.current.hasCompletedOnboarding).toBe(false);
  });
  
  it('handles unexpected errors when completing onboarding', async () => {
    const { supabase } = require('@/lib/supabase');
    const { __setLoading, __showError } = require('@/contexts/AppStateContext');
    
    // Setup mock to throw an unexpected error
    supabase.from().update().eq.mockImplementation(() => {
      throw new Error('Unexpected error');
    });
    
    // Render the hook
    const { result } = renderHook(() => useOnboarding(), { wrapper });
    
    // Wait for initialization
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Complete onboarding (will trigger error)
    await act(async () => {
      await result.current.completeOnboarding();
    });
    
    // Verify that setLoading was toggled correctly
    expect(__setLoading).toHaveBeenCalledWith(true);
    expect(__setLoading).toHaveBeenCalledWith(false);
    
    // Verify that showError was called
    expect(__showError).toHaveBeenCalled();
    
    // Verify that the error was logged
    expect(console.error).toHaveBeenCalled();
    
    // State should remain unchanged
    expect(result.current.hasCompletedOnboarding).toBe(false);
  });
  
  it('skips onboarding check when no user is available', async () => {
    // Set user to null
    const { __mocks } = require('@/contexts/AuthContext');
    __mocks.setMockUser(null);
    __mocks.setMockSession(null);
    
    // Render the hook
    const { result } = renderHook(() => useOnboarding(), { wrapper });
    
    // Wait for the effect to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Verify no API calls were made
    const { supabase } = require('@/lib/supabase');
    expect(supabase.rpc).not.toHaveBeenCalled();
    
    // hasCompletedOnboarding should be null when no user is available
    expect(result.current.hasCompletedOnboarding).toBe(null);
  });
  
  it('handles completeOnboarding with no user', async () => {
    // Set user to null
    const { __mocks } = require('@/contexts/AuthContext');
    __mocks.setMockUser(null);
    __mocks.setMockSession(null);
    
    // Render the hook
    const { result } = renderHook(() => useOnboarding(), { wrapper });
    
    // Wait for initialization
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Try to complete onboarding with no user
    await act(async () => {
      await result.current.completeOnboarding();
    });
    
    // Verify no API calls were made
    const { supabase } = require('@/lib/supabase');
    expect(supabase.from).not.toHaveBeenCalledWith('user_profiles');
    
    // Verify the log was made
    expect(console.log).toHaveBeenCalled();
    
    // hasCompletedOnboarding should remain null
    expect(result.current.hasCompletedOnboarding).toBe(null);
  });
}); 