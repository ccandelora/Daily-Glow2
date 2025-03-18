/**
 * Example of fixing OnboardingContext tests using shared mock utilities
 * This example addresses the "setLoading is not a function" error by properly
 * mocking dependent contexts with the dynamic require approach
 */

import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { OnboardingProvider, useOnboarding } from '../../contexts/OnboardingContext';

// Mock the supabase client
jest.mock('../../lib/supabase', () => {
  // Create mock responses that can be customized in each test
  const mockRpcResponse = { data: false, error: null };
  const mockQueryResponse = { data: null, error: null };
  const mockInsertResponse = { data: { id: 'test-profile-id' }, error: null };
  
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
          eq: jest.fn(() => mockQueryResponse)
        }))
      }))
    }
  };
});

// Mock AuthContext using our shared ContextMocks
jest.mock('../../contexts/AuthContext', () => {
  const { createAuthContextMock } = require('../../__mocks__/ContextMocks');
  
  // Create a default mock that can be modified in each test
  const defaultMock = createAuthContextMock();
  
  return {
    useAuth: jest.fn(() => defaultMock),
    // The test can access this to customize the mock for specific tests
    __mocks: {
      setMockUser: (user) => {
        defaultMock.user = user;
      },
      setMockSession: (session) => {
        defaultMock.session = session;
      },
      setIsAuthenticated: (value) => {
        defaultMock.isAuthenticated = value;
      }
    }
  };
});

// Mock AppStateContext using our shared ContextMocks
jest.mock('../../contexts/AppStateContext', () => {
  const { createAppStateMock } = require('../../__mocks__/ContextMocks');
  
  // Create a default mock with all required functions
  const mockAppState = createAppStateMock();
  
  return {
    useAppState: jest.fn(() => mockAppState),
    // Expose the mock for test customization
    __setLoading: mockAppState.setLoading
  };
});

// Test component to access the context values
const TestComponent = ({ onComplete = () => {} }) => {
  const { hasCompletedOnboarding, completeOnboarding, loading } = useOnboarding();
  
  React.useEffect(() => {
    if (loading === false) {
      onComplete({ hasCompletedOnboarding, loading });
    }
  }, [loading, hasCompletedOnboarding, onComplete]);
  
  return (
    <div data-testid="test-component">
      <div data-testid="onboarding-status">
        {hasCompletedOnboarding ? 'Completed' : 'Not Completed'}
      </div>
      <div data-testid="loading-status">
        {loading ? 'Loading' : 'Not Loading'}
      </div>
      <button 
        data-testid="complete-button" 
        onClick={() => completeOnboarding()}
      >
        Complete Onboarding
      </button>
    </div>
  );
};

