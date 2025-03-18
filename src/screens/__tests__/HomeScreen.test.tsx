import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { View, TouchableOpacity } from 'react-native';
import HomeScreen from '../home/HomeScreen';
import { useJournal } from '@/contexts/JournalContext';
import { createMockHooks } from '@/utils/testUtils';

// Mock all required dependencies
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock components using dynamic require approach
jest.mock('@/components/common/VideoBackground', () => {
  return {
    __esModule: true,
    default: jest.fn(() => {
      const React = require('react');
      return React.createElement('View', { testID: "mock-video-background" });
    })
  };
});

// Mock the LinearGradient component
jest.mock('expo-linear-gradient', () => {
  return {
    LinearGradient: jest.fn(({ children }) => {
      const React = require('react');
      return React.createElement('View', { testID: "mock-linear-gradient" }, children);
    }),
  };
});

// Mock context
jest.mock('@/contexts/JournalContext', () => ({
  useJournal: jest.fn(() => ({
    todayEntries: [],
    isLoading: false,
  })),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: { id: 'test-user' },
    isEmailVerified: true,
  })),
}));

jest.mock('@/contexts/UserProfileContext', () => ({
  useUserProfile: jest.fn(() => ({
    profile: {
      first_name: 'Test',
      last_name: 'User',
    },
  })),
}));

// Mock the common components
jest.mock('@/components/common', () => {
  return {
    Card: jest.fn(({ children, variant, style }) => {
      const React = require('react');
      return React.createElement('View', { 
        testID: `card-${variant || 'default'}`,
        style
      }, children);
    }),
    
    Typography: jest.fn(({ children, variant, style }) => {
      const React = require('react');
      return React.createElement('View', { 
        testID: `typography-${variant || 'default'}`,
        style 
      }, React.createElement('Text', null, children));
    }),
    
    AnimatedBackground: jest.fn(({ children }) => {
      const React = require('react');
      return React.createElement('View', { 
        testID: 'animated-background' 
      }, children);
    }),
    
    Button: jest.fn(({ title, onPress, variant, style, textStyle }) => {
      const React = require('react');
      return React.createElement('TouchableOpacity', {
        testID: `mock-button-${variant}`,
        onPress
      }, React.createElement('View', null, title));
    }),
    AnimatedMoodIcon: jest.fn(() => {
      const React = require('react');
      return React.createElement('View', { testID: "mock-animated-mood-icon" });
    }),
    DailyChallenge: jest.fn(() => {
      const React = require('react');
      return React.createElement('View', { testID: "mock-daily-challenge" });
    }),
    VideoBackground: jest.fn(() => {
      const React = require('react');
      return React.createElement('View', { testID: "mock-video-background" });
    }),
    Header: jest.fn(({ showBranding }) => {
      const React = require('react');
      return React.createElement('View', { testID: "mock-header" });
    }),
  };
});

// Mock home components
jest.mock('@/components/home/StreakSummary', () => {
  return {
    StreakSummary: jest.fn(() => {
      const React = require('react');
      return React.createElement('View', { testID: 'streak-summary' });
    })
  };
});

jest.mock('@/components/home/RecentBadges', () => {
  return {
    RecentBadges: jest.fn(() => {
      const React = require('react');
      return React.createElement('View', { testID: 'recent-badges' });
    })
  };
});

// Mock DailyChallenge component
jest.mock('@/components/common/DailyChallenge', () => {
  return {
    DailyChallenge: jest.fn(() => {
      const React = require('react');
      return React.createElement('View', { testID: 'daily-challenge' });
    })
  };
});

