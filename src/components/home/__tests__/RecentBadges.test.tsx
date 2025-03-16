import React from 'react';
import { render } from '@testing-library/react-native';
import { RecentBadges } from '../RecentBadges';

// Mock dependencies
jest.mock('@expo/vector-icons', () => ({
  FontAwesome6: 'FontAwesome6Mock',
}));

jest.mock('@/components/common', () => ({
  Typography: 'TypographyMock',
  Card: 'CardMock',
}));

// Mock data for testing
const mockUserBadges = [
  {
    id: 'badge1',
    badge_id: 'badge-1',
    created_at: '2023-03-01T00:00:00Z',
    badge: {
      id: 'badge-1',
      name: 'First Check-in',
      description: 'Completed your first check-in',
      category: 'beginner',
      icon: 'trophy',
    },
  },
  {
    id: 'badge2',
    badge_id: 'badge-2',
    created_at: '2023-02-01T00:00:00Z',
    badge: {
      id: 'badge-2',
      name: 'Week Streak',
      description: 'Maintained a 7-day streak',
      category: 'intermediate',
      icon: 'star',
    },
  },
  {
    id: 'badge3',
    badge_id: 'badge-3',
    created_at: '2023-01-01T00:00:00Z',
    badge: {
      id: 'badge-3',
      name: 'Emotional Range',
      description: 'Logged a wide range of emotions',
      category: 'advanced',
      icon: 'award',
    },
  },
  {
    id: 'badge4',
    badge_id: 'badge-4',
    created_at: '2022-12-01T00:00:00Z',
    badge: {
      id: 'badge-4',
      name: 'Older Badge',
      description: 'An older badge that should not appear',
      category: 'beginner',
      icon: 'star',
    },
  },
];

// Mock the useBadges hook
const mockRefreshBadges = jest.fn();
jest.mock('@/contexts/BadgeContext', () => ({
  useBadges: jest.fn(() => ({
    userBadges: mockUserBadges,
    badges: [],
    refreshBadges: mockRefreshBadges,
  })),
}));

// Mock the router
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
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

describe('RecentBadges', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls refreshBadges on mount', () => {
    render(<RecentBadges />);
    
    // Should call refreshBadges when component mounts
    expect(mockRefreshBadges).toHaveBeenCalled();
  });

  it('does not render when there are no badges', () => {
    // Override the mock to return empty badges
    const { useBadges } = require('@/contexts/BadgeContext');
    useBadges.mockReturnValueOnce({
      userBadges: [],
      badges: [],
      refreshBadges: jest.fn(),
    });
    
    const { toJSON } = render(<RecentBadges />);
    
    // Component should return null when there are no badges
    expect(toJSON()).toBeNull();
  });
}); 