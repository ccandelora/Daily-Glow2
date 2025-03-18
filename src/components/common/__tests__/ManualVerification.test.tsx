import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, TextInput, View, Text } from 'react-native';

// Mock Button component
const MockButton = ({ title, onPress, disabled }) => (
  <View 
    testID="button" 
    accessibilityState={{ disabled }}
    onPress={disabled ? undefined : onPress}
  >
    <Text>{title}</Text>
  </View>
);

// Mock Typography component
const MockTypography = ({ children, variant, style }) => (
  <Text>{children}</Text>
);

// Mock components
jest.mock('@/components/common', () => ({
  Button: (props) => <MockButton {...props} />,
  Typography: (props) => <MockTypography {...props} />,
}));

// Mock dependencies
const mockRefreshSession = jest.fn().mockResolvedValue(true);
const mockShowSuccess = jest.fn();
const mockShowError = jest.fn();
const mockReplace = jest.fn();

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    refreshSession: mockRefreshSession,
  }),
}));

jest.mock('@/contexts/AppStateContext', () => ({
  useAppState: () => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
  }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

// Mock utils
jest.mock('@/utils/authUtils', () => ({
  verifyEmailWithToken: jest.fn(),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

// Import the component after all mocks are set up
import { ManualVerification } from '../ManualVerification';
import { verifyEmailWithToken } from '@/utils/authUtils';

describe('ManualVerification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = render(<ManualVerification />);
    
    expect(getByText('Manual Email Verification')).toBeTruthy();
    expect(getByText("If you're having trouble with the verification link, you can manually verify your email by pasting the token from the verification link below.")).toBeTruthy();
    expect(getByPlaceholderText('Paste verification token here')).toBeTruthy();
    expect(getByText('Verify Email')).toBeTruthy();
  });

  it('shows error when trying to verify with empty token', async () => {
    const { getByText, getByTestId } = render(<ManualVerification />);
    
    // Try to press the button (this shouldn't trigger the handler because it's disabled)
    fireEvent.press(getByText('Verify Email'));
    
    // Verify that the verification function wasn't called
    expect(verifyEmailWithToken).not.toHaveBeenCalled();
  });

  it('handles successful verification', async () => {
    const { getByText, getByPlaceholderText } = render(<ManualVerification />);
    
    // Mock successful verification
    (verifyEmailWithToken as jest.Mock).mockResolvedValue(true);
    
    // Enter token and submit
    const input = getByPlaceholderText('Paste verification token here');
    fireEvent.changeText(input, 'valid-token');
    
    const verifyButton = getByText('Verify Email');
    fireEvent.press(verifyButton);
    
    await waitFor(() => {
      expect(verifyEmailWithToken).toHaveBeenCalledWith('valid-token');
      expect(mockShowSuccess).toHaveBeenCalledWith('Email verified successfully!');
      expect(mockRefreshSession).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith(
        'Verification Successful',
        'Your email has been verified successfully!',
        expect.anything()
      );
    });
  });

  it('handles failed verification', async () => {
    const { getByText, getByPlaceholderText } = render(<ManualVerification />);
    
    // Mock failed verification
    (verifyEmailWithToken as jest.Mock).mockResolvedValue(false);
    
    // Enter token and submit
    const input = getByPlaceholderText('Paste verification token here');
    fireEvent.changeText(input, 'invalid-token');
    
    const verifyButton = getByText('Verify Email');
    fireEvent.press(verifyButton);
    
    await waitFor(() => {
      expect(verifyEmailWithToken).toHaveBeenCalledWith('invalid-token');
      expect(mockShowError).toHaveBeenCalledWith('Failed to verify email. The token may be invalid or expired.');
      expect(Alert.alert).not.toHaveBeenCalled();
    });
  });

  it('handles verification error', async () => {
    const { getByText, getByPlaceholderText } = render(<ManualVerification />);
    
    // Mock error during verification
    (verifyEmailWithToken as jest.Mock).mockRejectedValue(new Error('Network error'));
    
    // Enter token and submit
    const input = getByPlaceholderText('Paste verification token here');
    fireEvent.changeText(input, 'error-token');
    
    const verifyButton = getByText('Verify Email');
    fireEvent.press(verifyButton);
    
    await waitFor(() => {
      expect(verifyEmailWithToken).toHaveBeenCalledWith('error-token');
      expect(mockShowError).toHaveBeenCalledWith('An error occurred while verifying your email');
      expect(Alert.alert).not.toHaveBeenCalled();
    });
  });
}); 