describe('OnboardingContext', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset supabase mocks
    const { supabase } = require('../../lib/supabase');
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
    
    // Reset auth mocks to default values
    const { __mocks } = require('../../contexts/AuthContext');
    __mocks.setMockUser({ id: 'test-user-id', email: 'test@example.com' });
    __mocks.setMockSession({ access_token: 'test-token' });
    __mocks.setIsAuthenticated(true);
  });
  
  test('initializes with default values', async () => {
    const onComplete = jest.fn();
    
    render(
      <OnboardingProvider>
        <TestComponent onComplete={onComplete} />
      </OnboardingProvider>
    );
    
    // Wait for the initialization to complete
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });
    
    // Verify that the default value is false
    const result = onComplete.mock.calls[0][0];
    expect(result.hasCompletedOnboarding).toBe(false);
    expect(result.loading).toBe(false);
  });
  
  test('checks if user has completed onboarding', async () => {
    const { supabase } = require('../../lib/supabase');
    
    // Mock the RPC call to return true (user has completed onboarding)
    supabase.rpc.mockImplementation(() => ({
      data: true,
      error: null
    }));
    
    const onComplete = jest.fn();
    
    render(
      <OnboardingProvider>
        <TestComponent onComplete={onComplete} />
      </OnboardingProvider>
    );
    
    // Wait for the initialization to complete
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });
    
    // Verify that the onboarding status is true
    const result = onComplete.mock.calls[0][0];
    expect(result.hasCompletedOnboarding).toBe(true);
    expect(result.loading).toBe(false);
    
    // Verify that the RPC was called with the correct parameters
    expect(supabase.rpc).toHaveBeenCalledWith('check_onboarding_status', {
      user_id: 'test-user-id'
    });
  });
  
  test('completes onboarding successfully', async () => {
    const { supabase } = require('../../lib/supabase');
    const { __setLoading } = require('../../contexts/AppStateContext');
    
    // Mock the insert call to return success
    supabase.from().insert().single.mockImplementation(() => ({
      data: { id: 'new-profile-id', user_id: 'test-user-id', has_completed_onboarding: true },
      error: null
    }));
    
    const onComplete = jest.fn();
    let completeButtonFn;
    
    const { getByTestId } = render(
      <OnboardingProvider>
        <TestComponent 
          onComplete={onComplete}
          ref={(ref) => {
            if (ref) {
              completeButtonFn = ref.completeOnboarding;
            }
          }}
        />
      </OnboardingProvider>
    );
    
    // Wait for initialization
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });
    
    // Reset the onComplete mock
    onComplete.mockReset();
    
    // Trigger onboarding completion
    await act(async () => {
      const completeButton = getByTestId('complete-button');
      completeButton.click();
    });
    
    // Wait for completion
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });
    
    // Verify that setLoading was called correctly
    expect(__setLoading).toHaveBeenCalledWith(true);
    expect(__setLoading).toHaveBeenCalledWith(false);
    
    // Verify that the profile was created
    expect(supabase.from).toHaveBeenCalledWith('user_profiles');
    expect(supabase.from().insert).toHaveBeenCalledWith({
      user_id: 'test-user-id',
      has_completed_onboarding: true
    });
    
    // Verify that the state was updated
    const result = onComplete.mock.calls[0][0];
    expect(result.hasCompletedOnboarding).toBe(true);
  });
  
  test('handles errors when checking onboarding status', async () => {
    const { supabase } = require('../../lib/supabase');
    
    // Mock the RPC call to return an error
    supabase.rpc.mockImplementation(() => ({
      data: null,
      error: { message: 'Table does not exist' }
    }));
    
    // Mock console.error to prevent test output clutter
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    const onComplete = jest.fn();
    
    render(
      <OnboardingProvider>
        <TestComponent onComplete={onComplete} />
      </OnboardingProvider>
    );
    
    // Wait for the initialization to complete
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });
    
    // Verify that the default value is used when an error occurs
    const result = onComplete.mock.calls[0][0];
    expect(result.hasCompletedOnboarding).toBe(false);
    
    // Verify that the error was logged
    expect(console.error).toHaveBeenCalled();
    
    // Restore console.error
    console.error = originalConsoleError;
  });
  
  test('handles errors when completing onboarding', async () => {
    const { supabase } = require('../../lib/supabase');
    const { __setLoading } = require('../../contexts/AppStateContext');
    const { useAppState } = require('../../contexts/AppStateContext');
    
    // Mock the insert call to return an error
    supabase.from().insert().single.mockImplementation(() => ({
      data: null,
      error: { message: 'Database error' }
    }));
    
    // Mock console.error
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    const onComplete = jest.fn();
    
    const { getByTestId } = render(
      <OnboardingProvider>
        <TestComponent onComplete={onComplete} />
      </OnboardingProvider>
    );
    
    // Wait for initialization
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });
    
    // Reset the onComplete mock
    onComplete.mockReset();
    
    // Trigger onboarding completion
    await act(async () => {
      const completeButton = getByTestId('complete-button');
      completeButton.click();
    });
    
    // Verify that setLoading was toggled correctly
    expect(__setLoading).toHaveBeenCalledWith(true);
    expect(__setLoading).toHaveBeenCalledWith(false);
    
    // Verify that showError was called
    expect(useAppState().showError).toHaveBeenCalled();
    
    // Verify that the error was logged
    expect(console.error).toHaveBeenCalled();
    
    // Restore console.error
    console.error = originalConsoleError;
  });
}); 