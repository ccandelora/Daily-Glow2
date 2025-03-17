import React from 'react';
import { render } from '@testing-library/react-native';
import { DailyChallenge } from '../DailyChallenge';

// Mock dependencies
jest.mock('@/contexts/ChallengesContext', () => ({
  useChallenges: jest.fn().mockReturnValue({
    dailyChallenge: null,
    userStats: null,
    completeChallenge: jest.fn(),
    refreshDailyChallenge: jest.fn(),
    userChallenges: []
  }),
}));

jest.mock('@/contexts/AppStateContext', () => ({
  useAppState: jest.fn().mockReturnValue({
    showError: jest.fn(),
    showSuccess: jest.fn(),
  }),
}));

jest.mock('expo-router', () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
  }),
}));

// Mock the entire @expo/vector-icons module
jest.mock('@expo/vector-icons', () => {
  // Create a mock for FontAwesome6
  return {
    FontAwesome6: function MockFontAwesome6(props) {
      return null; // Return null for simplicity
    }
  };
});

// Mock LinearGradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: function MockLinearGradient(props) {
    return props.children; // Just return children for simplicity
  }
}));

// Mock Typography
jest.mock('../Typography', () => ({
  Typography: function MockTypography(props) {
    return null; // Return null for simplicity
  }
}));

// Mock Card
jest.mock('../Card', () => ({
  Card: function MockCard(props) {
    return props.children; // Just return children for simplicity
  }
}));

// Mock Button
jest.mock('../Button', () => ({
  Button: function MockButton(props) {
    return null; // Return null for simplicity
  }
}));

// Mock Input
jest.mock('../Input', () => ({
  Input: function MockInput(props) {
    return null; // Return null for simplicity
  }
}));

describe('DailyChallenge Component - Simple Tests', () => {
  test('renders without crashing', () => {
    // Just check that the component renders without throwing
    expect(() => render(<DailyChallenge />)).not.toThrow();
  });
}); 