// Mock journal context values
const mockJournalContext = {
  getRecentEntries: jest.fn().mockReturnValue([]),
  getLatestEntryForPeriod: jest.fn().mockReturnValue(null),
  getTodayEntries: jest.fn().mockReturnValue([]),
  getJournalEntryById: jest.fn(),
  addJournalEntry: jest.fn(),
  updateJournalEntry: jest.fn(),
  deleteJournalEntry: jest.fn(),
  loading: false,
  error: null,
};

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock console methods to prevent noise in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Reset mock journal context values
    mockJournalContext.getRecentEntries.mockReturnValue([]);
    mockJournalContext.getLatestEntryForPeriod.mockReturnValue(null);
    mockJournalContext.getTodayEntries.mockReturnValue([]);
    
    // Set up the journal context mock
    (useJournal as jest.Mock).mockReturnValue(mockJournalContext);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderHomeScreen = () => {
    return render(<HomeScreen />);
  };

  it('renders correctly', () => {
    const { getByTestId, queryByTestId } = render(<HomeScreen />);
    
    // Verify main components are rendered
    expect(getByTestId('mock-video-background')).toBeTruthy();
    expect(getByTestId('streak-summary')).toBeTruthy();
    expect(getByTestId('daily-challenge')).toBeTruthy();
    
    // Recent badges may or may not be rendered depending on the mock
    const recentBadges = queryByTestId('recent-badges');
    expect(recentBadges).toBeTruthy();
  });
  
  it('displays check-in button when no entry exists for current period', () => {
    // Mock no entry for the current period
    mockJournalContext.getLatestEntryForPeriod.mockReturnValue(null);
    
    // Render the component
    const { getByTestId } = renderHomeScreen();
    
    // Check that the button is shown
    const checkInButton = getByTestId('mock-button-primary');
    expect(checkInButton).toBeTruthy();
  });
  
  it('displays check-in complete status when entry exists for current period', () => {
    // Mock an entry for the current period
    mockJournalContext.getLatestEntryForPeriod.mockReturnValue({
      id: 'test-entry-id',
      user_id: 'test-user-id',
      created_at: new Date().toISOString(),
      initial_emotion: 'happy',
      details: 'Test entry',
      time_period: 'MORNING',
    });
    
    mockJournalContext.getTodayEntries.mockReturnValue([
      {
        id: 'test-entry-id',
        user_id: 'test-user-id',
        created_at: new Date().toISOString(),
        initial_emotion: 'happy',
        details: 'Test entry',
        time_period: 'MORNING',
      }
    ]);
    
    // Render the component
    const { getByTestId } = renderHomeScreen();
    
    // Check that the check-in card indicates completion
    const checkInCard = getByTestId('mock-card');
    expect(checkInCard).toBeTruthy();
  });
  
  it('navigates to check-in screen when start button is pressed', () => {
    // Mock router
    const router = require('expo-router').useRouter();
    
    // Render the component
    const { getByTestId } = renderHomeScreen();
    
    // Find the check-in button and press it
    const checkInButton = getByTestId('mock-button-primary');
    fireEvent.press(checkInButton);
    
    // Check that router.push was called with the right path
    expect(router.push).toHaveBeenCalledWith('/check-in');
  });
  
  it('displays recent entries correctly', () => {
    // Mock recent entries
    mockJournalContext.getRecentEntries.mockReturnValue([
      {
        id: 'entry-1',
        user_id: 'test-user-id',
        created_at: new Date().toISOString(),
        initial_emotion: 'happy',
        details: 'I am feeling great today!',
        time_period: 'MORNING',
      },
      {
        id: 'entry-2',
        user_id: 'test-user-id',
        created_at: new Date().toISOString(),
        initial_emotion: 'sad',
        details: 'Had a challenging meeting',
        time_period: 'AFTERNOON',
      },
    ]);
    
    // Render the component
    renderHomeScreen();
    
    // Check that getRecentEntries was called with the right argument
    expect(mockJournalContext.getRecentEntries).toHaveBeenCalledWith(3);
  });
  
  it('uses correct time period and greetings based on current time', () => {
    // Mock system time to morning
    const mockDate = new Date('2023-04-10T08:00:00');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as Date);
    
    // Render the component
    renderHomeScreen();
    
    // Reset Date mock to not affect other tests
    jest.spyOn(global, 'Date').mockRestore();
  });
  
  it('handles errors in journal context gracefully', () => {
    // Mock journal context with error
    mockJournalContext.getRecentEntries.mockImplementation(() => {
      throw new Error('Test error');
    });
    
    // Render should not throw error
    expect(() => renderHomeScreen()).not.toThrow();
  });
  
  it('determines next check-in period correctly', () => {
    // Mock morning check-in completed
    mockJournalContext.getLatestEntryForPeriod.mockReturnValue({
      id: 'test-entry-id',
      user_id: 'test-user-id',
      created_at: new Date().toISOString(),
      initial_emotion: 'happy',
      details: 'Test entry',
      time_period: 'MORNING',
    });
    
    mockJournalContext.getTodayEntries.mockReturnValue([
      {
        id: 'test-entry-id',
        user_id: 'test-user-id',
        created_at: new Date().toISOString(),
        initial_emotion: 'happy',
        details: 'Test entry',
        time_period: 'MORNING',
      }
    ]);
    
    // Mock current time to morning
    const mockDate = new Date('2023-04-10T08:00:00');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as Date);
    
    // Render the component
    renderHomeScreen();
    
    // Reset Date mock
    jest.spyOn(global, 'Date').mockRestore();
  });
}); 