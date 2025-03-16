import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { View, Linking, TouchableOpacity } from 'react-native';
import { VerificationInstructionsScreen } from '../VerificationInstructionsScreen';

// Mock the necessary dependencies
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    replace: jest.fn(),
  })),
}));

// Mock Linking
jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL: jest.fn(() => Promise.resolve()),
}));

// Mock the common components
jest.mock('@/components/common', () => ({
  Typography: ({ children, variant, style, glow, color }: any) => (
    <View testID={`typography-${variant || 'default'}`}>{children}</View>
  ),
  Button: ({ title, onPress, variant, style }: any) => (
    <TouchableOpacity testID={`button-${title}`} onPress={onPress}>
      <View>{title}</View>
    </TouchableOpacity>
  ),
  Card: ({ children, style }: any) => (
    <View testID="instructions-card">{children}</View>
  ),
  VideoBackground: () => <View testID="video-background" />,
  Logo: ({ size }: any) => <View testID={`logo-${size}`} />,
}));

// Mock LinearGradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: any) => <View testID="linear-gradient">{children}</View>,
}));

// Mock Ionicons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => <View testID="ionicons-icon" />,
}));

// Mock Auth Context
const mockResendVerificationEmail = jest.fn(() => Promise.resolve());
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: {
      email: 'test@example.com',
    },
    resendVerificationEmail: mockResendVerificationEmail,
  })),
}));

describe('VerificationInstructionsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByTestId, getByText } = render(<VerificationInstructionsScreen />);
    
    // Verify background elements are rendered
    expect(getByTestId('video-background')).toBeTruthy();
    expect(getByTestId('linear-gradient')).toBeTruthy();
    
    // Verify logo and title are rendered
    expect(getByTestId('logo-large')).toBeTruthy();
    expect(getByTestId('typography-h1')).toBeTruthy();
    
    // Verify instructions card is rendered
    expect(getByTestId('instructions-card')).toBeTruthy();
    
    // Verify all three buttons are rendered
    expect(getByText('Open Email App')).toBeTruthy();
    expect(getByText('Resend Verification Email')).toBeTruthy();
    expect(getByText('Continue to App')).toBeTruthy();
  });

  it('opens email app when "Open Email App" button is pressed', () => {
    const { getByText } = render(<VerificationInstructionsScreen />);
    
    // Find and press the open email button
    const openEmailButton = getByText('Open Email App');
    fireEvent.press(openEmailButton);
    
    // Verify Linking.openURL was called with the correct URL
    expect(Linking.openURL).toHaveBeenCalledWith('mailto:');
  });

  it('resends verification email when "Resend Verification Email" button is pressed', () => {
    const { getByText } = render(<VerificationInstructionsScreen />);
    
    // Find and press the resend button
    const resendButton = getByText('Resend Verification Email');
    fireEvent.press(resendButton);
    
    // Verify resendVerificationEmail was called with the correct email
    expect(mockResendVerificationEmail).toHaveBeenCalledWith('test@example.com');
  });

  it('navigates to app when "Continue to App" button is pressed', () => {
    const router = require('expo-router').useRouter();
    const { getByText } = render(<VerificationInstructionsScreen />);
    
    // Find and press the continue button
    const continueButton = getByText('Continue to App');
    fireEvent.press(continueButton);
    
    // Verify router.replace was called with the correct path
    expect(router.replace).toHaveBeenCalledWith('/(app)');
  });

  it('does not resend verification email when user email is missing', () => {
    // Override the mock to simulate missing email
    const useAuthMock = require('@/contexts/AuthContext').useAuth;
    useAuthMock.mockReturnValueOnce({
      user: null,
      resendVerificationEmail: mockResendVerificationEmail,
    });
    
    const { getByText } = render(<VerificationInstructionsScreen />);
    
    // Find and press the resend button
    const resendButton = getByText('Resend Verification Email');
    fireEvent.press(resendButton);
    
    // Verify resendVerificationEmail was not called
    expect(mockResendVerificationEmail).not.toHaveBeenCalled();
  });

  it('handles errors when opening email app', async () => {
    // Create a new mock implementation for this test
    const originalOpenURL = Linking.openURL;
    Linking.openURL = jest.fn(() => Promise.reject(new Error('Cannot open URL')));
    
    const { getByText } = render(<VerificationInstructionsScreen />);
    
    // Find and press the open email button
    const openEmailButton = getByText('Open Email App');
    fireEvent.press(openEmailButton);
    
    // Verify Linking.openURL was called
    expect(Linking.openURL).toHaveBeenCalledWith('mailto:');
    
    // Restore the original mock for cleanup
    Linking.openURL = originalOpenURL;
  });
}); 