import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import ProfileScreen from '../ProfileScreen';
import { Alert } from 'react-native';

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation(() => null);

// Mock dependencies
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/contexts/AppStateContext', () => ({
  useAppState: jest.fn(),
}));

// Mock common components using dynamic requires to avoid module factory error
jest.mock('@/components/common', () => {
  // Dynamic requires inside the factory function - THIS IS THE KEY FIX
  const React = require('react');
  const { Text, View, TouchableOpacity } = require('react-native');
  
  return {
    Typography: jest.fn(({ children, testID, variant, style, ...props }) => 
      React.createElement(Text, { 
        testID: testID || `typography-${variant || 'default'}`, 
        style, 
        ...props 
      }, children)
    ),
    Card: jest.fn(({ children, testID, style, ...props }) => 
      React.createElement(View, { 
        testID: testID || 'card', 
        style, 
        ...props 
      }, children)
    ),
    Button: jest.fn(({ title, onPress, variant, testID, style, ...props }) => 
      React.createElement(TouchableOpacity, { 
        testID: testID || `button-${title.replace(/\s+/g, '-').toLowerCase()}`,
        onPress,
        accessibilityRole: "button",
        style,
        ...props
      }, React.createElement(Text, null, title))
    ),
    Header: jest.fn(() => 
      React.createElement(View, { testID: "header" })
    ),
    VideoBackground: jest.fn(() => 
      React.createElement(View, { testID: "video-background" })
    ),
    EmailVerificationBanner: jest.fn(({ email, onResendVerification }) => 
      React.createElement(TouchableOpacity, { 
        testID: "email-verification-banner",
        onPress: onResendVerification
      }, React.createElement(Text, null, `Email Verification for ${email}`))
    ),
  };
});

// Mock theme
jest.mock('@/constants/theme', () => ({
  COLORS: {
    ui: {
      background: '#000',
      text: '#FFF',
      textSecondary: '#AAA',
      accent: '#4169E1',
    },
    primary: {
      green: '#00C853',
      blue: '#2979FF',
    },
  },
  SPACING: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  FONTS: {
    sizes: {
      xl: 28,
    },
    weights: {
      bold: '700',
    },
  },
}));

// Mock assets
jest.mock('@/assets/default_transparent_353x345.png', () => 'mocked-logo.png');

describe('ProfileScreen', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with verified user', () => {
    // Setup auth mock
    const mockSignOut = jest.fn();
    require('@/contexts/AuthContext').useAuth.mockReturnValue({
      user: {
        email: 'test@example.com',
      },
      isEmailVerified: true,
      signOut: mockSignOut,
      resendVerificationEmail: jest.fn(),
    });

    // Setup app state mock
    require('@/contexts/AppStateContext').useAppState.mockReturnValue({
      showError: jest.fn(),
    });

    // Render component
    const { queryByTestId } = render(<ProfileScreen />);
    
    // Email verification banner should not be present for verified users
    expect(queryByTestId('email-verification-banner')).toBeNull();
    
    // Profile components should be present
    expect(queryByTestId('button-edit-profile')).not.toBeNull();
    expect(queryByTestId('button-log-out')).not.toBeNull();
  });

  it('renders with unverified user and shows verification banner', () => {
    // Setup auth mock for unverified user
    const mockResendVerification = jest.fn();
    require('@/contexts/AuthContext').useAuth.mockReturnValue({
      user: {
        email: 'test@example.com',
      },
      isEmailVerified: false,
      signOut: jest.fn(),
      resendVerificationEmail: mockResendVerification,
    });

    // Setup app state mock
    require('@/contexts/AppStateContext').useAppState.mockReturnValue({
      showError: jest.fn(),
    });

    // Render component
    const { queryByTestId } = render(<ProfileScreen />);
    
    // Email verification banner should be present for unverified users
    expect(queryByTestId('email-verification-banner')).not.toBeNull();
  });

  it('calls signOut when Log Out button is pressed', async () => {
    // Setup mock for signOut
    const mockSignOut = jest.fn().mockResolvedValue(undefined);
    
    // Setup auth mock
    require('@/contexts/AuthContext').useAuth.mockReturnValue({
      user: {
        email: 'test@example.com',
      },
      isEmailVerified: true,
      signOut: mockSignOut,
      resendVerificationEmail: jest.fn(),
    });

    // Setup app state mock
    require('@/contexts/AppStateContext').useAppState.mockReturnValue({
      showError: jest.fn(),
    });

    // Render component
    const { getByTestId } = render(<ProfileScreen />);
    
    // Find and press Log Out button
    const logOutButton = getByTestId('button-log-out');
    fireEvent.press(logOutButton);
    
    // Verify signOut was called
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('handles signOut error', async () => {
    // Setup mock for signOut that throws an error
    const mockSignOut = jest.fn().mockRejectedValue(new Error('Sign out failed'));
    
    // Setup auth mock
    require('@/contexts/AuthContext').useAuth.mockReturnValue({
      user: {
        email: 'test@example.com',
      },
      isEmailVerified: true,
      signOut: mockSignOut,
      resendVerificationEmail: jest.fn(),
    });

    // Setup app state mock with showError mock
    const mockShowError = jest.fn();
    require('@/contexts/AppStateContext').useAppState.mockReturnValue({
      showError: mockShowError,
    });

    // Render component
    const { getByTestId } = render(<ProfileScreen />);
    
    // Find and press Log Out button
    const logOutButton = getByTestId('button-log-out');
    await act(async () => {
      fireEvent.press(logOutButton);
    });
    
    // Verify showError was called with the correct message
    expect(mockShowError).toHaveBeenCalledWith('Failed to log out');
  });

  it('toggles editing mode when Edit Profile button is pressed', () => {
    // Setup auth mock
    require('@/contexts/AuthContext').useAuth.mockReturnValue({
      user: {
        email: 'test@example.com',
      },
      isEmailVerified: true,
      signOut: jest.fn(),
      resendVerificationEmail: jest.fn(),
    });

    // Setup app state mock
    require('@/contexts/AppStateContext').useAppState.mockReturnValue({
      showError: jest.fn(),
    });

    // Render component
    const { getByTestId, queryByTestId } = render(<ProfileScreen />);
    
    // Find and press Edit Profile button
    const editButton = getByTestId('button-edit-profile');
    fireEvent.press(editButton);
    
    // Should now have Save and Cancel buttons
    expect(queryByTestId('button-save')).not.toBeNull();
    expect(queryByTestId('button-cancel')).not.toBeNull();
    expect(queryByTestId('button-edit-profile')).toBeNull();
  });

  it('triggers resend verification email when banner is pressed', async () => {
    // Setup mock for resend verification
    const mockResendVerification = jest.fn().mockResolvedValue(undefined);
    
    // Setup auth mock for unverified user
    require('@/contexts/AuthContext').useAuth.mockReturnValue({
      user: {
        email: 'test@example.com',
      },
      isEmailVerified: false,
      signOut: jest.fn(),
      resendVerificationEmail: mockResendVerification,
    });

    // Setup app state mock
    require('@/contexts/AppStateContext').useAppState.mockReturnValue({
      showError: jest.fn(),
    });

    // Render component
    const { getByTestId } = render(<ProfileScreen />);
    
    // Find verification banner and trigger resend
    const banner = getByTestId('email-verification-banner');
    fireEvent.press(banner);
    
    // Verify resendVerificationEmail was called with correct email
    expect(mockResendVerification).toHaveBeenCalledWith('test@example.com');
  });
}); 