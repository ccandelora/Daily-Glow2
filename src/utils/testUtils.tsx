import React, { ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { AppStateProvider } from '../contexts/AppStateContext';
import { AuthProvider } from '../contexts/AuthContext';
import { BadgeProvider } from '../contexts/BadgeContext';
import { NotificationsProvider } from '../contexts/NotificationsContext';
import { ChallengesProvider } from '../contexts/ChallengesContext';
import { CheckInStreakProvider } from '../contexts/CheckInStreakContext';
import { JournalProvider } from '../contexts/JournalContext';
import { UserProfileProvider } from '../contexts/UserProfileContext';
import { AchievementsProvider } from '../contexts/AchievementsContext';
import { OnboardingProvider } from '../contexts/OnboardingContext';

/**
 * All Providers wrapper component
 * Wraps components with all context providers in the correct hierarchy
 */
export const AllProviders: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <AppStateProvider>
      <AuthProvider>
        <BadgeProvider>
          <NotificationsProvider>
            <ChallengesProvider>
              <CheckInStreakProvider>
                <JournalProvider>
                  <UserProfileProvider>
                    <AchievementsProvider>
                      <OnboardingProvider>
                        {children}
                      </OnboardingProvider>
                    </AchievementsProvider>
                  </UserProfileProvider>
                </JournalProvider>
              </CheckInStreakProvider>
            </ChallengesProvider>
          </NotificationsProvider>
        </BadgeProvider>
      </AuthProvider>
    </AppStateProvider>
  );
};

/**
 * Custom render function that includes all providers
 */
export const renderWithAllProviders = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return render(ui, { wrapper: AllProviders, ...options });
};

/**
 * Creates mocked versions of common hooks for testing
 * @returns Object containing mocked versions of common hooks
 */
export const createMockHooks = () => {
  return {
    useAuth: jest.fn().mockReturnValue({
      session: { user: { id: 'test-user-id' } },
      user: { id: 'test-user-id', email: 'test@example.com' },
      isLoading: false,
      isEmailVerified: true,
      signIn: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
      resendVerificationEmail: jest.fn(),
      refreshSession: jest.fn(),
    }),
    useAppState: jest.fn().mockReturnValue({
      isLoading: false,
      setLoading: jest.fn(),
      showError: jest.fn(),
      showSuccess: jest.fn(),
    }),
    useBadges: jest.fn().mockReturnValue({
      badges: [],
      userBadges: [],
      isLoading: false,
      setUserId: jest.fn(),
      refreshBadges: jest.fn(),
    }),
    useNotifications: jest.fn().mockReturnValue({
      notifications: [],
      unreadCount: 0,
      userBadges: [],
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      deleteNotification: jest.fn(),
      refreshNotifications: jest.fn(),
    }),
    useUserProfile: jest.fn().mockReturnValue({
      profile: null,
      isLoading: false,
      updateProfile: jest.fn(),
      refreshProfile: jest.fn(),
    }),
    useJournal: jest.fn().mockReturnValue({
      entries: [],
      isLoading: false,
      addEntry: jest.fn(),
      updateEntry: jest.fn(),
      deleteEntry: jest.fn(),
      refreshEntries: jest.fn(),
    }),
    useChallenges: jest.fn().mockReturnValue({
      challenges: [],
      userChallenges: [],
      isLoading: false,
      joinChallenge: jest.fn(),
      completeChallenge: jest.fn(),
      refreshChallenges: jest.fn(),
    }),
    useCheckInStreak: jest.fn().mockReturnValue({
      streak: 0,
      lastCheckIn: null,
      isLoading: false,
      checkIn: jest.fn(),
      refreshStreak: jest.fn(),
    }),
    useAchievements: jest.fn().mockReturnValue({
      achievements: [],
      userAchievements: [],
      isLoading: false,
      refreshAchievements: jest.fn(),
    }),
    useOnboarding: jest.fn().mockReturnValue({
      isOnboarded: true,
      currentStep: 0, 
      completeOnboarding: jest.fn(),
      setCurrentStep: jest.fn(),
    }),
  };
};

/**
 * Creates mock implementations for Supabase
 * @returns Object containing mocked versions of Supabase client
 */
export const createMockSupabase = () => {
  const mockChannel = {
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn().mockReturnThis(),
  };

  const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    channel: jest.fn().mockReturnValue(mockChannel),
    removeChannel: jest.fn(),
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
  };

  return {
    mockSupabase,
    mockChannel,
  };
};

/**
 * Waits for a certain amount of time
 * Useful for waiting for async operations in tests
 * @param ms Milliseconds to wait
 * @returns A promise that resolves after the specified time
 */
export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Common data mocks for tests
 */
export const mockData = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    created_at: '2023-01-01T00:00:00Z',
  },
  notifications: [
    {
      id: '1',
      type: 'achievement',
      title: 'Achievement Unlocked',
      message: 'You achieved something great!',
      metadata: {},
      read: false,
      created_at: '2023-06-01T12:00:00Z',
    },
    {
      id: '2',
      type: 'badge',
      title: 'New Badge',
      message: 'You earned a new badge!',
      metadata: {},
      read: true,
      created_at: '2023-05-28T12:00:00Z',
    },
  ],
  userBadges: [
    {
      id: '1',
      badge_id: 'badge-1',
      unlocked_at: '2023-06-01T12:00:00Z',
      badge: {
        id: 'badge-1',
        name: 'Test Badge',
        description: 'A test badge',
        icon: 'trophy',
        type: 'special',
        requirement_count: 1,
        points: 100,
      },
    },
  ],
  journalEntries: [
    {
      id: '1',
      title: 'My First Entry',
      content: 'This is my first journal entry.',
      mood: 'happy',
      created_at: '2023-06-01T12:00:00Z',
    },
  ],
  challenges: [
    {
      id: '1',
      name: 'Meditation Challenge',
      description: 'Meditate for 10 minutes daily for a week',
      icon: 'meditation',
      duration_days: 7,
      points: 100,
    },
  ],
  userChallenges: [
    {
      id: '1',
      challenge_id: '1',
      started_at: '2023-06-01T12:00:00Z',
      completed_at: null,
      progress: 3,
    },
  ],
}; 