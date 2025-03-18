import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../AuthContext';

// Mock the AppStateContext and BadgeContext hooks
jest.mock('../AppStateContext', () => ({
  useAppState: jest.fn().mockReturnValue({
    isLoading: false,
    setLoading: jest.fn(),
    showError: jest.fn(),
    showSuccess: jest.fn(),
  }),
}));

jest.mock('../BadgeContext', () => ({
  useBadges: jest.fn().mockReturnValue({
    badges: [],
    userBadges: [],
    addUserBadge: jest.fn(),
    getBadgeById: jest.fn(),
    getBadgeByName: jest.fn(),
    refreshBadges: jest.fn(),
    isLoading: false,
    setUserId: jest.fn(),
  }),
}));

// Mock the Supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      getSession: jest.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      refreshSession: jest.fn(),
      onAuthStateChange: jest.fn().mockImplementation((callback) => {
        // Mock implementation to trigger the callback manually in tests
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      }),
    },
  },
  redirectUrl: 'https://example.com/auth/callback',
}));

// Mock the router
jest.mock('expo-router', () => ({
  useRouter: jest.fn().mockReturnValue({
    replace: jest.fn(),
  }),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock Alert
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
  Platform: {
    OS: 'ios',
  },
}));

describe('AuthContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides the auth context with initial values', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Check initial state
    expect(result.current).toBeDefined();
    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(true);
    expect(typeof result.current.signIn).toBe('function');
    expect(typeof result.current.signUp).toBe('function');
    expect(typeof result.current.signOut).toBe('function');
    expect(typeof result.current.resetPassword).toBe('function');
    expect(typeof result.current.refreshSession).toBe('function');
  });

  it('signs in a user successfully', async () => {
    // Mock successful sign in
    const mockUser = { id: 'test-user-id', email: 'test@example.com' };
    const mockSignIn = jest.fn().mockResolvedValue({
      data: { user: mockUser, session: { access_token: 'test-token', user: mockUser } },
      error: null,
    });
    
    require('@/lib/supabase').supabase.auth.signInWithPassword = mockSignIn;
    
    // Mock getSession to return the user after sign in
    const mockGetSession = jest.fn().mockResolvedValue({
      data: { session: { user: mockUser, access_token: 'test-token' } },
      error: null,
    });
    require('@/lib/supabase').supabase.auth.getSession = mockGetSession;

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signIn('test@example.com', 'password');
    });

    // Check that sign in was called with correct arguments
    expect(mockSignIn).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
    });

    // Manually update the state since the test environment doesn't fully simulate the component lifecycle
    await act(async () => {
      // Wait for state updates to propagate
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // User should be set after successful sign in
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isLoading).toBe(false);
  });

  it('handles sign in error', async () => {
    // Mock sign in error
    const mockSignIn = jest.fn().mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid credentials' },
    });
    
    require('@/lib/supabase').supabase.auth.signInWithPassword = mockSignIn;
    
    // Mock getSession to return null session
    const mockGetSession = jest.fn().mockResolvedValue({
      data: { session: null },
      error: null,
    });
    require('@/lib/supabase').supabase.auth.getSession = mockGetSession;

    const { result } = renderHook(() => useAuth(), { wrapper });

    let error: any = null;
    await act(async () => {
      try {
        await result.current.signIn('test@example.com', 'wrong-password');
      } catch (e) {
        error = e;
      }
    });

    // Should throw an error
    expect(error).toBeDefined();
    expect(error.message).toBe('Invalid credentials');
    
    // Manually update the state since the test environment doesn't fully simulate the component lifecycle
    await act(async () => {
      // Wait for state updates to propagate
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // User should remain null
    expect(result.current.user).toBeNull();
  });

  it('signs up a new user successfully', async () => {
    // Mock successful sign up
    const mockUser = { id: 'new-user-id', email: 'newuser@example.com' };
    const mockSignUp = jest.fn().mockResolvedValue({
      data: { user: mockUser, session: null },
      error: null,
    });
    
    require('@/lib/supabase').supabase.auth.signUp = mockSignUp;

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signUp('newuser@example.com', 'password');
    });

    // Check that sign up was called with correct arguments
    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'newuser@example.com',
      password: 'password',
      options: {
        emailRedirectTo: expect.any(String)
      },
    });
  });

  it('signs out a user successfully', async () => {
    // Mock successful sign out
    const mockSignOut = jest.fn().mockResolvedValue({ error: null });
    require('@/lib/supabase').supabase.auth.signOut = mockSignOut;

    // Set up initial state with a logged in user
    const mockUser = { id: 'test-user-id', email: 'test@example.com' };
    const mockGetUser = jest.fn().mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    require('@/lib/supabase').supabase.auth.getUser = mockGetUser;
    
    // Mock getSession to return null session after sign out
    const mockGetSession = jest.fn().mockResolvedValue({
      data: { session: null },
      error: null,
    });
    require('@/lib/supabase').supabase.auth.getSession = mockGetSession;

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Wait for the initial auth state to load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Now sign out
    await act(async () => {
      await result.current.signOut();
      // Manually trigger the auth state change
      result.current.refreshSession();
    });

    // Check that signOut was called
    expect(mockSignOut).toHaveBeenCalled();
    
    // Manually update the state since the test environment doesn't fully simulate the component lifecycle
    await act(async () => {
      // Wait for state updates to propagate
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // User should be null after sign out
    expect(result.current.user).toBeNull();
  });

  it('handles errors during sign out', async () => {
    // Mock sign out error
    const mockSignOut = jest.fn().mockResolvedValue({ 
      error: { message: 'Error signing out' } 
    });
    require('@/lib/supabase').supabase.auth.signOut = mockSignOut;

    const { result } = renderHook(() => useAuth(), { wrapper });

    let error: any = null;
    await act(async () => {
      try {
        await result.current.signOut();
      } catch (e) {
        error = e;
      }
    });

    // Should throw an error
    expect(error).toBeDefined();
    expect(error.message).toBe('Error signing out');
  });

  it('requests password reset successfully', async () => {
    // Mock successful password reset request
    const mockResetPasswordForEmail = jest.fn().mockResolvedValue({ 
      data: {}, 
      error: null 
    });
    require('@/lib/supabase').supabase.auth.resetPasswordForEmail = mockResetPasswordForEmail;

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.forgotPassword('test@example.com');
    });

    // Check that resetPasswordForEmail was called with correct arguments
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith('test@example.com', {
      redirectTo: expect.any(String)
    });
  });

  it('handles errors during password reset request', async () => {
    // Mock error in password reset request
    const mockResetPasswordForEmail = jest.fn().mockResolvedValue({ 
      data: {}, 
      error: { message: 'User not found' } 
    });
    require('@/lib/supabase').supabase.auth.resetPasswordForEmail = mockResetPasswordForEmail;

    const { result } = renderHook(() => useAuth(), { wrapper });

    let error: any = null;
    await act(async () => {
      try {
        await result.current.forgotPassword('nonexistent@example.com');
      } catch (e) {
        error = e;
      }
    });

    // Should throw an error
    expect(error).toBeDefined();
    expect(error.message).toBe('User not found');
  });

  it('resets password successfully', async () => {
    // Mock successful password update
    const mockUpdateUser = jest.fn().mockResolvedValue({ 
      data: { user: { id: 'test-user-id' } }, 
      error: null 
    });
    require('@/lib/supabase').supabase.auth.updateUser = mockUpdateUser;

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.resetPassword('new-password');
    });

    // Check that updateUser was called with correct arguments
    expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'new-password' });
  });

  it('handles errors during password reset', async () => {
    // Mock error in password update
    const mockUpdateUser = jest.fn().mockResolvedValue({ 
      data: { user: null }, 
      error: { message: 'Password too weak' } 
    });
    require('@/lib/supabase').supabase.auth.updateUser = mockUpdateUser;

    const { result } = renderHook(() => useAuth(), { wrapper });

    let error: any = null;
    await act(async () => {
      try {
        await result.current.resetPassword('weak');
      } catch (e) {
        error = e;
      }
    });

    // Should throw an error
    expect(error).toBeDefined();
    expect(error.message).toBe('Password too weak');
  });

  it('resends verification email successfully', async () => {
    // Mock successful email verification resend
    const mockResendVerificationEmail = jest.fn().mockResolvedValue({ 
      data: {}, 
      error: null 
    });
    require('@/lib/supabase').supabase.auth.resend = {
      verificationEmail: mockResendVerificationEmail
    };

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.resendVerificationEmail('test@example.com');
    });

    // Check that resend.verificationEmail was called with correct arguments
    expect(mockResendVerificationEmail).toHaveBeenCalledWith({
      email: 'test@example.com',
      options: {
        emailRedirectTo: expect.any(String)
      }
    });
  });

  it('handles errors during verification email resend', async () => {
    // Mock error in email verification resend
    const mockResendVerificationEmail = jest.fn().mockResolvedValue({ 
      data: {}, 
      error: { message: 'Too many requests' } 
    });
    require('@/lib/supabase').supabase.auth.resend = {
      verificationEmail: mockResendVerificationEmail
    };

    const { result } = renderHook(() => useAuth(), { wrapper });

    let error: any = null;
    await act(async () => {
      try {
        await result.current.resendVerificationEmail('test@example.com');
      } catch (e) {
        error = e;
      }
    });

    // Should throw an error
    expect(error).toBeDefined();
    expect(error.message).toBe('Too many requests');
  });

  it('refreshes session successfully', async () => {
    // Mock successful session refresh
    const mockRefreshSession = jest.fn().mockResolvedValue({ 
      data: { 
        session: { access_token: 'new-token' }, 
        user: { 
          id: 'test-user-id', 
          email: 'test@example.com',
          email_confirmed_at: new Date().toISOString() // Email verified
        } 
      }, 
      error: null 
    });
    require('@/lib/supabase').supabase.auth.refreshSession = mockRefreshSession;
    
    // Get the mock for showSuccess
    const { showSuccess } = require('../AppStateContext').useAppState();

    const { result } = renderHook(() => useAuth(), { wrapper });

    let refreshResult: any = null;
    await act(async () => {
      refreshResult = await result.current.refreshSession();
    });

    // Check the result
    expect(refreshResult).toBeDefined();
    expect(refreshResult.isVerified).toBe(true);
    expect(refreshResult.user).toBeDefined();
    
    // Success message should be shown for verified email
    expect(showSuccess).toHaveBeenCalledWith('Email verified successfully!');
  });

  it('handles errors during session refresh', async () => {
    // Mock error in session refresh
    const mockRefreshSession = jest.fn().mockResolvedValue({ 
      data: { session: null, user: null }, 
      error: { message: 'Session expired' } 
    });
    require('@/lib/supabase').supabase.auth.refreshSession = mockRefreshSession;
    
    // Get the mock for showError
    const { showError } = require('../AppStateContext').useAppState();

    const { result } = renderHook(() => useAuth(), { wrapper });

    let refreshResult: any = null;
    await act(async () => {
      refreshResult = await result.current.refreshSession();
    });

    // Should handle error and return default values
    expect(refreshResult).toEqual({ isVerified: false, user: null });
    expect(showError).toHaveBeenCalled();
  });

  it('manually verifies email in development mode', async () => {
    // Get the mock for showSuccess
    const { showSuccess } = require('../AppStateContext').useAppState();

    const { result } = renderHook(() => useAuth(), { wrapper });

    let verifyResult: any = null;
    await act(async () => {
      verifyResult = await result.current.devManuallyVerifyEmail('test@example.com');
    });

    // Check that the function returns the expected result
    expect(verifyResult).toBe(true);
    expect(showSuccess).toHaveBeenCalled();
  });

  it('checks email verification status', async () => {
    // Setup verified user
    const verifiedUser = { 
      id: 'verified-user-id', 
      email: 'verified@example.com',
      email_confirmed_at: new Date().toISOString() // Email is verified
    };
    
    // Setup unverified user
    const unverifiedUser = { 
      id: 'unverified-user-id', 
      email: 'unverified@example.com',
      email_confirmed_at: null // Email is not verified
    };

    // Mock getSession to return verified user
    const mockGetSessionVerified = jest.fn().mockResolvedValue({
      data: { session: { user: verifiedUser } },
      error: null
    });
    require('@/lib/supabase').supabase.auth.getSession = mockGetSessionVerified;

    // Render hook with verified user
    const { result: verifiedResult, rerender } = renderHook(() => useAuth(), { wrapper });
    
    // Wait for initial state to load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Email should be verified
    expect(verifiedResult.current.isEmailVerified).toBe(true);
    
    // Now mock getSession to return unverified user
    const mockGetSessionUnverified = jest.fn().mockResolvedValue({
      data: { session: { user: unverifiedUser } },
      error: null
    });
    require('@/lib/supabase').supabase.auth.getSession = mockGetSessionUnverified;
    
    // Re-render with unverified user
    rerender({wrapper});
    
    // Wait for state to update
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Email should not be verified
    expect(verifiedResult.current.isEmailVerified).toBe(false);
  });
}); 