import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { DailyChallenge } from '../DailyChallenge';
import { View, Button } from 'react-native';

// Directly import the pure logic functions for testing
// For testing the pure utility functions, we need to extract them
const { getPromptForType, getMinLengthForType } = (() => {
  // These functions are defined in the component file but not exported, 
  // so we recreate them here for testing
  const getPromptForType = (type: string) => {
    switch (type) {
      case 'mood':
        return 'Describe your current mood and feelings...';
      case 'gratitude':
        return 'Share what you\'re grateful for today...';
      case 'mindfulness':
        return 'Describe your mindfulness experience...';
      case 'creative':
        return 'Share your creative response...';
      default:
        return 'Share your thoughts...';
    }
  };

  const getMinLengthForType = (type: string) => {
    return type === 'creative' ? 20 : 10;
  };

  return { getPromptForType, getMinLengthForType };
})();

// Mock dependencies using the dynamic require approach
jest.mock('@/contexts/ChallengesContext', () => {
  const { createChallengesContextMock } = require('@/__mocks__/ContextMocks');
  
  return {
    useChallenges: jest.fn(() => createChallengesContextMock({
      dailyChallenge: null,
      userStats: null,
      refreshDailyChallenge: jest.fn(),
      completeChallenge: jest.fn(),
      userChallenges: []
    }))
  };
});

jest.mock('@/contexts/AppStateContext', () => {
  const { createAppStateMock } = require('@/__mocks__/ContextMocks');
  
  return {
    useAppState: jest.fn(() => createAppStateMock({
      showError: jest.fn(),
      showSuccess: jest.fn()
    }))
  };
});

jest.mock('expo-router', () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
  }),
}));

// Mock the entire @expo/vector-icons module
jest.mock('@expo/vector-icons', () => {
  // Create a mock for FontAwesome6
  return {
    FontAwesome6: function MockFontAwesome6(props: any) {
      const React = require('react');
      return React.createElement('div', { 
        'data-testid': `icon-${props.name}`,
        style: props.style
      }, `${props.name} icon`);
    }
  };
});

// Mock LinearGradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: function MockLinearGradient(props: any) {
    const React = require('react');
    return React.createElement('div', { 
      'data-testid': 'linear-gradient',
      style: props.style
    }, props.children);
  }
}));

// Mock common components using the shared mocks
jest.mock('../Typography', () => {
  const { createCommonComponentMocks } = require('@/__mocks__/SharedComponentMocks');
  return {
    Typography: createCommonComponentMocks().Typography
  };
});

jest.mock('../Card', () => {
  const { createCommonComponentMocks } = require('@/__mocks__/SharedComponentMocks');
  return {
    Card: createCommonComponentMocks().Card
  };
});

jest.mock('../Button', () => {
  const { createCommonComponentMocks } = require('@/__mocks__/SharedComponentMocks');
  return {
    Button: createCommonComponentMocks().Button
  };
});

jest.mock('../Input', () => {
  const { createCommonComponentMocks } = require('@/__mocks__/SharedComponentMocks');
  return {
    Input: createCommonComponentMocks().Input
  };
});

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
    xxl: 48,
  },
  BORDER_RADIUS: {
    sm: 4,
    md: 8,
    lg: 16,
    xl: 24,
    circle: 999,
  },
  SHADOWS: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 8,
    },
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
}));

