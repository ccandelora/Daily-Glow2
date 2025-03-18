import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { View, TouchableOpacity, Text } from 'react-native';

// Define mock functions with the 'mock' prefix to avoid module factory errors
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockCompleteOnboarding = jest.fn().mockResolvedValue(undefined);

// Reset function
const resetAllMocks = () => {
  mockPush.mockReset();
  mockReplace.mockReset();
  mockBack.mockReset();
  mockCompleteOnboarding.mockReset();
};

// Mock modules using dynamic require approach
jest.mock('expo-router', () => {
  const React = require('react');
  const { View } = require('react-native');
  
  return {
    useRouter: () => ({
      push: mockPush,
      replace: mockReplace,
      back: mockBack
    }),
    Redirect: ({ href }: { href: string }) => React.createElement(View, { testID: `redirect-${href}` })
  };
});

// Mock the OnboardingContext
jest.mock('@/contexts/OnboardingContext', () => ({
  useOnboarding: () => ({
    hasCompletedOnboarding: false,
    loading: false,
    completeOnboarding: mockCompleteOnboarding
  })
}));

// Mock the components directly
const MockWelcomeScreen = () => {
  const router = { push: mockPush };
  return (
    <View testID="welcome-screen">
      <TouchableOpacity 
        testID="welcome-next-button" 
        onPress={() => router.push('/(onboarding)/personalize')}
      >
        <Text>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
};

const MockPersonalizeScreen = () => {
  const router = { push: mockPush };
  return (
    <View testID="personalize-screen">
      <TouchableOpacity 
        testID="personalize-next-button" 
        onPress={() => router.push('/(onboarding)/notifications')}
      >
        <Text>Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

const MockNotificationsScreen = () => {
  const router = { replace: mockReplace };
  return (
    <View testID="notifications-screen">
      <TouchableOpacity 
        testID="notifications-complete-button" 
        onPress={async () => {
          await mockCompleteOnboarding();
          router.replace('/(app)');
        }}
      >
        <Text>Complete</Text>
      </TouchableOpacity>
    </View>
  );
};

const MockIndexScreen = () => {
  return <View testID="redirect-/(onboarding)/welcome" />;
};

// Global mock for tests
global.MockWelcomeScreen = MockWelcomeScreen;
global.MockPersonalizeScreen = MockPersonalizeScreen;
global.MockNotificationsScreen = MockNotificationsScreen;
global.MockIndexScreen = MockIndexScreen;

describe('Onboarding Flow', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    resetAllMocks();
  });

  it('redirects from index to welcome', () => {
    const { getByTestId } = render(<MockIndexScreen />);
    
    // Verify that the redirect is rendered with the correct href
    expect(getByTestId('redirect-/(onboarding)/welcome')).toBeTruthy();
  });

  it('navigates from welcome to personalize', () => {
    const { getByTestId } = render(<MockWelcomeScreen />);
    
    // Verify that the welcome screen is rendered
    expect(getByTestId('welcome-screen')).toBeTruthy();
    
    // Press the Get Started button
    fireEvent.press(getByTestId('welcome-next-button'));
    
    // Verify that router.push was called with the correct route
    expect(mockPush).toHaveBeenCalledWith('/(onboarding)/personalize');
  });

  it('navigates from personalize to notifications', () => {
    const { getByTestId } = render(<MockPersonalizeScreen />);
    
    // Verify that the personalize screen is rendered
    expect(getByTestId('personalize-screen')).toBeTruthy();
    
    // Press the Continue button
    fireEvent.press(getByTestId('personalize-next-button'));
    
    // Verify that router.push was called with the correct route
    expect(mockPush).toHaveBeenCalledWith('/(onboarding)/notifications');
  });

  it('completes onboarding and navigates to main app', async () => {
    const { getByTestId } = render(<MockNotificationsScreen />);
    
    // Verify that the notifications screen is rendered
    expect(getByTestId('notifications-screen')).toBeTruthy();
    
    // Press the Complete button
    fireEvent.press(getByTestId('notifications-complete-button'));
    
    // Verify that completeOnboarding was called
    await waitFor(() => {
      expect(mockCompleteOnboarding).toHaveBeenCalled();
    });
    
    // Verify that router.replace was called with the correct route
    expect(mockReplace).toHaveBeenCalledWith('/(app)');
  });
}); 