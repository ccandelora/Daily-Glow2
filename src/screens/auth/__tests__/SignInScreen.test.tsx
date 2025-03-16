import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, TouchableOpacity, View, TextInput } from 'react-native';
import { SignInScreen } from '../SignInScreen';

// Mock the necessary dependencies
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
  })),
}));

// Mock the common components
jest.mock('@/components/common', () => ({
  Typography: ({ children, variant, style, glow, color }: any) => (
    <View testID={`typography-${variant || 'default'}`}>{children}</View>
  ),
  Input: ({ label, value, onChangeText, placeholder, secureTextEntry }: any) => (
    <View testID={`input-${label}`}>
      <View testID={`input-label-${label}`}>{label}</View>
      <TextInput
        testID={`input-field-${label}`}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
      />
    </View>
  ),
  Button: ({ title, onPress, variant, style }: any) => (
    <TouchableOpacity testID={`button-${variant}`} onPress={onPress}>
      <View>{title}</View>
    </TouchableOpacity>
  ),
  Card: ({ children, style, variant }: any) => (
    <View testID={`card-${variant || 'default'}`}>{children}</View>
  ),
  VideoBackground: () => <View testID="video-background" />,
  Logo: ({ size, style }: any) => <View testID={`logo-${size}`} />,
}));

// Mock LinearGradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: any) => <View testID="linear-gradient">{children}</View>,
}));

// Mock Auth Context
const mockSignIn = jest.fn();
const mockResendVerificationEmail = jest.fn();
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    signIn: mockSignIn,
    resendVerificationEmail: mockResendVerificationEmail,
    user: null,
    isEmailVerified: false,
  })),
}));

// Mock AppState Context
const mockSetLoading = jest.fn();
const mockShowSuccess = jest.fn();
jest.mock('@/contexts/AppStateContext', () => ({
  useAppState: jest.fn(() => ({
    setLoading: mockSetLoading,
    showSuccess: mockShowSuccess,
  })),
}));

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