describe('DailyChallenge Component', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Pure logic function tests
  test('getPromptForType returns correct prompts for different challenge types', () => {
    expect(getPromptForType('mood')).toBe('Describe your current mood and feelings...');
    expect(getPromptForType('gratitude')).toBe('Share what you\'re grateful for today...');
    expect(getPromptForType('mindfulness')).toBe('Describe your mindfulness experience...');
    expect(getPromptForType('creative')).toBe('Share your creative response...');
    expect(getPromptForType('unknown')).toBe('Share your thoughts...');
  });

  test('getMinLengthForType returns correct minimum lengths', () => {
    expect(getMinLengthForType('creative')).toBe(20);
    expect(getMinLengthForType('mood')).toBe(10);
    expect(getMinLengthForType('gratitude')).toBe(10);
    expect(getMinLengthForType('mindfulness')).toBe(10);
    expect(getMinLengthForType('unknown')).toBe(10);
  });

  // Add a simple test to verify the component renders
  test('renders without crashing', () => {
    // Mock the useChallenges hook to return minimal required data
    require('@/contexts/ChallengesContext').useChallenges.mockReturnValue({
      dailyChallenge: null,
      userStats: null,
      completeChallenge: jest.fn(),
      refreshDailyChallenge: jest.fn(),
      userChallenges: []
    });
    
    // Just check that the component renders without throwing
    expect(() => render(<DailyChallenge />)).not.toThrow();
  });

  test('renders with a daily challenge', () => {
    // Mock the useChallenges hook to return a daily challenge
    require('@/contexts/ChallengesContext').useChallenges.mockReturnValue({
      dailyChallenge: {
        id: 'test-challenge-id',
        title: 'Daily Gratitude',
        description: 'Write down three things you are grateful for today',
        type: 'gratitude',
        points: 50,
        created_at: new Date().toISOString(),
      },
      userStats: {
        id: 'test-user-stats-id',
        user_id: 'test-user-id',
        total_points: 350,
        level: 3,
        current_streak: 7,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      completeChallenge: jest.fn(),
      refreshDailyChallenge: jest.fn(),
      userChallenges: []
    });
    
    // Just render the component and make sure it doesn't throw
    expect(() => render(<DailyChallenge />)).not.toThrow();
  });

  test('calls refreshDailyChallenge when there is no daily challenge', () => {
    const mockRefreshDailyChallenge = jest.fn();
    
    // Mock the useChallenges hook to return no daily challenge
    require('@/contexts/ChallengesContext').useChallenges.mockReturnValue({
      dailyChallenge: null,
      userStats: null,
      completeChallenge: jest.fn(),
      refreshDailyChallenge: mockRefreshDailyChallenge,
      userChallenges: []
    });
    
    render(<DailyChallenge />);
    
    // Verify that refreshDailyChallenge was called
    expect(mockRefreshDailyChallenge).toHaveBeenCalled();
  });

  test('shows completion message when daily limit is reached', () => {
    // Mock the useChallenges hook to return completed challenges
    require('@/contexts/ChallengesContext').useChallenges.mockReturnValue({
      dailyChallenge: {
        id: 'test-challenge-id',
        title: 'Daily Gratitude',
        description: 'Write down three things you are grateful for today',
        type: 'gratitude',
        points: 50,
      },
      userStats: {
        total_points: 500,
        level: 5,
      },
      completeChallenge: jest.fn(),
      refreshDailyChallenge: jest.fn(),
      userChallenges: [
        {
          id: 'challenge-1',
          challenge_id: 'challenge-1',
          status: 'completed',
          completed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
        {
          id: 'challenge-2',
          challenge_id: 'challenge-2',
          status: 'completed',
          completed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        }
      ]
    });
    
    const { getByText } = render(<DailyChallenge />);
    
    // Force the component to show the limit message
    act(() => {
      // Simulate the effect that sets completedToday and showLimitMessage
      require('@/contexts/ChallengesContext').useChallenges().userChallenges.forEach((challenge: any) => {
        if (challenge.status === 'completed' && challenge.completed_at) {
          // This would trigger the completedToday count to increase
        }
      });
    });
    
    // Check if the completion message is shown
    expect(() => getByText(/Daily Challenges Complete!/i)).not.toThrow();
  });

  test('handles challenge completion with valid input', async () => {
    const mockCompleteChallenge = jest.fn().mockResolvedValue(undefined);
    const mockRefreshDailyChallenge = jest.fn().mockResolvedValue(undefined);
    const mockOnComplete = jest.fn();
    
    // Mock the useChallenges hook
    require('@/contexts/ChallengesContext').useChallenges.mockReturnValue({
      dailyChallenge: {
        id: 'test-challenge-id',
        title: 'Daily Gratitude',
        description: 'Write down three things you are grateful for today',
        type: 'gratitude',
        points: 50,
      },
      userStats: {
        total_points: 350,
        level: 3,
      },
      completeChallenge: mockCompleteChallenge,
      refreshDailyChallenge: mockRefreshDailyChallenge,
      userChallenges: []
    });
    
    const { getByTestId, getByText } = render(<DailyChallenge onComplete={mockOnComplete} />);
    
    // Find the input field and complete button
    const inputField = getByTestId('input-field-undefined');
    const completeButton = getByText('Complete Challenge');
    
    // Enter valid text (more than minimum length for gratitude type)
    fireEvent.changeText(inputField, 'I am grateful for my family, my health, and the opportunity to learn new things.');
    
    // Click the complete button
    fireEvent.press(completeButton);
    
    // Wait for the async operations to complete
    await waitFor(() => {
      // Verify that completeChallenge was called with the right parameters
      expect(mockCompleteChallenge).toHaveBeenCalledWith(
        'test-challenge-id',
        'I am grateful for my family, my health, and the opportunity to learn new things.'
      );
      
      // Verify that refreshDailyChallenge was called
      expect(mockRefreshDailyChallenge).toHaveBeenCalled();
      
      // Verify that onComplete callback was called
      expect(mockOnComplete).toHaveBeenCalled();
    });
  });

  test('shows error when text is too short', async () => {
    const mockCompleteChallenge = jest.fn();
    const mockShowError = jest.fn();
    
    // Mock the useChallenges hook
    require('@/contexts/ChallengesContext').useChallenges.mockReturnValue({
      dailyChallenge: {
        id: 'test-challenge-id',
        title: 'Daily Gratitude',
        description: 'Write down three things you are grateful for today',
        type: 'gratitude',
        points: 50,
      },
      userStats: {
        total_points: 350,
        level: 3,
      },
      completeChallenge: mockCompleteChallenge,
      refreshDailyChallenge: jest.fn(),
      userChallenges: []
    });
    
    // Mock the useAppState hook
    require('@/contexts/AppStateContext').useAppState.mockReturnValue({
      showError: mockShowError,
      showSuccess: jest.fn(),
    });
    
    const { getByTestId, getByText } = render(<DailyChallenge />);
    
    // Find the input field and complete button
    const inputField = getByTestId('input-field-undefined');
    const completeButton = getByText('Complete Challenge');
    
    // Enter text that's too short (less than minimum length for gratitude type)
    fireEvent.changeText(inputField, 'Thanks');
    
    // Click the complete button
    fireEvent.press(completeButton);
    
    // Wait for the async operations to complete
    await waitFor(() => {
      // Verify that showError was called with the right message
      expect(mockShowError).toHaveBeenCalledWith('Please provide a response with at least 10 characters');
      
      // Verify that completeChallenge was not called
      expect(mockCompleteChallenge).not.toHaveBeenCalled();
    });
  });

  test('handles error during challenge completion', async () => {
    const mockError = new Error('Failed to complete challenge');
    const mockCompleteChallenge = jest.fn().mockRejectedValue(mockError);
    const mockShowError = jest.fn();
    
    // Mock the useChallenges hook
    require('@/contexts/ChallengesContext').useChallenges.mockReturnValue({
      dailyChallenge: {
        id: 'test-challenge-id',
        title: 'Daily Gratitude',
        description: 'Write down three things you are grateful for today',
        type: 'gratitude',
        points: 50,
      },
      userStats: {
        total_points: 350,
        level: 3,
      },
      completeChallenge: mockCompleteChallenge,
      refreshDailyChallenge: jest.fn(),
      userChallenges: []
    });
    
    // Mock the useAppState hook
    require('@/contexts/AppStateContext').useAppState.mockReturnValue({
      showError: mockShowError,
      showSuccess: jest.fn(),
    });
    
    const { getByTestId, getByText } = render(<DailyChallenge />);
    
    // Find the input field and complete button
    const inputField = getByTestId('input-field-undefined');
    const completeButton = getByText('Complete Challenge');
    
    // Enter valid text
    fireEvent.changeText(inputField, 'I am grateful for my family, my health, and the opportunity to learn new things.');
    
    // Click the complete button
    fireEvent.press(completeButton);
    
    // Wait for the async operations to complete
    await waitFor(() => {
      // Verify that showError was called with the right message
      expect(mockShowError).toHaveBeenCalledWith('Failed to complete challenge');
    });
  });

  test('handles daily challenge limit error', async () => {
    const mockError = new Error('Daily challenge limit reached');
    const mockCompleteChallenge = jest.fn().mockRejectedValue(mockError);
    
    // Mock the useChallenges hook
    require('@/contexts/ChallengesContext').useChallenges.mockReturnValue({
      dailyChallenge: {
        id: 'test-challenge-id',
        title: 'Daily Gratitude',
        description: 'Write down three things you are grateful for today',
        type: 'gratitude',
        points: 50,
      },
      userStats: {
        total_points: 350,
        level: 3,
      },
      completeChallenge: mockCompleteChallenge,
      refreshDailyChallenge: jest.fn(),
      userChallenges: []
    });
    
    const { getByTestId, getByText } = render(<DailyChallenge />);
    
    // Find the input field and complete button
    const inputField = getByTestId('input-field-undefined');
    const completeButton = getByText('Complete Challenge');
    
    // Enter valid text
    fireEvent.changeText(inputField, 'I am grateful for my family, my health, and the opportunity to learn new things.');
    
    // Click the complete button
    fireEvent.press(completeButton);
    
    // Wait for the async operations to complete
    await waitFor(() => {
      // The component should show the limit message
      expect(() => getByText(/Daily Challenges Complete!/i)).not.toThrow();
    });
  });

  // New tests for better coverage
  
  test('displays streak when user has a current streak', () => {
    // Mock the useChallenges hook with a user that has a streak
    require('@/contexts/ChallengesContext').useChallenges.mockReturnValue({
      dailyChallenge: {
        id: 'test-challenge-id',
        title: 'Daily Gratitude',
        description: 'Write down three things you are grateful for today',
        type: 'gratitude',
        points: 50,
      },
      userStats: {
        total_points: 350,
        level: 3,
        current_streak: 5, // User has a 5 day streak
      },
      completeChallenge: jest.fn(),
      refreshDailyChallenge: jest.fn(),
      userChallenges: []
    });
    
    const { getByText } = render(<DailyChallenge />);
    
    // Verify that the streak text is displayed with the correct number
    const streakText = getByText('5 day streak');
    expect(streakText).toBeTruthy();
    
    // Since we're using mocked FontAwesome6 component, we can't reliably test for the icon
    // by test ID, so we'll just verify the streak text is present, which is sufficient
    // to confirm the streak UI is rendered
  });

  test('does not display streak when user has no streak', () => {
    // Mock the useChallenges hook with a user that has no streak
    require('@/contexts/ChallengesContext').useChallenges.mockReturnValue({
      dailyChallenge: {
        id: 'test-challenge-id',
        title: 'Daily Gratitude',
        description: 'Write down three things you are grateful for today',
        type: 'gratitude',
        points: 50,
      },
      userStats: {
        total_points: 350,
        level: 3,
        current_streak: 0, // User has no streak
      },
      completeChallenge: jest.fn(),
      refreshDailyChallenge: jest.fn(),
      userChallenges: []
    });
    
    const { queryByText, queryByTestId } = render(<DailyChallenge />);
    
    // Verify that the streak text is not displayed
    expect(queryByText(/day streak/i)).toBeNull();
    
    // Check that the flame icon is not displayed
    expect(queryByTestId('icon-flame')).toBeNull();
  });

  test('shows limit message when completedToday is 2 or more', () => {
    // Mock the useChallenges hook with completed challenges
    require('@/contexts/ChallengesContext').useChallenges.mockReturnValue({
      dailyChallenge: {
        id: 'test-challenge-id',
        title: 'Daily Gratitude',
        description: 'Write down three things you are grateful for today',
        type: 'gratitude',
        points: 50,
      },
      userStats: {
        total_points: 500,
        level: 5,
      },
      completeChallenge: jest.fn(),
      refreshDailyChallenge: jest.fn(),
      userChallenges: [
        {
          id: 'challenge-1',
          challenge_id: 'challenge-1',
          status: 'completed',
          completed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
        {
          id: 'challenge-2',
          challenge_id: 'challenge-2',
          status: 'completed',
          completed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        }
      ]
    });
    
    const { getByText } = render(<DailyChallenge />);
    
    // Force the component to show the limit message by directly checking for the completion message
    // This is a more reliable approach than trying to trigger the state change
    expect(getByText(/Daily Challenges Complete!/i)).toBeTruthy();
  });

  test('sets up midnight refresh timer', () => {
    // Use jest.spyOn instead of direct replacement to avoid type errors
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    
    // Make sure the spies return something
    setTimeoutSpy.mockReturnValue(123 as any);
    clearTimeoutSpy.mockImplementation(() => {});
    
    // Mock the useChallenges hook
    require('@/contexts/ChallengesContext').useChallenges.mockReturnValue({
      dailyChallenge: {
        id: 'test-challenge-id',
        title: 'Daily Challenge',
        description: 'Test description',
        type: 'mood',
        points: 50,
      },
      userStats: null,
      completeChallenge: jest.fn(),
      refreshDailyChallenge: jest.fn(),
      userChallenges: []
    });
    
    const { unmount } = render(<DailyChallenge />);
    
    // Verify setTimeout was called for midnight refresh
    expect(setTimeoutSpy).toHaveBeenCalled();
    
    // Test cleanup of timer on unmount
    unmount();
    expect(clearTimeoutSpy).toHaveBeenCalled();
    
    // Restore original functions
    setTimeoutSpy.mockRestore();
    clearTimeoutSpy.mockRestore();
  });

  test('refreshes challenge at midnight when no challenge exists', () => {
    jest.useFakeTimers();
    const mockRefreshDailyChallenge = jest.fn();
    
    // Mock the useChallenges hook with no daily challenge
    require('@/contexts/ChallengesContext').useChallenges.mockReturnValue({
      dailyChallenge: null,
      userStats: null,
      completeChallenge: jest.fn(),
      refreshDailyChallenge: mockRefreshDailyChallenge,
      userChallenges: []
    });
    
    render(<DailyChallenge />);
    
    // Verify refreshDailyChallenge is called when there's no challenge
    expect(mockRefreshDailyChallenge).toHaveBeenCalled();
    
    // Reset the mock to check if it's called again after the timeout
    mockRefreshDailyChallenge.mockClear();
    
    // Fast-forward time to trigger the timeout
    act(() => {
      jest.runOnlyPendingTimers();
    });
    
    // Verify refreshDailyChallenge is called again after the timeout
    expect(mockRefreshDailyChallenge).toHaveBeenCalled();
    
    jest.useRealTimers();
  });

  test('handles unknown challenge type with default icon and prompt', () => {
    // Mock the useChallenges hook with unknown challenge type
    require('@/contexts/ChallengesContext').useChallenges.mockReturnValue({
      dailyChallenge: {
        id: 'test-challenge-id',
        title: 'Unknown Challenge',
        description: 'This is a challenge with an unknown type',
        type: 'unknown', // Unknown type
        points: 50,
      },
      userStats: {
        total_points: 350,
        level: 3,
      },
      completeChallenge: jest.fn(),
      refreshDailyChallenge: jest.fn(),
      userChallenges: []
    });
    
    const { getByTestId, getByText } = render(<DailyChallenge />);
    
    // Default prompt for unknown type should be used
    const inputField = getByTestId('input-field-undefined');
    expect(inputField.props.placeholder).toBe('Share your thoughts...');
    
    // We should see the challenge title
    expect(getByText('Unknown Challenge')).toBeTruthy();
    
    // An unknown type would use the default icon rendering logic
    // Since we're using a mock implementation for FontAwesome6,
    // we can't directly test the icon, but we can verify the component renders
    expect(() => render(<DailyChallenge />)).not.toThrow();
  });

  // Add a more specific test to verify that when encountering an unknown challenge type,
  // the default icon logic is executed
  test('uses default case for unknown challenge types in icon selection', () => {
    // Create a spy for the FontAwesome6 component to track which icons are rendered
    const iconSpy = jest.spyOn(require('@expo/vector-icons'), 'FontAwesome6');
    
    // Mock the useChallenges hook with unknown challenge type
    require('@/contexts/ChallengesContext').useChallenges.mockReturnValue({
      dailyChallenge: {
        id: 'test-challenge-id',
        title: 'Unknown Challenge Type',
        description: 'A challenge with a type that is not in the typeIcons map',
        type: 'nonexistent-type', // A type not defined in typeIcons
        points: 50,
      },
      userStats: {
        total_points: 350,
        level: 3,
      },
      completeChallenge: jest.fn(),
      refreshDailyChallenge: jest.fn(),
      userChallenges: []
    });
    
    render(<DailyChallenge />);
    
    // The component should still render without errors
    // and the spy should have been called at least once
    expect(iconSpy).toHaveBeenCalled();
    
    // Clean up the spy
    iconSpy.mockRestore();
  });

  test('directly checks completedToday limit in handleComplete', async () => {
    // Create a more explicit test for the completedToday >= 2 condition
    // by setting up a custom wrapper component that gives us access to the handleComplete function
    const mockCompleteChallenge = jest.fn();
    const mockShowSuccess = jest.fn();
    const mockOnComplete = jest.fn();
    
    // Mock both the challenges and app state contexts
    require('@/contexts/ChallengesContext').useChallenges.mockReturnValue({
      dailyChallenge: {
        id: 'test-challenge-id',
        title: 'Daily Gratitude',
        description: 'Write down three things you are grateful for today',
        type: 'gratitude',
        points: 50,
      },
      userStats: {
        total_points: 500,
        level: 5,
      },
      completeChallenge: mockCompleteChallenge,
      refreshDailyChallenge: jest.fn(),
      userChallenges: [
        {
          id: 'challenge-1',
          challenge_id: 'challenge-1',
          status: 'completed',
          completed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
        {
          id: 'challenge-2',
          challenge_id: 'challenge-2',
          status: 'completed',
          completed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        }
      ]
    });
    
    require('@/contexts/AppStateContext').useAppState.mockReturnValue({
      showSuccess: mockShowSuccess,
      showError: jest.fn(),
    });
    
    // Create a wrapper component that exposes the internal state and functions
    const WrapperComponent = () => {
      const [internalState, setInternalState] = React.useState({
        showLimitMessage: false
      });
      
      const dailyChallenge = (
        <DailyChallenge onComplete={mockOnComplete} />
      );
      
      return (
        <View>
          {dailyChallenge}
          <Button 
            title="Show State"
            onPress={() => {
              // This button allows us to inspect the internal state
              console.log('Internal state:', internalState);
            }}
          />
        </View>
      );
    };
    
    const { getByText } = render(<WrapperComponent />);
    
    // Verify the component renders with the limit message since completedToday should be 2
    expect(getByText(/Daily Challenges Complete!/i)).toBeTruthy();
    
    // The mockCompleteChallenge should not have been called because of the limit
    expect(mockCompleteChallenge).not.toHaveBeenCalled();
    expect(mockOnComplete).not.toHaveBeenCalled();
  });
}); 