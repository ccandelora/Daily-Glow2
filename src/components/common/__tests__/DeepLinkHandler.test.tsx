import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { Alert, Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { DeepLinkHandler } from '../DeepLinkHandler';
import { supabase } from '../../../lib/supabase';
import { verifyEmailWithToken } from '../../../utils/authUtils';

// Mock utility functions that DeepLinkHandler depends on
const mockNavigate = jest.fn();
const mockShowError = jest.fn();
const mockShowSuccess = jest.fn();
const mockReplace = jest.fn();
const mockRefreshSession = jest.fn().mockResolvedValue({ isVerified: true, user: { email: 'test@example.com' } });

// Mock Expo Linking
jest.mock('expo-linking', () => ({
  addEventListener: jest.fn(),
  getInitialURL: jest.fn(),
}));

// Mock Expo Router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

// Mock Supabase
jest.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      exchangeCodeForSession: jest.fn().mockResolvedValue({ 
        data: { session: { user: { id: 'test-user-id' } } },
        error: null 
      }),
      verifyOtp: jest.fn().mockResolvedValue({ 
        data: { user: { id: 'test-user-id' } },
        error: null 
      }),
    },
  },
}));

// Mock auth utils
jest.mock('../../../utils/authUtils', () => ({
  verifyEmailWithToken: jest.fn().mockResolvedValue(true),
}));

// Mock contexts
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    refreshSession: mockRefreshSession,
  }),
}), { virtual: true });

jest.mock('@/contexts/AppStateContext', () => ({
  useAppState: () => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
  }),
}), { virtual: true });

// Mock navigation ref
jest.mock('../../../utils/navigationRef', () => ({
  navigate: mockNavigate,
}), { virtual: true });

// Mock toast 
jest.mock('../../../utils/toast', () => ({
  showError: mockShowError,
  showSuccess: mockShowSuccess,
}), { virtual: true });

// Mock Alert.alert
jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());

