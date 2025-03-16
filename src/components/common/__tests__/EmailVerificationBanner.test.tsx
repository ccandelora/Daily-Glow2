import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { EmailVerificationBanner } from '../EmailVerificationBanner';

// Mock the Ionicons component
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('EmailVerificationBanner', () => {
  const testEmail = 'test@example.com';
  
  it('renders correctly with email', () => {
    const { toJSON, getByText } = render(
      <EmailVerificationBanner email={testEmail} />
    );
    
    expect(getByText('Please verify your email')).toBeTruthy();
    expect(getByText(`We've sent a verification link to ${testEmail}. Please check your inbox and verify your email to unlock all features.`)).toBeTruthy();
    expect(toJSON()).toMatchSnapshot();
  });

  it('does not show resend button when onResendVerification is not provided', () => {
    const { queryByText } = render(
      <EmailVerificationBanner email={testEmail} />
    );
    
    expect(queryByText('Resend verification email')).toBeNull();
  });

  it('shows resend button when onResendVerification is provided', () => {
    const { getByText } = render(
      <EmailVerificationBanner 
        email={testEmail} 
        onResendVerification={() => {}}
      />
    );
    
    expect(getByText('Resend verification email')).toBeTruthy();
  });

  it('calls onResendVerification when resend button is pressed', () => {
    const mockResend = jest.fn();
    const { getByText } = render(
      <EmailVerificationBanner 
        email={testEmail} 
        onResendVerification={mockResend}
      />
    );
    
    fireEvent.press(getByText('Resend verification email'));
    expect(mockResend).toHaveBeenCalledTimes(1);
  });
}); 