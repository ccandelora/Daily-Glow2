/**
 * Context provider mocks using the dynamic require approach
 * These mocks help with testing components that consume various context providers
 */

import React from 'react';

module.exports = {
  /**
   * Creates a mock implementation for AuthContext
   */
  createAuthContextMock: (customValues = {}) => {
    // Default mock values
    const defaultMock = {
      user: { id: 'test-user-id', email: 'test@example.com' },
      session: { access_token: 'test-token' },
      isLoading: false,
      isAuthenticated: true,
      isEmailVerified: true,
      signIn: jest.fn().mockResolvedValue({ error: null }),
      signUp: jest.fn().mockResolvedValue({ error: null }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      resetPassword: jest.fn().mockResolvedValue({ error: null }),
      resendVerificationEmail: jest.fn().mockResolvedValue({ error: null }),
      forgotPassword: jest.fn().mockResolvedValue({ error: null }),
      checkEmailVerification: jest.fn().mockResolvedValue(true),
      manuallyVerifyEmail: jest.fn().mockResolvedValue({ error: null })
    };
    
    // Merge defaults with custom values
    return { ...defaultMock, ...customValues };
  },
  
  /**
   * Creates a mock implementation for AppStateContext
   */
  createAppStateMock: (customValues = {}) => {
    const defaultMock = {
      isOnline: true,
      isAppReady: true,
      darkMode: false,
      setDarkMode: jest.fn(),
      setLoading: jest.fn(),
      showError: jest.fn(),
      showSuccess: jest.fn(),
      showInfo: jest.fn(),
    };
    
    return { ...defaultMock, ...customValues };
  },
  
  /**
   * Creates a mock implementation for JournalContext
   */
  createJournalContextMock: (customValues = {}) => {
    const defaultMock = {
      entries: [],
      isLoading: false,
      hasLoadedEntries: true,
      getEntries: jest.fn().mockResolvedValue([]),
      getTodayEntries: jest.fn().mockResolvedValue([]),
      addEntry: jest.fn().mockResolvedValue({ id: 'new-entry-id' }),
      updateEntry: jest.fn().mockResolvedValue({ error: null }),
      deleteEntry: jest.fn().mockResolvedValue({ error: null }),
      deleteMultipleEntries: jest.fn().mockResolvedValue({ error: null }),
      deleteAllEntries: jest.fn().mockResolvedValue({ error: null }),
      getEntryById: jest.fn(),
      getLatestEntryForPeriod: jest.fn()
    };
    
    return { ...defaultMock, ...customValues };
  },
  
  /**
   * Creates a mock implementation for OnboardingContext
   */
  createOnboardingContextMock: (customValues = {}) => {
    const defaultMock = {
      hasCompletedOnboarding: false,
      loading: false,
      completeOnboarding: jest.fn().mockResolvedValue({ error: null })
    };
    
    return { ...defaultMock, ...customValues };
  },
  
  /**
   * Creates a mock implementation for NotificationsContext
   */
  createNotificationsContextMock: (customValues = {}) => {
    const defaultMock = {
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      getNotifications: jest.fn().mockResolvedValue([]),
      markAsRead: jest.fn().mockResolvedValue({ error: null }),
      markAllAsRead: jest.fn().mockResolvedValue({ error: null }),
      deleteNotification: jest.fn().mockResolvedValue({ error: null }),
      deleteAllNotifications: jest.fn().mockResolvedValue({ error: null }),
      isEnabled: true,
      toggleNotifications: jest.fn()
    };
    
    return { ...defaultMock, ...customValues };
  },
  
  /**
   * Creates a mock implementation for ChallengesContext
   */
  createChallengesContextMock: (customValues = {}) => {
    const defaultMock = {
      dailyChallenge: { id: 'daily-challenge-id', title: 'Test Challenge', points: 10 },
      availableChallenges: [],
      userChallenges: [],
      userStats: { user_id: 'test-user-id', total_points: 100, level: 2 },
      isLoading: false,
      refreshDailyChallenge: jest.fn().mockResolvedValue({ error: null }),
      getAvailableChallenges: jest.fn().mockResolvedValue([]),
      completeChallenge: jest.fn().mockResolvedValue({ error: null })
    };
    
    return { ...defaultMock, ...customValues };
  },
  
  /**
   * Creates a mock implementation for BadgeContext
   */
  createBadgeContextMock: (customValues = {}) => {
    const defaultMock = {
      badges: [],
      userBadges: [],
      isLoading: false,
      getBadges: jest.fn().mockResolvedValue([]),
      getUserBadges: jest.fn().mockResolvedValue([]),
      addUserBadge: jest.fn().mockResolvedValue({ error: null }),
      getBadgeById: jest.fn(),
      getBadgeByName: jest.fn()
    };
    
    return { ...defaultMock, ...customValues };
  },
  
  /**
   * Creates a mock implementation for UserProfileContext
   */
  createUserProfileContextMock: (customValues = {}) => {
    const defaultMock = {
      profile: { 
        id: 'test-profile-id', 
        user_id: 'test-user-id', 
        username: 'testuser',
        display_name: 'Test User'
      },
      isLoading: false,
      updateProfile: jest.fn().mockResolvedValue({ error: null }),
      updateAvatar: jest.fn().mockResolvedValue({ error: null })
    };
    
    return { ...defaultMock, ...customValues };
  },
  
  /**
   * Helper to create a provider component for any context
   */
  createMockProvider: (providerName: string) => {
    return ({ children }: { children: React.ReactNode }) => {
      const React = require('react');
      return React.createElement('div', { 'data-testid': `mock-${providerName}-provider` }, children);
    };
  }
}; 