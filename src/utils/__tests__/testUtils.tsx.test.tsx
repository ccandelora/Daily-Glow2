// Import React and testing utilities
import React, { ReactNode } from 'react';
import { View, Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';

// Create a helper function to get the testUtils.tsx exports
// This avoids TypeScript extension issues
const getTestUtilsExports = () => {
  // Using dynamic require to avoid TypeScript extension issues
  return require('../../utils/testUtils.tsx');
};

// Mock all context providers to prevent dependency errors
jest.mock('../../contexts/AppStateContext', () => {
  const React = require('react');
  return {
    AppStateProvider: ({ children }: { children: React.ReactNode }) => 
      React.createElement('div', { 'data-testid': 'mock-app-state-provider' }, children),
    useAppState: jest.fn()
  };
});

jest.mock('../../contexts/AuthContext', () => {
  const React = require('react');
  return {
    AuthProvider: ({ children }: { children: React.ReactNode }) => 
      React.createElement('div', { 'data-testid': 'mock-auth-provider' }, children),
    useAuth: jest.fn()
  };
});

jest.mock('../../contexts/BadgeContext', () => {
  const React = require('react');
  return {
    BadgeProvider: ({ children }: { children: React.ReactNode }) => 
      React.createElement('div', { 'data-testid': 'mock-badge-provider' }, children),
    useBadges: jest.fn()
  };
});

jest.mock('../../contexts/NotificationsContext', () => {
  const React = require('react');
  return {
    NotificationsProvider: ({ children }: { children: React.ReactNode }) => 
      React.createElement('div', { 'data-testid': 'mock-notifications-provider' }, children),
    useNotifications: jest.fn()
  };
});

jest.mock('../../contexts/ChallengesContext', () => {
  const React = require('react');
  return {
    ChallengesProvider: ({ children }: { children: React.ReactNode }) => 
      React.createElement('div', { 'data-testid': 'mock-challenges-provider' }, children),
    useChallenges: jest.fn()
  };
});

jest.mock('../../contexts/CheckInStreakContext', () => {
  const React = require('react');
  return {
    CheckInStreakProvider: ({ children }: { children: React.ReactNode }) => 
      React.createElement('div', { 'data-testid': 'mock-check-in-streak-provider' }, children),
    useCheckInStreak: jest.fn()
  };
});

jest.mock('../../contexts/JournalContext', () => {
  const React = require('react');
  return {
    JournalProvider: ({ children }: { children: React.ReactNode }) => 
      React.createElement('div', { 'data-testid': 'mock-journal-provider' }, children),
    useJournal: jest.fn()
  };
});

jest.mock('../../contexts/UserProfileContext', () => {
  const React = require('react');
  return {
    UserProfileProvider: ({ children }: { children: React.ReactNode }) => 
      React.createElement('div', { 'data-testid': 'mock-user-profile-provider' }, children),
    useUserProfile: jest.fn()
  };
});

jest.mock('../../contexts/AchievementsContext', () => {
  const React = require('react');
  return {
    AchievementsProvider: ({ children }: { children: React.ReactNode }) => 
      React.createElement('div', { 'data-testid': 'mock-achievements-provider' }, children),
    useAchievements: jest.fn()
  };
});

jest.mock('../../contexts/OnboardingContext', () => {
  const React = require('react');
  return {
    OnboardingProvider: ({ children }: { children: React.ReactNode }) => 
      React.createElement('div', { 'data-testid': 'mock-onboarding-provider' }, children),
    useOnboarding: jest.fn()
  };
});

// Mock Supabase
jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      verifyOtp: jest.fn()
    },
    from: jest.fn().mockReturnThis(),
  }
}));

