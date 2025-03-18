import React, { ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { AppStateProvider } from '@/contexts/AppStateContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { BadgeProvider } from '@/contexts/BadgeContext';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import { ChallengesProvider } from '@/contexts/ChallengesContext';
import { CheckInStreakProvider } from '@/contexts/CheckInStreakContext';
import { JournalProvider } from '@/contexts/JournalContext';
import { UserProfileProvider } from '@/contexts/UserProfileContext';
import { AchievementsProvider } from '@/contexts/AchievementsContext';
import { OnboardingProvider } from '@/contexts/OnboardingContext';

// Define provider type for clarity
type ProviderComponent = React.ComponentType<{
  children: React.ReactNode;
}>;

/**
 * Standard provider dependency order based on app hierarchy
 * This should be maintained to match the actual provider hierarchy in App.tsx
 */
export const providerDependencyOrder: ProviderComponent[] = [
  AppStateProvider,
  AuthProvider,
  BadgeProvider,
  NotificationsProvider,
  ChallengesProvider,
  CheckInStreakProvider,
  JournalProvider,
  UserProfileProvider,
  AchievementsProvider,
  OnboardingProvider,
];

/**
 * Creates a wrapper with all or selected providers for testing
 * @param providers Array of provider components to include
 * @returns A component that wraps its children with the specified providers
 */
export const createProvidersWrapper = (providers = providerDependencyOrder) => {
  return ({ children }: { children: ReactNode }): React.ReactElement => {
    return providers.reduceRight(
      (acc: React.ReactElement, Provider: ProviderComponent) => {
        return React.createElement(Provider, { children: acc });
      },
      React.createElement(React.Fragment, null, children)
    );
  };
};

/**
 * Creates a custom render function that includes the specified providers
 * @param providers Optional array of providers to include (defaults to all providers)
 * @returns A render function with the providers wrapped around the component
 */
export const createRenderWithProviders = (providers = providerDependencyOrder) => {
  const Wrapper = createProvidersWrapper(providers);
  return (ui: React.ReactElement, options?: Omit<RenderOptions, 'wrapper'>) => {
    return render(ui, { wrapper: Wrapper, ...options });
  };
};

/**
 * Default test wrapper with all providers
 */
export const AllProvidersWrapper = createProvidersWrapper();

/**
 * Render with all providers
 */
export const renderWithAllProviders = createRenderWithProviders();

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