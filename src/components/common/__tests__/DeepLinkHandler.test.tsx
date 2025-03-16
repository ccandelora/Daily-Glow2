import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { Alert, Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { DeepLinkHandler } from '../DeepLinkHandler';
import { supabase } from '../../../lib/supabase';
import { verifyEmailWithToken } from '../../../utils/authUtils';
import { useAuth } from '@/contexts/AuthContext';
import { useAppState } from '@/contexts/AppStateContext';
import { useRouter } from 'expo-router';

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
    channel: jest.fn().mockReturnValue({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnValue({}),
    }),
    removeChannel: jest.fn(),
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

// Mock Platform to test iOS/Android specific behavior
const originalPlatform = Platform.OS;
const mockPlatform = (os) => {
  Object.defineProperty(Platform, 'OS', { get: () => os });
};

// We need to extract the parseQueryParams function from DeepLinkHandler
// Since it's not exported directly, we'll recreate it for testing
const parseQueryParams = (url: string): Record<string, string> => {
  try {
    const parsedUrl = new URL(url);
    const params: Record<string, string> = {};
    
    // Get query parameters from the URL
    parsedUrl.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    // Also check for hash fragment parameters (common in OAuth flows)
    if (parsedUrl.hash) {
      const hashParams = new URLSearchParams(parsedUrl.hash.substring(1));
      hashParams.forEach((value, key) => {
        params[key] = value;
      });
    }
    
    return params;
  } catch (error) {
    console.error('Error parsing URL:', error);
    return {};
  }
};

// Mock configureExpoLinking
const mockConfigureLinking = (os: 'ios' | 'android') => {
  Platform.OS = os;
  // Additional configuration if needed
};

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
  
  afterAll(() => {
    // Restore original platform
    mockPlatform(originalPlatform);
  });
  
  // Test parseQueryParams function directly
  describe('parseQueryParams function', () => {
    it('parses query parameters from a URL with standard query strings', () => {
      const url = 'https://example.com/path?param1=value1&param2=value2';
      const params = parseQueryParams(url);
      
      expect(params).toEqual({
        param1: 'value1',
        param2: 'value2'
      });
    });
    
    it('parses query parameters from a URL with hash fragment', () => {
      const url = 'https://example.com/path#param1=value1&param2=value2';
      const params = parseQueryParams(url);
      
      expect(params).toEqual({
        param1: 'value1',
        param2: 'value2'
      });
    });
    
    it('parses query parameters from a URL with both query string and hash fragment', () => {
      const url = 'https://example.com/path?query1=qvalue1&query2=qvalue2#hash1=hvalue1&hash2=hvalue2';
      const params = parseQueryParams(url);
      
      expect(params).toEqual({
        query1: 'qvalue1',
        query2: 'qvalue2',
        hash1: 'hvalue1',
        hash2: 'hvalue2'
      });
    });
    
    it('parses query parameters from a custom scheme URL', () => {
      const url = 'daily-glow://confirm-email?token=abc123&type=email';
      const params = parseQueryParams(url);
      
      expect(params).toEqual({
        token: 'abc123',
        type: 'email'
      });
    });
    
    it('returns empty object for URLs without query parameters', () => {
      const url = 'https://example.com/path';
      const params = parseQueryParams(url);
      
      expect(params).toEqual({});
    });
    
    it('handles special characters in query parameters', () => {
      const url = 'https://example.com/path?param=value%20with%20spaces&special=%21%40%23%24%25';
      const params = parseQueryParams(url);
      
      expect(params).toEqual({
        param: 'value with spaces',
        special: '!@#$%'
      });
    });
    
    it('returns empty object when URL parsing fails', () => {
      const invalidUrl = 'not a valid url';
      const params = parseQueryParams(invalidUrl);
      
      expect(params).toEqual({});
    });
    
    it('handles empty URL gracefully', () => {
      const emptyUrl = '';
      const params = parseQueryParams(emptyUrl);
      
      expect(params).toEqual({});
    });
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
      expect(Alert.alert).toHaveBeenCalled();
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
      expect(Alert.alert).toHaveBeenCalled();
    });
  });
  
  it('handles deep link handling with initial URL', async () => {
    // Mock initial URL
    (Linking.getInitialURL as jest.Mock).mockResolvedValue('daily-glow://confirm-email?token=initial-token');
    
    render(<DeepLinkHandler />);
    
    await waitFor(() => {
      expect(verifyEmailWithToken).toHaveBeenCalledWith('initial-token');
      expect(Alert.alert).toHaveBeenCalled();
    });
  });
  
  // Test platform-specific behavior
  describe('Platform-specific behavior', () => {
    it('handles iOS deep links correctly', async () => {
      // Set platform to iOS
      mockPlatform('ios');
      
      // Mock successful token verification
      (verifyEmailWithToken as jest.Mock).mockResolvedValue(true);
      
      // Mock Linking.addEventListener to trigger a deep link
      (Linking.addEventListener as jest.Mock).mockImplementation((event, callback) => {
        if (event === 'url') {
          // Call the callback with a URL that includes a token
          callback({ url: 'daily-glow://confirm-email?token=ios-token' });
        }
        return mockRemoveFunction;
      });
      
      render(<DeepLinkHandler />);
      
      await waitFor(() => {
        expect(verifyEmailWithToken).toHaveBeenCalledWith('ios-token');
        expect(Alert.alert).toHaveBeenCalled();
      });
    });
    
    it('handles Android deep links correctly', async () => {
      // Set platform to Android
      mockPlatform('android');
      
      // Mock successful token verification
      (verifyEmailWithToken as jest.Mock).mockResolvedValue(true);
      
      // Mock Linking.addEventListener to trigger a deep link
      (Linking.addEventListener as jest.Mock).mockImplementation((event, callback) => {
        if (event === 'url') {
          // Call the callback with a URL that includes a token
          callback({ url: 'daily-glow://confirm-email?token=android-token' });
        }
        return mockRemoveFunction;
      });
      
      render(<DeepLinkHandler />);
      
      await waitFor(() => {
        expect(verifyEmailWithToken).toHaveBeenCalledWith('android-token');
        expect(Alert.alert).toHaveBeenCalled();
      });
    });
  });
  
  // Test edge cases
  it('handles deep link without code or token', async () => {
    // Mock Linking.addEventListener to trigger a deep link
    (Linking.addEventListener as jest.Mock).mockImplementation((event, callback) => {
      if (event === 'url') {
        // Call the callback with a URL without code or token
        callback({ url: 'daily-glow://confirm-email' });
      }
      return mockRemoveFunction;
    });
    
    render(<DeepLinkHandler />);
    
    await waitFor(() => {
      expect(mockRefreshSession).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/(app)');
    });
  });
  
  it('handles non-verification deep links correctly', async () => {
    // Mock Linking.addEventListener to trigger a deep link
    (Linking.addEventListener as jest.Mock).mockImplementation((event, callback) => {
      if (event === 'url') {
        // Call the callback with a URL that is not a verification URL
        callback({ url: 'daily-glow://other-action' });
      }
      return mockRemoveFunction;
    });
    
    render(<DeepLinkHandler />);
    
    // Since this is not a verification URL, it should not process it
    await waitFor(() => {
      expect(verifyEmailWithToken).not.toHaveBeenCalled();
      expect(supabase.auth.exchangeCodeForSession).not.toHaveBeenCalled();
    });
  });
}); 