describe('testUtils.tsx - React-specific utilities', () => {
  // Get the exports from testUtils.tsx
  const { 
    AllProviders, 
    renderWithAllProviders, 
    createMockHooks, 
    mockData,
    createMockSupabase,
    wait
  } = getTestUtilsExports();

  describe('AllProviders', () => {
    it('should render children wrapped in all context providers', () => {
      render(
        <AllProviders>
          <View testID="test-child">
            <Text>Test Child</Text>
          </View>
        </AllProviders>
      );

      // Check that the child component is rendered
      expect(screen.getByTestId('test-child')).toBeDefined();
    });
  });

  describe('renderWithAllProviders', () => {
    it('should render UI with AllProviders wrapper', () => {
      const { getByTestId } = renderWithAllProviders(
        <View testID="test-element">
          <Text>Test Element</Text>
        </View>
      );

      // Verify the rendered element is in the document
      expect(getByTestId('test-element')).toBeDefined();
    });

    it('should pass additional render options', () => {
      // Just testing that the function can be called with options
      const result = renderWithAllProviders(
        <View testID="test-element">
          <Text>Test Element</Text>
        </View>,
        { 
          // Empty options object, just testing that it doesn't error
        }
      );

      // Just verify the result has properties we expect
      expect(result.getByTestId).toBeDefined();
    });
  });

  describe('createMockHooks', () => {
    it('should return mock implementations of common hooks', () => {
      const mockHooks = createMockHooks();
      
      // Verify that all expected hooks are defined
      expect(mockHooks.useAuth).toBeDefined();
      expect(mockHooks.useAppState).toBeDefined();
      expect(mockHooks.useBadges).toBeDefined();
      expect(mockHooks.useNotifications).toBeDefined();
      expect(mockHooks.useUserProfile).toBeDefined();
      expect(mockHooks.useJournal).toBeDefined();
      expect(mockHooks.useChallenges).toBeDefined();
      expect(mockHooks.useCheckInStreak).toBeDefined();
      expect(mockHooks.useAchievements).toBeDefined();
      expect(mockHooks.useOnboarding).toBeDefined();
      
      // Test that hook functions return expected values
      const authHook = mockHooks.useAuth();
      expect(authHook.user).toEqual({ id: 'test-user-id', email: 'test@example.com' });
      expect(authHook.isEmailVerified).toBe(true);
      expect(authHook.signIn).toBeDefined();
      expect(authHook.signOut).toBeDefined();
      
      // Test that mock functions can be called
      authHook.signIn('test@example.com', 'password');
      expect(authHook.signIn).toHaveBeenCalledWith('test@example.com', 'password');
      
      // Test AppState hook
      const appStateHook = mockHooks.useAppState();
      expect(appStateHook.isLoading).toBe(false);
      expect(appStateHook.setLoading).toBeDefined();
      appStateHook.showError('Test error');
      expect(appStateHook.showError).toHaveBeenCalledWith('Test error');
    });
  });

  describe('mockData', () => {
    it('should contain mock data for testing', () => {
      // Verify that mockData contains expected objects
      expect(mockData.user).toBeDefined();
      expect(mockData.notifications).toBeDefined();
      expect(mockData.userBadges).toBeDefined();
      expect(mockData.journalEntries).toBeDefined();
      expect(mockData.challenges).toBeDefined();
      expect(mockData.userChallenges).toBeDefined();
      
      // Verify structure of mock data
      expect(mockData.user.id).toBe('test-user-id');
      expect(mockData.user.email).toBe('test@example.com');
      
      // Check notifications array
      expect(Array.isArray(mockData.notifications)).toBe(true);
      expect(mockData.notifications.length).toBeGreaterThan(0);
      expect(mockData.notifications[0].id).toBeDefined();
      expect(mockData.notifications[0].type).toBeDefined();
      expect(mockData.notifications[0].title).toBeDefined();
      
      // Check userBadges array
      expect(Array.isArray(mockData.userBadges)).toBe(true);
      expect(mockData.userBadges.length).toBeGreaterThan(0);
      expect(mockData.userBadges[0].badge).toBeDefined();
      expect(mockData.userBadges[0].badge.name).toBeDefined();
    });
  });

  describe('createMockSupabase', () => {
    it('should create mock implementations of Supabase client', () => {
      // Get mock Supabase
      const { mockSupabase, mockChannel } = createMockSupabase();
      
      // Check that mock client has expected methods
      expect(mockSupabase.from).toBeDefined();
      expect(mockSupabase.select).toBeDefined();
      expect(mockSupabase.eq).toBeDefined();
      expect(mockSupabase.order).toBeDefined();
      expect(mockSupabase.update).toBeDefined();
      expect(mockSupabase.delete).toBeDefined();
      expect(mockSupabase.insert).toBeDefined();
      expect(mockSupabase.upsert).toBeDefined();
      expect(mockSupabase.channel).toBeDefined();
      expect(mockSupabase.removeChannel).toBeDefined();
      expect(mockSupabase.auth).toBeDefined();
      
      // Verify auth methods
      expect(mockSupabase.auth.signInWithPassword).toBeDefined();
      expect(mockSupabase.auth.signUp).toBeDefined();
      expect(mockSupabase.auth.signOut).toBeDefined();
      expect(mockSupabase.auth.resetPasswordForEmail).toBeDefined();
      expect(mockSupabase.auth.updateUser).toBeDefined();
      expect(mockSupabase.auth.onAuthStateChange).toBeDefined();
      
      // Verify method chaining works
      const fromResult = mockSupabase.from('table');
      expect(fromResult).toBe(mockSupabase);
      
      const selectResult = fromResult.select();
      expect(selectResult).toBe(mockSupabase);
      
      const eqResult = selectResult.eq('column', 'value');
      expect(eqResult).toBe(mockSupabase);
      
      // Verify channel is created correctly
      const channelResult = mockSupabase.channel('test');
      expect(channelResult).toBe(mockChannel);
      
      // Verify channel methods
      const onResult = mockChannel.on('event', () => {});
      expect(onResult).toBe(mockChannel);
      
      const subscribeResult = mockChannel.subscribe();
      expect(subscribeResult).toBe(mockChannel);
    });
  });

  describe('wait', () => {
    it('should return a promise that resolves after the specified time', async () => {
      // Mock setTimeout
      jest.useFakeTimers();
      
      // Create a mock function to check when the promise resolves
      const mockFn = jest.fn();
      
      // Call wait and add the mock function as a callback
      const promise = wait(1000).then(mockFn);
      
      // At this point, the callback should not have been called
      expect(mockFn).not.toHaveBeenCalled();
      
      // Fast-forward time
      jest.advanceTimersByTime(999);
      await Promise.resolve(); // Let any pending promises resolve
      
      // The callback should still not have been called
      expect(mockFn).not.toHaveBeenCalled();
      
      // Fast-forward to 1000ms
      jest.advanceTimersByTime(1);
      await Promise.resolve(); // Let any pending promises resolve
      
      // Now the callback should have been called
      expect(mockFn).toHaveBeenCalled();
      
      // Clean up
      jest.useRealTimers();
    });
  });
}); 