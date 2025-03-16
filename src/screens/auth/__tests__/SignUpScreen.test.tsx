import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Platform, TouchableOpacity, View, TextInput } from 'react-native';
import { SignUpScreen } from '../SignUpScreen';

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
const mockSignUp = jest.fn();
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    signUp: mockSignUp,
  })),
}));

// Mock AppState Context
const mockSetLoading = jest.fn();
const mockShowError = jest.fn();
jest.mock('@/contexts/AppStateContext', () => ({
  useAppState: jest.fn(() => ({
    setLoading: mockSetLoading,
    showError: mockShowError,
  })),
}));

// Mock Platform
const originalPlatform = { ...Platform };
beforeAll(() => {
  Platform.OS = 'ios'; // Default to iOS for tests
});

afterAll(() => {
  Platform.OS = originalPlatform.OS; // Restore original platform
});

describe('SignUpScreen', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByTestId, getByText } = render(<SignUpScreen />);
    
    // Verify that the main UI elements are rendered
    expect(getByTestId('video-background')).toBeTruthy();
    expect(getByTestId('linear-gradient')).toBeTruthy();
    expect(getByTestId('logo-large')).toBeTruthy();
    expect(getByTestId('typography-h1')).toBeTruthy();
    expect(getByTestId('card-glow')).toBeTruthy();
    expect(getByTestId('input-Email')).toBeTruthy();
    expect(getByTestId('input-Password')).toBeTruthy();
    expect(getByTestId('input-Confirm Password')).toBeTruthy();
    expect(getByTestId('button-primary')).toBeTruthy();
    
    // Verify the verification note is shown
    expect(getByText("You'll need to verify your email address before accessing all features.")).toBeTruthy();
  });

  it('handles email and password input', () => {
    const { getByTestId } = render(<SignUpScreen />);
    
    // Get input fields
    const emailInput = getByTestId('input-field-Email');
    const passwordInput = getByTestId('input-field-Password');
    const confirmPasswordInput = getByTestId('input-field-Confirm Password');
    
    // Enter values in the input fields
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.changeText(confirmPasswordInput, 'password123');
    
    // Verify the component doesn't crash
    expect(emailInput).toBeTruthy();
    expect(passwordInput).toBeTruthy();
    expect(confirmPasswordInput).toBeTruthy();
  });

  it('shows error when form fields are empty', () => {
    const { getByTestId } = render(<SignUpScreen />);
    
    // Get sign up button and press it without filling the form
    const signUpButton = getByTestId('button-primary');
    fireEvent.press(signUpButton);
    
    // Verify error message is shown
    expect(mockShowError).toHaveBeenCalledWith('Please fill in all fields');
    
    // Verify signUp function was not called
    expect(mockSignUp).not.toHaveBeenCalled();
    // Verify loading state was not set
    expect(mockSetLoading).not.toHaveBeenCalled();
  });

  it('shows error when passwords do not match', () => {
    const { getByTestId } = render(<SignUpScreen />);
    
    // Get input fields and sign up button
    const emailInput = getByTestId('input-field-Email');
    const passwordInput = getByTestId('input-field-Password');
    const confirmPasswordInput = getByTestId('input-field-Confirm Password');
    const signUpButton = getByTestId('button-primary');
    
    // Enter values with mismatching passwords
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.changeText(confirmPasswordInput, 'different123');
    
    // Submit form
    fireEvent.press(signUpButton);
    
    // Verify error message is shown
    expect(mockShowError).toHaveBeenCalledWith('Passwords do not match');
    
    // Verify signUp function was not called
    expect(mockSignUp).not.toHaveBeenCalled();
    // Verify loading state was not set
    expect(mockSetLoading).not.toHaveBeenCalled();
  });

  it('shows error when password is too short', () => {
    const { getByTestId } = render(<SignUpScreen />);
    
    // Get input fields and sign up button
    const emailInput = getByTestId('input-field-Email');
    const passwordInput = getByTestId('input-field-Password');
    const confirmPasswordInput = getByTestId('input-field-Confirm Password');
    const signUpButton = getByTestId('button-primary');
    
    // Enter values with short password
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'pass');
    fireEvent.changeText(confirmPasswordInput, 'pass');
    
    // Submit form
    fireEvent.press(signUpButton);
    
    // Verify error message is shown
    expect(mockShowError).toHaveBeenCalledWith('Password must be at least 6 characters');
    
    // Verify signUp function was not called
    expect(mockSignUp).not.toHaveBeenCalled();
    // Verify loading state was not set
    expect(mockSetLoading).not.toHaveBeenCalled();
  });

  it('calls signUp function and navigates on mobile when form is valid', async () => {
    // Set platform to mobile
    Platform.OS = 'ios';
    
    // Get the router mock
    const router = require('expo-router').useRouter();
    
    // Setup mock for signUp
    mockSignUp.mockResolvedValueOnce(undefined);
    
    const { getByTestId } = render(<SignUpScreen />);
    
    // Get input fields and sign up button
    const emailInput = getByTestId('input-field-Email');
    const passwordInput = getByTestId('input-field-Password');
    const confirmPasswordInput = getByTestId('input-field-Confirm Password');
    const signUpButton = getByTestId('button-primary');
    
    // Enter valid form data
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.changeText(confirmPasswordInput, 'password123');
    
    // Submit form
    fireEvent.press(signUpButton);
    
    // Verify loading state was set
    expect(mockSetLoading).toHaveBeenCalledWith(true);
    
    // Wait for async operations to complete
    await waitFor(() => {
      // Verify signUp was called with correct credentials
      expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'password123');
      
      // Verify loading state was reset
      expect(mockSetLoading).toHaveBeenCalledWith(false);
      
      // Verify navigation to app screen
      expect(router.replace).toHaveBeenCalledWith('/(app)');
    });
  });

  it('calls signUp function and navigates on web when form is valid', async () => {
    // Set platform to web
    Platform.OS = 'web';
    
    // Get the router mock
    const router = require('expo-router').useRouter();
    
    // Setup mock for signUp
    mockSignUp.mockResolvedValueOnce(undefined);
    
    const { getByTestId } = render(<SignUpScreen />);
    
    // Get input fields and sign up button
    const emailInput = getByTestId('input-field-Email');
    const passwordInput = getByTestId('input-field-Password');
    const confirmPasswordInput = getByTestId('input-field-Confirm Password');
    const signUpButton = getByTestId('button-primary');
    
    // Enter valid form data
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.changeText(confirmPasswordInput, 'password123');
    
    // Submit form
    fireEvent.press(signUpButton);
    
    // Wait for async operations to complete
    await waitFor(() => {
      // Verify navigation to app screen
      expect(router.replace).toHaveBeenCalledWith('/(app)');
    });
  });

  it('handles error during sign up', async () => {
    // Mock signUp to throw an error
    mockSignUp.mockRejectedValueOnce(new Error('Email already in use'));
    
    const { getByTestId } = render(<SignUpScreen />);
    
    // Get input fields and sign up button
    const emailInput = getByTestId('input-field-Email');
    const passwordInput = getByTestId('input-field-Password');
    const confirmPasswordInput = getByTestId('input-field-Confirm Password');
    const signUpButton = getByTestId('button-primary');
    
    // Enter valid form data
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.changeText(confirmPasswordInput, 'password123');
    
    // Submit form
    fireEvent.press(signUpButton);
    
    // Verify loading state was set
    expect(mockSetLoading).toHaveBeenCalledWith(true);
    
    // Wait for async operations to complete
    await waitFor(() => {
      // Verify loading state was reset
      expect(mockSetLoading).toHaveBeenCalledWith(false);
      
      // Verify the component didn't crash
      expect(getByTestId('button-primary')).toBeTruthy();
    });
  });

  it('navigates to sign in screen when sign in link is clicked', () => {
    // Get the router mock
    const router = require('expo-router').useRouter();
    
    const { getByText } = render(<SignUpScreen />);
    
    // Find sign in link and click it
    const signInLink = getByText('Sign In');
    fireEvent.press(signInLink);
    
    // Verify router.push was called with the sign in path
    expect(router.push).toHaveBeenCalledWith('/(auth)/sign-in');
  });
}); 