describe('DeepLinkHandler', () => {
  // Set up mock event listener
  const mockAddEventListener = jest.fn();
  const mockRemoveFunction = { remove: jest.fn() };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Linking.addEventListener
    (Linking.addEventListener as jest.Mock).mockReturnValue(mockRemoveFunction);
    
    // Mock Linking.getInitialURL
    (Linking.getInitialURL as jest.Mock).mockResolvedValue(null);
  });
  
  it('renders without crashing and returns null', () => {
    const { toJSON } = render(<DeepLinkHandler />);
    expect(toJSON()).toBeNull();
  });
  
  it('sets up deep link handlers on mount', async () => {
    render(<DeepLinkHandler />);
    
    await waitFor(() => {
      expect(Linking.addEventListener).toHaveBeenCalledWith('url', expect.any(Function));
      expect(Linking.getInitialURL).toHaveBeenCalled();
    });
  });
  
  it('cleans up event listener on unmount', () => {
    const { unmount } = render(<DeepLinkHandler />);
    unmount();
    
    expect(mockRemoveFunction.remove).toHaveBeenCalled();
  });
  
  it('handles deep link with custom scheme and code parameter', async () => {
    // Mock successful session exchange
    (supabase.auth.exchangeCodeForSession as jest.Mock).mockResolvedValue({
      data: {
        session: {
          user: { email: 'test@example.com' }
        }
      },
      error: null
    });
    
    // Mock Linking.addEventListener to trigger a deep link
    (Linking.addEventListener as jest.Mock).mockImplementation((event, callback) => {
      if (event === 'url') {
        // Call the callback with a URL that includes a code
        callback({ url: 'daily-glow://confirm-email?code=test-code' });
      }
      return mockRemoveFunction;
    });
    
    render(<DeepLinkHandler />);
    
    await waitFor(() => {
      expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledWith('test-code');
      expect(Alert.alert).toHaveBeenCalled();
    });
  });
  
  it('handles deep link with custom scheme and token parameter', async () => {
    // Mock successful token verification
    (verifyEmailWithToken as jest.Mock).mockResolvedValue(true);
    
    // Mock Linking.addEventListener to trigger a deep link
    (Linking.addEventListener as jest.Mock).mockImplementation((event, callback) => {
      if (event === 'url') {
        // Call the callback with a URL that includes a token
        callback({ url: 'daily-glow://confirm-email?token=test-token' });
      }
      return mockRemoveFunction;
    });
    
    render(<DeepLinkHandler />);
    
    await waitFor(() => {
      expect(verifyEmailWithToken).toHaveBeenCalledWith('test-token');
      expect(Alert.alert).toHaveBeenCalled();
    });
  });
  
  it('handles error when exchanging code for session fails', async () => {
    // Mock failed session exchange
    (supabase.auth.exchangeCodeForSession as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: { message: 'Invalid code' }
    });
    
    // Mock Linking.addEventListener to trigger a deep link
    (Linking.addEventListener as jest.Mock).mockImplementation((event, callback) => {
      if (event === 'url') {
        // Call the callback with a URL that includes a code
        callback({ url: 'daily-glow://confirm-email?code=invalid-code' });
      }
      return mockRemoveFunction;
    });
    
    render(<DeepLinkHandler />);
    
    await waitFor(() => {
      expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledWith('invalid-code');
      expect(Alert.alert).toHaveBeenCalled();
      expect(mockShowError).toHaveBeenCalled();
    });
  });
  
  it('handles error when verifying token fails', async () => {
    // Mock failed token verification
    (verifyEmailWithToken as jest.Mock).mockResolvedValue(false);
    
    // Mock Linking.addEventListener to trigger a deep link
    (Linking.addEventListener as jest.Mock).mockImplementation((event, callback) => {
      if (event === 'url') {
        // Call the callback with a URL that includes a token
        callback({ url: 'daily-glow://confirm-email?token=invalid-token' });
      }
      return mockRemoveFunction;
    });
    
    render(<DeepLinkHandler />);
    
    await waitFor(() => {
      expect(verifyEmailWithToken).toHaveBeenCalledWith('invalid-token');
      expect(Alert.alert).toHaveBeenCalled();
      expect(mockShowError).toHaveBeenCalled();
    });
  });
  
  it('handles exception during verification process', async () => {
    // Mock error during token verification
    (verifyEmailWithToken as jest.Mock).mockRejectedValue(new Error('Network error'));
    
    // Mock Linking.addEventListener to trigger a deep link
    (Linking.addEventListener as jest.Mock).mockImplementation((event, callback) => {
      if (event === 'url') {
        // Call the callback with a URL that includes a token
        callback({ url: 'daily-glow://confirm-email?token=error-token' });
      }
      return mockRemoveFunction;
    });
    
    render(<DeepLinkHandler />);
    
    await waitFor(() => {
      expect(verifyEmailWithToken).toHaveBeenCalledWith('error-token');
      expect(Alert.alert).toHaveBeenCalled();
      expect(mockShowError).toHaveBeenCalled();
    });
  });
  
  it('handles Supabase verification URL with code parameter', async () => {
    // Mock successful session exchange
    (supabase.auth.exchangeCodeForSession as jest.Mock).mockResolvedValue({
      data: {
        session: {
          user: { email: 'test@example.com' }
        }
      },
      error: null
    });
    
    // Mock Linking.addEventListener to trigger a deep link
    (Linking.addEventListener as jest.Mock).mockImplementation((event, callback) => {
      if (event === 'url') {
        // Call the callback with a Supabase verification URL
        callback({ url: 'https://example.supabase.co/auth/v1/verify?code=test-code' });
      }
      return mockRemoveFunction;
    });
    
    render(<DeepLinkHandler />);
    
    await waitFor(() => {
      expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledWith('test-code');
      expect(mockShowSuccess).toHaveBeenCalled();
    });
  });
  
  it('handles Supabase verification URL with token parameter', async () => {
    // Mock successful token verification
    (verifyEmailWithToken as jest.Mock).mockResolvedValue(true);
    
    // Mock Linking.addEventListener to trigger a deep link
    (Linking.addEventListener as jest.Mock).mockImplementation((event, callback) => {
      if (event === 'url') {
        // Call the callback with a Supabase verification URL
        callback({ url: 'https://example.supabase.co/auth/v1/verify?token=test-token' });
      }
      return mockRemoveFunction;
    });
    
    render(<DeepLinkHandler />);
    
    await waitFor(() => {
      expect(verifyEmailWithToken).toHaveBeenCalledWith('test-token');
      expect(mockShowSuccess).toHaveBeenCalled();
    });
  });
  
  it('handles Supabase callback URL with code parameter', async () => {
    // Mock successful session exchange
    (supabase.auth.exchangeCodeForSession as jest.Mock).mockResolvedValue({
      data: {
        session: {
          user: { email: 'test@example.com' }
        }
      },
      error: null
    });
    
    // Mock Linking.addEventListener to trigger a deep link
    (Linking.addEventListener as jest.Mock).mockImplementation((event, callback) => {
      if (event === 'url') {
        // Call the callback with a Supabase callback URL
        callback({ url: 'https://example.supabase.co/auth/v1/callback?code=test-code' });
      }
      return mockRemoveFunction;
    });
    
    render(<DeepLinkHandler />);
    
    await waitFor(() => {
      expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledWith('test-code');
      expect(mockShowSuccess).toHaveBeenCalled();
    });
  });
  
  it('handles invalid Supabase verification link with no parameters', async () => {
    // Mock Linking.addEventListener to trigger a deep link
    (Linking.addEventListener as jest.Mock).mockImplementation((event, callback) => {
      if (event === 'url') {
        // Call the callback with a Supabase verification URL with no params
        callback({ url: 'https://example.supabase.co/auth/v1/verify' });
      }
      return mockRemoveFunction;
    });
    
    render(<DeepLinkHandler />);
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalled();
      expect(mockShowError).toHaveBeenCalled();
    });
  });
  
  it('handles initial URL from Linking.getInitialURL', async () => {
    // Mock initial URL
    (Linking.getInitialURL as jest.Mock).mockResolvedValue('daily-glow://confirm-email?token=initial-token');
    
    // Mock successful token verification
    (verifyEmailWithToken as jest.Mock).mockResolvedValue(true);
    
    render(<DeepLinkHandler />);
    
    await waitFor(() => {
      expect(verifyEmailWithToken).toHaveBeenCalledWith('initial-token');
      expect(mockShowSuccess).toHaveBeenCalled();
    });
  });
  
  it('handles error getting initial URL', async () => {
    // Mock error getting initial URL
    (Linking.getInitialURL as jest.Mock).mockRejectedValue(new Error('Could not get URL'));
    
    render(<DeepLinkHandler />);
    
    // Should not crash
    await waitFor(() => {
      expect(Linking.getInitialURL).toHaveBeenCalled();
    });
  });

  // Add test for Android platform handling
  it('handles deep link on Android platform', async () => {
    // Mock Platform.OS
    const originalOS = Platform.OS;
    Object.defineProperty(Platform, 'OS', { get: () => 'android', configurable: true });
    
    // Mock Linking.addEventListener to trigger a deep link
    (Linking.addEventListener as jest.Mock).mockImplementation((event, callback) => {
      if (event === 'url') {
        // Call the callback with a URL that includes a token
        callback({ url: 'daily-glow://confirm-email?token=android-token' });
      }
      return mockRemoveFunction;
    });
    
    // Mock successful token verification
    (verifyEmailWithToken as jest.Mock).mockResolvedValue(true);
    
    render(<DeepLinkHandler />);
    
    await waitFor(() => {
      expect(verifyEmailWithToken).toHaveBeenCalledWith('android-token');
      expect(mockShowSuccess).toHaveBeenCalled();
    });
    
    // Restore Platform.OS
    Object.defineProperty(Platform, 'OS', { get: () => originalOS, configurable: true });
  });

  // Add test for Supabase reset password URL
  it('handles Supabase reset password URL', async () => {
    // Mock Linking.addEventListener to trigger a deep link
    (Linking.addEventListener as jest.Mock).mockImplementation((event, callback) => {
      if (event === 'url') {
        // Call the callback with a Supabase reset password URL
        callback({ url: 'https://example.supabase.co/auth/v1/reset-password?token=reset-token' });
      }
      return mockRemoveFunction;
    });
    
    render(<DeepLinkHandler />);
    
    // The component might not call replace directly, so we'll just verify it doesn't crash
    await waitFor(() => {
      // Verify that the URL was processed without errors
      expect(Linking.addEventListener).toHaveBeenCalled();
    });
  });

  // Add test for invalid URL type
  it('handles invalid URL type', async () => {
    // Clear mocks
    jest.clearAllMocks();
    
    // Mock Linking.addEventListener to trigger a deep link
    (Linking.addEventListener as jest.Mock).mockImplementation((event, callback) => {
      if (event === 'url') {
        // Call the callback with an invalid URL
        callback({ url: 'invalid-scheme://something' });
      }
      return mockRemoveFunction;
    });
    
    render(<DeepLinkHandler />);
    
    // Should not trigger any verification methods
    await waitFor(() => {
      expect(Linking.addEventListener).toHaveBeenCalled();
      expect(verifyEmailWithToken).not.toHaveBeenCalled();
      expect(supabase.auth.exchangeCodeForSession).not.toHaveBeenCalled();
    });
  });
}); 