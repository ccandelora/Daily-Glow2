import React from 'react';
import { render } from '@testing-library/react-native';
import { StreakSummary } from '../StreakSummary';

// Mock dependencies
jest.mock('@expo/vector-icons', () => ({
  FontAwesome6: 'FontAwesome6Mock',
}));

jest.mock('@/components/common', () => ({
  Typography: 'TypographyMock',
  Card: 'CardMock',
}));

// Mock the useCheckInStreak hook
jest.mock('@/contexts/CheckInStreakContext', () => ({
  useCheckInStreak: jest.fn(() => ({
    streaks: {
      morning: 5,
      afternoon: 3,
      evening: 7,
      overall: 15
    },
  })),
}));

// Mock the streak calculator utility
jest.mock('@/utils/streakCalculator', () => ({
  calculateOverallStreak: jest.fn((streaks) => {
    return streaks.overall || 15; // Default to 15 if not provided
  }),
}));

// Mock theme constants
jest.mock('@/constants/theme', () => ({
  COLORS: {
    primary: {
      red: '#FF6B6B',
      green: '#00C853',
      blue: '#2979FF',
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

// Mock the react-native components
jest.mock('react-native', () => {
  const rn = jest.requireActual('react-native');
  return {
    ...rn,
    TouchableOpacity: 'TouchableOpacityMock',
    ScrollView: 'ScrollViewMock',
    View: 'ViewMock',
  };
});

describe('StreakSummary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders streak summary with correct data', () => {
    const { toJSON } = render(<StreakSummary />);
    
    // Component should render
    expect(toJSON()).not.toBeNull();
    
    // Verify the streak calculator was called with the correct data
    const { calculateOverallStreak } = require('@/utils/streakCalculator');
    expect(calculateOverallStreak).toHaveBeenCalledWith({
      morning: 5,
      afternoon: 3,
      evening: 7,
      overall: 15
    });
  });

  it('does not render when streak is zero', () => {
    // Override the mock to return zero streak
    const { useCheckInStreak } = require('@/contexts/CheckInStreakContext');
    useCheckInStreak.mockReturnValueOnce({
      streaks: {
        morning: 0,
        afternoon: 0,
        evening: 0,
        overall: 0
      },
    });
    
    // Override the streak calculator to return zero
    const { calculateOverallStreak } = require('@/utils/streakCalculator');
    calculateOverallStreak.mockReturnValueOnce(0);
    
    const { toJSON } = render(<StreakSummary />);
    
    // Component should return null when streak is zero
    expect(toJSON()).toBeNull();
  });
}); 