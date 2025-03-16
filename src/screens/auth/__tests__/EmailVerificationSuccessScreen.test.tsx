import React from 'react';
import { render, fireEvent, waitFor, act, RenderAPI } from '@testing-library/react-native';
import { View, TouchableOpacity } from 'react-native';
import { EmailVerificationSuccessScreen } from '../EmailVerificationSuccessScreen';

// Mock console.error to avoid cluttering test output
const originalConsoleError = console.error;
console.error = jest.fn();

// Mock console.log 
const originalConsoleLog = console.log;
console.log = jest.fn();

// Restore console methods after all tests
afterAll(() => {
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
});

// Mock the necessary dependencies
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    replace: jest.fn(),
    push: jest.fn(),
  })),
}));

// Mock the common components
jest.mock('@/components/common', () => ({
  Typography: ({ children, variant, style, glow }: any) => (
    <View testID={`typography-${variant || 'default'}`}>{children}</View>
  ),
  Button: ({ title, onPress, variant, style }: any) => (
    <TouchableOpacity testID={`button-${title}`} onPress={onPress}>
      <View>{title}</View>
    </TouchableOpacity>
  ),
  VideoBackground: () => <View testID="video-background" />,
  Logo: ({ size }: any) => <View testID={`logo-${size}`} />,
}));

// Mock LinearGradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: any) => <View testID="linear-gradient">{children}</View>,
}));

// Mock Auth Context with different states for different tests
const mockRefreshSession = jest.fn();
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    refreshSession: mockRefreshSession,
    user: { email: 'test@example.com' }
  })),
}));

describe('EmailVerificationSuccessScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state initially', () => {
    // Mock refreshSession to return a promise that doesn't resolve immediately
    mockRefreshSession.mockImplementation(() => new Promise(() => {}));
    
    const { getByText, getByTestId } = render(<EmailVerificationSuccessScreen />);
    
    // Verify loading state is shown
    expect(getByText('Verifying Email...')).toBeTruthy();
    expect(getByText('Please wait while we verify your email address.')).toBeTruthy();
    
    // Verify that refreshSession was called
    expect(mockRefreshSession).toHaveBeenCalled();
  });

  it('shows success state when email is verified', async () => {
    // Mock refreshSession to return a verified response
    mockRefreshSession.mockResolvedValue({ isVerified: true, session: {} });
    
    const rendered = render(<EmailVerificationSuccessScreen />);
    
    // Wait for the verification process to complete
    await waitFor(() => {
      expect(rendered.getByText('Email Verified!')).toBeTruthy();
      expect(rendered.getByText('Thank you for verifying your email. You now have full access to all features of Daily Glow.')).toBeTruthy();
      expect(rendered.getByTestId('button-Continue to App')).toBeTruthy();
    });
  });

  it('shows error state when verification fails', async () => {
    // Mock refreshSession to return a not verified response
    mockRefreshSession.mockResolvedValue({ isVerified: false, session: {} });
    
    const rendered = render(<EmailVerificationSuccessScreen />);
    
    // Wait for the verification process to complete
    await waitFor(() => {
      expect(rendered.getByText('Verification Issue')).toBeTruthy();
      expect(rendered.getByTestId('button-Try Manual Verification')).toBeTruthy();
      expect(rendered.getByTestId('button-Try Again')).toBeTruthy();
      expect(rendered.getByTestId('button-Continue to App')).toBeTruthy();
    });
  });

  it('handles exceptions during verification', async () => {
    // Mock refreshSession to throw an error
    mockRefreshSession.mockRejectedValue(new Error('Network error'));
    
    const rendered = render(<EmailVerificationSuccessScreen />);
    
    // Wait for the verification process to complete
    await waitFor(() => {
      expect(rendered.getByText('Verification Issue')).toBeTruthy();
      expect(console.error).toHaveBeenCalled();
    });
  });

  it('navigates to app when Continue button is pressed', async () => {
    // Mock refreshSession to return success
    mockRefreshSession.mockResolvedValue({ isVerified: true, session: {} });
    
    const router = require('expo-router').useRouter();
    
    const rendered = render(<EmailVerificationSuccessScreen />);
    
    // Wait for the success state to be shown
    await waitFor(() => {
      expect(rendered.getByTestId('button-Continue to App')).toBeTruthy();
    });
    
    // Press the continue button
    fireEvent.press(rendered.getByTestId('button-Continue to App'));
    
    // Verify navigation
    expect(router.replace).toHaveBeenCalledWith('/(app)');
  });

  it('retries verification when Try Again button is pressed', async () => {
    // First call fails, second succeeds
    mockRefreshSession
      .mockResolvedValueOnce({ isVerified: false, session: {} })
      .mockResolvedValueOnce({ isVerified: true, session: {} });
    
    const rendered = render(<EmailVerificationSuccessScreen />);
    
    // Wait for the error state to be shown
    await waitFor(() => {
      expect(rendered.getByTestId('button-Try Again')).toBeTruthy();
    });
    
    // Clear previous calls count
    mockRefreshSession.mockClear();
    
    // Press the retry button
    fireEvent.press(rendered.getByTestId('button-Try Again'));
    
    // Verify refreshSession was called again
    expect(mockRefreshSession).toHaveBeenCalled();
    
    // Verify success state is shown after retry
    await waitFor(() => {
      expect(rendered.getByText('Email Verified!')).toBeTruthy();
    });
  });

  it('navigates to manual verification when Manual Verification button is pressed', async () => {
    // Mock refreshSession to return error
    mockRefreshSession.mockResolvedValue({ isVerified: false, session: {} });
    
    const router = require('expo-router').useRouter();
    
    const rendered = render(<EmailVerificationSuccessScreen />);
    
    // Wait for the error state to be shown
    await waitFor(() => {
      expect(rendered.getByTestId('button-Try Manual Verification')).toBeTruthy();
    });
    
    // Press the manual verification button
    fireEvent.press(rendered.getByTestId('button-Try Manual Verification'));
    
    // Verify navigation
    expect(router.push).toHaveBeenCalledWith('/(auth)/manual-verification');
  });
}); 