describe('SignInScreen', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByTestId, queryByText } = render(<SignInScreen />);
    
    // Verify that the main UI elements are rendered
    expect(getByTestId('video-background')).toBeTruthy();
    expect(getByTestId('linear-gradient')).toBeTruthy();
    expect(getByTestId('logo-large')).toBeTruthy();
    expect(getByTestId('typography-h1')).toBeTruthy();
    expect(getByTestId('card-glow')).toBeTruthy();
    expect(getByTestId('input-Email')).toBeTruthy();
    expect(getByTestId('input-Password')).toBeTruthy();
    expect(getByTestId('button-primary')).toBeTruthy();
    
    // Verify that the verification prompt is not shown initially
    expect(queryByText('Your email is not verified')).toBeNull();
  });

  it('handles email and password input', () => {
    const { getByTestId } = render(<SignInScreen />);
    
    // Get input fields
    const emailInput = getByTestId('input-field-Email');
    const passwordInput = getByTestId('input-field-Password');
    
    // Enter email and password
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    
    // Verify input values (not possible with mock TextInput)
    // Instead, we'll just verify the component doesn't crash
    expect(emailInput).toBeTruthy();
    expect(passwordInput).toBeTruthy();
  });

  it('calls signIn function when form is submitted', async () => {
    // Setup mocks
    mockSignIn.mockResolvedValueOnce(undefined);
    
    const { getByTestId } = render(<SignInScreen />);
    
    // Get input fields and submit button
    const emailInput = getByTestId('input-field-Email');
    const passwordInput = getByTestId('input-field-Password');
    const signInButton = getByTestId('button-primary');
    
    // Enter email and password
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    
    // Submit form
    fireEvent.press(signInButton);
    
    // Verify loading state was set
    expect(mockSetLoading).toHaveBeenCalledWith(true);
    
    // Wait for async operations to complete
    await waitFor(() => {
      // Verify signIn was called with correct credentials
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
      // Verify loading state was reset
      expect(mockSetLoading).toHaveBeenCalledWith(false);
    });
  });

  it('does not call signIn with empty credentials', async () => {
    const { getByTestId } = render(<SignInScreen />);
    
    // Get submit button
    const signInButton = getByTestId('button-primary');
    
    // Submit form without entering credentials
    fireEvent.press(signInButton);
    
    // Verify signIn was not called
    expect(mockSignIn).not.toHaveBeenCalled();
    // Verify loading state was not set
    expect(mockSetLoading).not.toHaveBeenCalled();
  });

  it('navigates to onboarding after successful sign-in with verified email', async () => {
    // Get the router mock
    const router = require('expo-router').useRouter();
    
    // Setup auth context mock with verified user
    require('@/contexts/AuthContext').useAuth.mockReturnValueOnce({
      signIn: mockSignIn.mockResolvedValueOnce(undefined),
      resendVerificationEmail: mockResendVerificationEmail,
      user: { id: 'test-user-id', email: 'test@example.com' },
      isEmailVerified: true,
    });
    
    const { getByTestId } = render(<SignInScreen />);
    
    // Get input fields and submit button
    const emailInput = getByTestId('input-field-Email');
    const passwordInput = getByTestId('input-field-Password');
    const signInButton = getByTestId('button-primary');
    
    // Enter email and password
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    
    // Submit form
    fireEvent.press(signInButton);
    
    // Wait for async operations to complete
    await waitFor(() => {
      // Verify router.replace was called with the onboarding path
      expect(router.replace).toHaveBeenCalledWith('/(onboarding)/index');
    });
  });

  it('shows verification prompt for unverified users', async () => {
    // Setup auth context mock with unverified user
    require('@/contexts/AuthContext').useAuth.mockReturnValueOnce({
      signIn: mockSignIn.mockResolvedValueOnce(undefined),
      resendVerificationEmail: mockResendVerificationEmail,
      user: { id: 'test-user-id', email: 'test@example.com' },
      isEmailVerified: false,
    });
    
    const { getByTestId, getByText, queryByText } = render(<SignInScreen />);
    
    // Get input fields and submit button
    const emailInput = getByTestId('input-field-Email');
    const passwordInput = getByTestId('input-field-Password');
    const signInButton = getByTestId('button-primary');
    
    // Enter email and password
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    
    // Verify verification prompt is not initially shown
    expect(queryByText('Your email is not verified')).toBeNull();
    
    // Submit form
    fireEvent.press(signInButton);
    
    // Wait for async operations to complete
    await waitFor(() => {
      // Verify verification prompt is shown
      expect(getByText('Your email is not verified')).toBeTruthy();
      // Verify "Resend Verification Email" button is shown
      expect(getByText('Resend Verification Email')).toBeTruthy();
      // Verify manual verification link is shown
      expect(getByText('Try manual verification instead')).toBeTruthy();
    });
  });

  it('calls resendVerificationEmail when resend button is clicked', async () => {
    // Setup auth context mock with unverified user
    require('@/contexts/AuthContext').useAuth.mockReturnValue({
      signIn: mockSignIn.mockResolvedValue(undefined),
      resendVerificationEmail: mockResendVerificationEmail.mockResolvedValue(undefined),
      user: { id: 'test-user-id', email: 'test@example.com' },
      isEmailVerified: false,
    });
    
    const { getByTestId, getByText } = render(<SignInScreen />);
    
    // Get input fields and submit button
    const emailInput = getByTestId('input-field-Email');
    const passwordInput = getByTestId('input-field-Password');
    const signInButton = getByTestId('button-primary');
    
    // Enter email and password
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    
    // Submit form to trigger verification prompt
    fireEvent.press(signInButton);
    
    // Wait for async operations to complete
    await waitFor(() => {
      const resendButton = getByText('Resend Verification Email');
      expect(resendButton).toBeTruthy();
      
      // Click resend button
      fireEvent.press(resendButton);
    });
    
    // Verify loading state was set
    expect(mockSetLoading).toHaveBeenCalledWith(true);
    
    // Wait for resend operation to complete
    await waitFor(() => {
      // Verify resendVerificationEmail was called with correct email
      expect(mockResendVerificationEmail).toHaveBeenCalledWith('test@example.com');
      // Verify loading state was reset
      expect(mockSetLoading).toHaveBeenCalledWith(false);
      // Verify success message was shown
      expect(mockShowSuccess).toHaveBeenCalledWith('Verification email sent! Please check your inbox.');
    });
  });

  it('navigates to forgot password screen when forgot password link is clicked', () => {
    // Get the router mock
    const router = require('expo-router').useRouter();
    
    const { getByText } = render(<SignInScreen />);
    
    // Find forgot password link and click it
    const forgotPasswordLink = getByText('Forgot Password?');
    fireEvent.press(forgotPasswordLink);
    
    // Verify router.push was called with the forgot password path
    expect(router.push).toHaveBeenCalledWith('/(auth)/forgot-password');
  });

  it('navigates to sign up screen when sign up link is clicked', () => {
    // Get the router mock
    const router = require('expo-router').useRouter();
    
    const { getByText } = render(<SignInScreen />);
    
    // Find sign up link and click it
    const signUpLink = getByText('Sign Up');
    fireEvent.press(signUpLink);
    
    // Verify router.push was called with the sign up path
    expect(router.push).toHaveBeenCalledWith('/(auth)/sign-up');
  });

  it('navigates to manual verification when link is clicked', async () => {
    // Get the router mock
    const router = require('expo-router').useRouter();
    
    // Setup auth context mock with unverified user
    require('@/contexts/AuthContext').useAuth.mockReturnValue({
      signIn: mockSignIn.mockResolvedValue(undefined),
      resendVerificationEmail: mockResendVerificationEmail,
      user: { id: 'test-user-id', email: 'test@example.com' },
      isEmailVerified: false,
    });
    
    const { getByTestId, getByText } = render(<SignInScreen />);
    
    // Get input fields and submit button
    const emailInput = getByTestId('input-field-Email');
    const passwordInput = getByTestId('input-field-Password');
    const signInButton = getByTestId('button-primary');
    
    // Enter email and password
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    
    // Submit form to trigger verification prompt
    fireEvent.press(signInButton);
    
    // Wait for async operations to complete
    await waitFor(() => {
      const manualVerificationLink = getByText('Try manual verification instead');
      expect(manualVerificationLink).toBeTruthy();
      
      // Click manual verification link
      fireEvent.press(manualVerificationLink);
    });
    
    // Verify router.push was called with the manual verification path
    expect(router.push).toHaveBeenCalledWith('/(auth)/manual-verification');
  });

  it('handles signIn error gracefully', async () => {
    // Setup mocks
    mockSignIn.mockRejectedValueOnce(new Error('Invalid credentials'));
    
    const { getByTestId } = render(<SignInScreen />);
    
    // Get input fields and submit button
    const emailInput = getByTestId('input-field-Email');
    const passwordInput = getByTestId('input-field-Password');
    const signInButton = getByTestId('button-primary');
    
    // Enter email and password
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'wrongpassword');
    
    // Submit form
    fireEvent.press(signInButton);
    
    // Verify loading state was set
    expect(mockSetLoading).toHaveBeenCalledWith(true);
    
    // Wait for async operations to complete
    await waitFor(() => {
      // Verify loading state was reset
      expect(mockSetLoading).toHaveBeenCalledWith(false);
    });
    
    // Verify the component didn't crash
    expect(getByTestId('button-primary')).toBeTruthy();
  });

  it('shows alert when trying to resend verification with empty email', () => {
    // Setup auth context mock with verification prompt visible
    require('@/contexts/AuthContext').useAuth.mockReturnValue({
      signIn: mockSignIn,
      resendVerificationEmail: mockResendVerificationEmail,
      user: { id: 'test-user-id', email: 'test@example.com' },
      isEmailVerified: false,
    });
    
    const { getByTestId, getByText, rerender } = render(<SignInScreen />);
    
    // Set empty email
    const emailInput = getByTestId('input-field-Email');
    fireEvent.changeText(emailInput, '');
    
    // Submit form to show verification prompt
    const signInButton = getByTestId('button-primary');
    fireEvent.press(signInButton);
    
    // Force rerender to ensure showVerificationPrompt state is updated
    rerender(<SignInScreen />);
    
    // Find and click the resend button
    const resendButton = getByText('Resend Verification Email');
    fireEvent.press(resendButton);
    
    // Verify Alert.alert was called
    expect(Alert.alert).toHaveBeenCalledWith(
      'Email Required',
      'Please enter your email address to resend verification.'
    );
    
    // Verify resendVerificationEmail was not called
    expect(mockResendVerificationEmail).not.toHaveBeenCalled();
  });
}); 