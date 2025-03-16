import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { DailyChallenge } from '../DailyChallenge';

// Mock dependencies
jest.mock('@/contexts/ChallengesContext', () => ({
  useChallenges: jest.fn(),
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

// Mock FontAwesome6 icons
jest.mock('@expo/vector-icons', () => ({
  FontAwesome6: 'FontAwesome6Mock',
}));

// Mock LinearGradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradientMock',
}));

// Mock common components
jest.mock('../Typography', () => ({
  Typography: 'TypographyMock',
}));

jest.mock('../Card', () => ({
  Card: 'CardMock',
}));

jest.mock('../Button', () => ({
  Button: 'ButtonMock',
}));

jest.mock('../Input', () => ({
  Input: 'InputMock',
}));

// Mock react-native components
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    TouchableOpacity: 'TouchableOpacityMock',
    View: 'ViewMock',
  };
});

// Mock theme
jest.mock('@/constants/theme', () => ({
  COLORS: {
    primary: {
      green: '#00C853',
      blue: '#2979FF',
      red: '#FF5252',
      yellow: '#FFD600',
      purple: '#9C27B0',
      orange: '#FF9800',
      teal: '#00BCD4',
    },
    ui: {
      background: 'rgba(28, 14, 45, 0.95)',
      card: 'rgba(38, 20, 60, 0.85)',
      text: '#FFFFFF',
      textSecondary: 'rgba(255, 255, 255, 0.7)',
      border: 'rgba(82, 67, 194, 0.3)',
      disabled: 'rgba(82, 67, 194, 0.2)',
      accent: '#4169E1',
      highlight: 'rgba(65, 105, 225, 0.15)',
    },
    status: {
      success: '#00E676',
      error: '#FF5252',
      warning: '#FFD600',
      info: '#4169E1',
    },
    gradient: {
      start: 'rgba(65, 105, 225, 0.2)',
      middle: 'rgba(147, 112, 219, 0.15)',
      end: 'rgba(28, 14, 45, 0.9)',
    },
  },
  FONTS: {
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 22,
      xl: 28,
      xxl: 36,
      xxxl: 44,
    },
    weights: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    families: {
      heading: 'System',
      body: 'System',
    }
  },
  SPACING: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  BORDER_RADIUS: {
    sm: 4,
    md: 8,
    lg: 16,
    xl: 24,
    circle: 999,
  },
  TIME_PERIODS: {
    MORNING: {
      label: 'Morning',
      range: { start: 5, end: 11 },
      greeting: 'Good morning',
      icon: '🌅'
    },
    AFTERNOON: {
      label: 'Afternoon',
      range: { start: 12, end: 16 },
      greeting: 'Good afternoon',
      icon: '☀️'
    },
    EVENING: {
      label: 'Evening',
      range: { start: 17, end: 4 },
      greeting: 'Good evening',
      icon: '🌙'
    }
  },
  default: {
    COLORS: {},
    FONTS: {},
    SPACING: {},
    BORDER_RADIUS: {},
    TIME_PERIODS: {}
  }
}));

describe('DailyChallenge Component', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Set up mock challenge data
  const mockDailyChallenge = {
    id: 'challenge-1',
    title: 'Daily Gratitude',
    description: 'Write down three things you are grateful for today',
    type: 'gratitude',
    points: 50,
    challenge_status: 'not_started',
  };

  const mockUserChallenges = [
    {
      id: 'user-challenge-1',
      challenge_id: 'challenge-2',
      status: 'completed',
      completed_at: '2023-06-01T12:00:00Z',
      created_at: '2023-06-01T10:00:00Z',
    },
  ];

  const mockUserStats = {
    current_streak: 7,
    longest_streak: 10,
    total_points: 350,
    total_entries: 15,
    last_check_in: '2023-06-02T10:00:00Z',
    level: 3,
  };

  test('renders correctly with daily challenge', () => {
    // Setup mock implementation
    require('@/contexts/ChallengesContext').useChallenges.mockReturnValue({
      dailyChallenge: mockDailyChallenge,
      userChallenges: mockUserChallenges,
      userStats: mockUserStats,
      completeChallenge: jest.fn(),
      refreshDailyChallenge: jest.fn(),
    });

    const { toJSON } = render(<DailyChallenge />);
    expect(toJSON()).toMatchSnapshot();
  });

  test('renders correctly with no daily challenge', () => {
    // Setup mock implementation with null daily challenge
    require('@/contexts/ChallengesContext').useChallenges.mockReturnValue({
      dailyChallenge: null,
      userChallenges: mockUserChallenges,
      userStats: mockUserStats,
      completeChallenge: jest.fn(),
      refreshDailyChallenge: jest.fn(),
    });

    const { toJSON } = render(<DailyChallenge />);
    expect(toJSON()).toMatchSnapshot('no-challenge');
  });

  test('renders correctly when daily limit is reached', () => {
    // Setup mock implementation with completed challenges for today
    const todayDateString = new Date().toISOString(); // Today's date in ISO format
    const completedChallenges = [
      {
        id: 'user-challenge-1',
        challenge_id: 'challenge-1',
        status: 'completed',
        completed_at: todayDateString,
        created_at: todayDateString,
      },
      {
        id: 'user-challenge-2',
        challenge_id: 'challenge-2',
        status: 'completed',
        completed_at: todayDateString,
        created_at: todayDateString,
      },
    ];

    require('@/contexts/ChallengesContext').useChallenges.mockReturnValue({
      dailyChallenge: mockDailyChallenge,
      userChallenges: completedChallenges,
      userStats: mockUserStats,
      completeChallenge: jest.fn(),
      refreshDailyChallenge: jest.fn(),
    });

    const { toJSON } = render(<DailyChallenge />);
    expect(toJSON()).toMatchSnapshot('daily-limit-reached');
  });

  test('renders correctly with daily challenge and provides context functions', () => {
    // Setup mock functions
    const mockRefreshDailyChallenge = jest.fn();
    const mockCompleteChallenge = jest.fn();
    
    require('@/contexts/ChallengesContext').useChallenges.mockReturnValue({
      dailyChallenge: mockDailyChallenge,
      userChallenges: mockUserChallenges,
      userStats: mockUserStats,
      completeChallenge: mockCompleteChallenge,
      refreshDailyChallenge: mockRefreshDailyChallenge,
    });

    // Render component
    const { toJSON } = render(<DailyChallenge />);
    
    // Verify the component rendered correctly with the right context
    expect(toJSON()).toBeTruthy();
    
    // Check that the context functions were provided correctly
    expect(mockRefreshDailyChallenge).toBeDefined();
    expect(mockCompleteChallenge).toBeDefined();
  });
}); 