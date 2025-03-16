/**
 * Example of fixing SignInScreen tests using shared mock utilities
 * This example demonstrates how to use the dynamic require approach to avoid
 * the module factory error when testing React Native components
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SignInScreen from '../../screens/auth/SignInScreen';

// Mock navigation
jest.mock('@react-navigation/native', () => {
  return {
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn()
    })
  };
});

// Mock theme constants
jest.mock('../../constants/theme', () => ({
  COLORS: {
    primary: {
      green: '#4CAF50',
      blue: '#2196F3'
    },
    ui: {
      background: '#FFFFFF',
      card: '#F5F5F5',
      text: '#333333',
      error: '#FF0000'
    }
  },
  FONTS: {
    regular: 'System',
    medium: 'System-Medium',
    bold: 'System-Bold'
  },
  SIZES: {
    base: 8,
    small: 12,
    medium: 16,
    large: 24,
    extraLarge: 32
  }
}));

// Mock Typography component using shared component mocks
jest.mock('../../components/Typography', () => {
  const { createCommonComponentMocks } = require('../../__mocks__/SharedComponentMocks');
  return createCommonComponentMocks().Typography;
});

// Mock Button component using shared component mocks
jest.mock('../../components/Button', () => {
  const { createCommonComponentMocks } = require('../../__mocks__/SharedComponentMocks');
  return createCommonComponentMocks().Button;
});

// Mock Input component using shared component mocks
jest.mock('../../components/Input', () => {
  const { createCommonComponentMocks } = require('../../__mocks__/SharedComponentMocks');
  return createCommonComponentMocks().Input;
});

// Mock Card component using shared component mocks
jest.mock('../../components/Card', () => {
  const { createCommonComponentMocks } = require('../../__mocks__/SharedComponentMocks');
  return createCommonComponentMocks().Card;
});

// Mock VideoBackground component using shared component mocks
jest.mock('../../components/VideoBackground', () => {
  const { createCommonComponentMocks } = require('../../__mocks__/SharedComponentMocks');
  return createCommonComponentMocks().VideoBackground;
});

// Mock LoadingIndicator component using shared component mocks
jest.mock('../../components/LoadingIndicator', () => {
  const { createCommonComponentMocks } = require('../../__mocks__/SharedComponentMocks');
  return createCommonComponentMocks().LoadingIndicator;
});

// Mock the AuthContext using our shared ContextMocks
jest.mock('../../contexts/AuthContext', () => {
  const { createAuthContextMock } = require('../../__mocks__/ContextMocks');
  const React = require('react');
  
  // Create a default mock that can be customized in tests
  const defaultMock = createAuthContextMock({
    signIn: jest.fn().mockResolvedValue({ error: null })
  });
  
  return {
    useAuth: jest.fn(() => defaultMock),
    AuthProvider: ({ children }) => {
      return React.createElement('div', { 'data-testid': 'mock-auth-provider' }, children);
    },
    // Export mocks for test manipulation
    __mocks: {
      signIn: defaultMock.signIn,
      setIsLoading: (isLoading) => {
        defaultMock.isLoading = isLoading;
      },
      setSignInError: (error) => {
        defaultMock.signIn.mockResolvedValueOnce({ error });
      }
    }
  };
});

// Mock the AppStateContext using our shared ContextMocks
jest.mock('../../contexts/AppStateContext', () => {
  const { createAppStateMock } = require('../../__mocks__/ContextMocks');
  const React = require('react');
  
  const mockAppState = createAppStateMock();
  
  return {
    useAppState: jest.fn(() => mockAppState),
    AppStateProvider: ({ children }) => {
      return React.createElement('div', { 'data-testid': 'mock-app-state-provider' }, children);
    },
    // Export mocks for test manipulation
    __mocks: {
      showError: mockAppState.showError,
      showSuccess: mockAppState.showSuccess
    }
  };
});

describe('SignInScreen', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset navigation mocks
    const { useNavigation } = require('@react-navigation/native');
    useNavigation().navigate.mockClear();
    useNavigation().goBack.mockClear();
    
    // Reset auth mocks
    const { __mocks } = require('../../contexts/AuthContext');
    __mocks.signIn.mockClear();
    __mocks.setIsLoading(false);
    
    // Reset app state mocks
    const { __mocks: appStateMocks } = require('../../contexts/AppStateContext');
    appStateMocks.showError.mockClear();
    appStateMocks.showSuccess.mockClear();
  });
  
  test('renders correctly', () => {
    const { getByTestId, getByText } = render(<SignInScreen />);
    
    // Check that the main components are rendered
    expect(getByTestId('input-Email')).toBeTruthy();
    expect(getByTestId('input-Password')).toBeTruthy();
    expect(getByText('Sign In')).toBeTruthy();
    expect(getByText('Forgot Password?')).toBeTruthy();
    expect(getByText('Don\'t have an account? Sign Up')).toBeTruthy();
  });
  
  test('validates form before submission', () => {
    const { getByText, getByTestId } = render(<SignInScreen />);
    
    // Try to submit with empty form
    fireEvent.press(getByText('Sign In'));
    
    // Get auth mocks
    const { __mocks } = require('../../contexts/AuthContext');
    
    // Sign in should not be called without valid inputs
    expect(__mocks.signIn).not.toHaveBeenCalled();
    
    // Should show validation errors
    expect(getByTestId('input-Email').props.error).toBeTruthy();
    expect(getByTestId('input-Password').props.error).toBeTruthy();
  });
  
  test('handles sign in process successfully', async () => {
    const { getByText, getByTestId } = render(<SignInScreen />);
    
    // Fill the form
    fireEvent.changeText(getByTestId('input-field-Email'), 'test@example.com');
    fireEvent.changeText(getByTestId('input-field-Password'), 'password123');
    
    // Submit the form
    fireEvent.press(getByText('Sign In'));
    
    // Get auth mocks
    const { __mocks } = require('../../contexts/AuthContext');
    
    // Wait for the sign in process to complete
    await waitFor(() => {
      expect(__mocks.signIn).toHaveBeenCalled();
    });
    
    // Verify it was called with the right parameters
    expect(__mocks.signIn).toHaveBeenCalledWith('test@example.com', 'password123');
    
    // Get navigation mock
    const { useNavigation } = require('@react-navigation/native');
    
    // Check navigation after successful sign in
    // Note: The actual navigation logic might be different in your app
    expect(useNavigation().navigate).toHaveBeenCalled();
  });
  
  test('handles sign in errors', async () => {
    // Set up auth mock to return an error
    const { __mocks } = require('../../contexts/AuthContext');
    __mocks.setSignInError({ message: 'Invalid credentials' });
    
    const { getByText, getByTestId } = render(<SignInScreen />);
    
    // Fill the form
    fireEvent.changeText(getByTestId('input-field-Email'), 'test@example.com');
    fireEvent.changeText(getByTestId('input-field-Password'), 'wrong-password');
    
    // Submit the form
    fireEvent.press(getByText('Sign In'));
    
    // Wait for the sign in process to complete
    await waitFor(() => {
      expect(__mocks.signIn).toHaveBeenCalled();
    });
    
    // Get app state mocks
    const { __mocks: appStateMocks } = require('../../contexts/AppStateContext');
    
    // Verify that the error was shown to the user
    expect(appStateMocks.showError).toHaveBeenCalledWith('Invalid credentials');
    
    // Verify that we did not navigate
    const { useNavigation } = require('@react-navigation/native');
    expect(useNavigation().navigate).not.toHaveBeenCalled();
  });
  
  test('navigates to sign up screen', () => {
    const { getByText } = render(<SignInScreen />);
    
    // Press the sign up link
    fireEvent.press(getByText('Don\'t have an account? Sign Up'));
    
    // Get navigation mock
    const { useNavigation } = require('@react-navigation/native');
    
    // Verify that we navigated to sign up
    expect(useNavigation().navigate).toHaveBeenCalledWith('SignUp');
  });
  
  test('navigates to forgot password screen', () => {
    const { getByText } = render(<SignInScreen />);
    
    // Press the forgot password link
    fireEvent.press(getByText('Forgot Password?'));
    
    // Get navigation mock
    const { useNavigation } = require('@react-navigation/native');
    
    // Verify that we navigated to forgot password
    expect(useNavigation().navigate).toHaveBeenCalledWith('ForgotPassword');
  });
}); 