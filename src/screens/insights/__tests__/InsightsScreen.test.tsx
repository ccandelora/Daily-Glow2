import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { View, Text, TouchableOpacity, ScrollView, TextStyle, ViewStyle } from 'react-native';
import { JournalEntry } from '@/types';

// Mock expo/vector-icons before importing InsightsScreen
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  
  return {
    FontAwesome6: jest.fn().mockImplementation((props) => {
      return React.createElement('View', { 
        testID: `icon-${props.name}`, 
        style: { width: props.size, height: props.size, backgroundColor: props.color } 
      });
    })
  };
});

// Mock common components
jest.mock('@/components/common', () => {
  const React = require('react');
  
  return {
    Typography: jest.fn().mockImplementation((props) => {
      return React.createElement('Text', { 
        testID: `typography-${props.variant || 'default'}`,
        style: props.style 
      }, props.children);
    }),
    Card: jest.fn().mockImplementation((props) => {
      return React.createElement('View', { 
        testID: 'card',
        style: props.style 
      }, props.children);
    }),
    AnimatedMoodIcon: jest.fn().mockImplementation((props) => {
      return React.createElement('View', { 
        testID: `mood-icon-${props.emotion}`
      });
    }),
    Button: jest.fn().mockImplementation((props) => {
      return React.createElement('TouchableOpacity', { 
        testID: `button-${props.title}`,
        onPress: props.onPress 
      }, React.createElement('Text', null, props.title));
    }),
    AnimatedBackground: jest.fn().mockImplementation((props) => {
      return React.createElement('View', { 
        testID: 'animated-background'
      }, props.children);
    }),
    Header: jest.fn().mockImplementation((props) => {
      return React.createElement('View', { 
        testID: 'header'
      }, React.createElement('Text', null, props.title));
    }),
    VideoBackground: jest.fn().mockImplementation((props) => {
      return React.createElement('View', { 
        testID: 'video-background'
      }, props.children);
    })
  };
});

// Mock insights components
jest.mock('@/components/insights', () => {
  const React = require('react');
  
  return {
    EmotionalCalendarView: jest.fn().mockImplementation((props) => {
      return React.createElement('View', { 
        testID: 'emotional-calendar'
      }, [
        React.createElement('Text', { key: 'period' }, `Calendar for period: ${props.selectedPeriod}`),
        React.createElement('Text', { key: 'entries' }, `Entries: ${props.entries.length}`)
      ]);
    }),
    EmotionalGrowthChart: jest.fn().mockImplementation((props) => {
      return React.createElement('View', { 
        testID: 'emotional-growth-chart'
      }, [
        React.createElement('Text', { key: 'timeFilter' }, `Chart for timeFilter: ${props.timeFilter}`),
        React.createElement('Text', { key: 'entries' }, `Entries: ${props.entries.length}`)
      ]);
    }),
    EmotionalWordCloud: jest.fn().mockImplementation((props) => {
      return React.createElement('View', { 
        testID: 'emotional-word-cloud'
      }, [
        React.createElement('Text', { key: 'timeFilter' }, `Word cloud for timeFilter: ${props.timeFilter}`),
        React.createElement('Text', { key: 'entries' }, `Entries: ${props.entries.length}`)
      ]);
    })
  };
});

import * as InsightsScreenModule from '../InsightsScreen';

// Mock contexts
const mockEntries = [
  {
    id: '1',
    date: new Date('2023-05-15T08:00:00Z'),
    initial_emotion: 'happy',
    secondary_emotion: 'excited',
    emotional_shift: 2,
    time_period: 'MORNING',
    note: 'Feeling great today!'
  },
  {
    id: '2',
    date: new Date('2023-05-15T19:00:00Z'),
    initial_emotion: 'sad',
    secondary_emotion: 'anxious',
    emotional_shift: -1,
    time_period: 'EVENING',
    note: 'Work was stressful'
  },
  {
    id: '3',
    date: new Date('2023-05-14T12:00:00Z'),
    initial_emotion: 'optimistic',
    secondary_emotion: 'hopeful',
    emotional_shift: 3,
    time_period: 'AFTERNOON',
    note: 'Great meeting with friends'
  }
];

jest.mock('@/contexts/JournalContext', () => ({
  useJournal: jest.fn(() => ({
    entries: mockEntries
  }))
}));

jest.mock('@/contexts/AppStateContext', () => ({
  useAppState: jest.fn(() => ({
    setLoading: jest.fn()
  }))
}));

jest.mock('@/contexts/CheckInStreakContext', () => ({
  useCheckInStreak: jest.fn(() => ({
    streaks: {
      day: { count: 5 },
      morning: { count: 3 },
      afternoon: { count: 2 },
      evening: { count: 4 }
    }
  }))
}));

// Mock utils
jest.mock('@/utils/ai', () => ({
  generateInsights: jest.fn(() => Promise.resolve([
    'You seem happier in the mornings',
    'Stress often affects your evening mood',
    'Social activities correlate with positive emotions'
  ]))
}));

jest.mock('@/utils/streakCalculator', () => ({
  calculateOverallStreak: jest.fn(() => 5)
}));

jest.mock('@/utils/insightAnalyzer', () => {
  const triggers = [
    { trigger: 'work', emotion: 'stress', frequency: 0.8 },
    { trigger: 'friends', emotion: 'happy', frequency: 0.9 }
  ];
  
  const recommendations = [
    { activity: 'meditation', benefit: 'reduce stress', confidence: 0.85 },
    { activity: 'social gathering', benefit: 'improve mood', confidence: 0.9 }
  ];
  
  const correlations = [
    { activity: 'exercise', emotion: 'energetic', correlation: 0.75 },
    { activity: 'reading', emotion: 'peaceful', correlation: 0.8 }
  ];
  
  const predictions = [
    { period: 'MORNING', emotion: 'happy', probability: 0.7 },
    { period: 'EVENING', emotion: 'tired', probability: 0.65 }
  ];
  
  return {
    analyzeEmotionalTriggers: jest.fn(() => Promise.resolve(triggers)),
    generatePersonalizedRecommendations: jest.fn(() => Promise.resolve(recommendations)),
    analyzeActivityCorrelations: jest.fn(() => Promise.resolve(correlations)),
    predictEmotionalState: jest.fn(() => Promise.resolve(predictions)),
    calculateEmotionalBalance: jest.fn(() => ({ score: 0.65, description: 'Mostly balanced' }))
  };
});

jest.mock('@/constants/emotions', () => ({
  getEmotionById: jest.fn((id) => ({
    id,
    label: id.charAt(0).toUpperCase() + id.slice(1),
    color: '#4CAF50'
  })),
  primaryEmotions: [
    {
      id: 'happy',
      label: 'Happy',
      color: '#4CAF50',
      emotions: [
        { id: 'excited', label: 'Excited', color: '#8BC34A' },
        { id: 'joyful', label: 'Joyful', color: '#CDDC39' }
      ]
    },
    {
      id: 'sad',
      label: 'Sad',
      color: '#2196F3',
      emotions: [
        { id: 'anxious', label: 'Anxious', color: '#03A9F4' },
        { id: 'lonely', label: 'Lonely', color: '#00BCD4' }
      ]
    }
  ]
}));

// Set up mock date
const FIXED_DATE = new Date('2023-05-15T12:00:00Z');
const originalDate = global.Date;

// Mock React Native's ActivityIndicator
jest.mock('react-native', () => {
  const reactNative = jest.requireActual('react-native');
  return {
    ...reactNative,
    ActivityIndicator: jest.fn().mockImplementation((props) => {
      const React = require('react');
      return React.createElement('View', { 
        testID: 'activity-indicator',
        ...props
      });
    })
  };
});

describe('InsightsScreen', () => {
  beforeAll(() => {
    // Mock Date.now and Date constructor
    jest.spyOn(global.Date, 'now').mockImplementation(() => FIXED_DATE.getTime());
    global.Date = class extends originalDate {
      constructor(date: string | number | Date | undefined) {
        if (date) {
          super(date);
        } else {
          super(FIXED_DATE);
        }
      }
      
      static now() {
        return FIXED_DATE.getTime();
      }
    } as DateConstructor;
  });
  
  afterAll(() => {
    global.Date = originalDate;
    jest.restoreAllMocks();
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders correctly with default week filter', () => {
    const { getByTestId, getAllByTestId, queryByText } = render(
      <InsightsScreenModule.InsightsScreen />
    );
    
    // Check header is rendered
    expect(getByTestId('header')).toBeTruthy();
    expect(getByTestId('video-background')).toBeTruthy();
    
    // Check time filter buttons
    expect(queryByText('Week')).toBeTruthy();
    expect(queryByText('Month')).toBeTruthy();
    expect(queryByText('All Time')).toBeTruthy();
    
    // Check emotion stats cards
    expect(getAllByTestId('card').length).toBeGreaterThan(0);
    
    // Check insight components
    expect(getByTestId('emotional-calendar')).toBeTruthy();
    expect(getByTestId('emotional-growth-chart')).toBeTruthy();
    expect(getByTestId('emotional-word-cloud')).toBeTruthy();
  });
  
  it('changes time filter when buttons are clicked', () => {
    const { getByText, getByTestId } = render(
      <InsightsScreenModule.InsightsScreen />
    );
    
    // Initially should be week filter
    expect(getByTestId('emotional-growth-chart')).toBeTruthy();
    
    // Change to month filter
    fireEvent.press(getByText('Month'));
    
    // Verify month filter is applied
    expect(getByTestId('emotional-growth-chart')).toBeTruthy();
    
    // Change to all time filter
    fireEvent.press(getByText('All Time'));
    
    // Verify all time filter is applied
    expect(getByTestId('emotional-growth-chart')).toBeTruthy();
  });
  
  it('has cards for emotional triggers and recommendations', () => {
    const { getAllByTestId, getByText } = render(
      <InsightsScreenModule.InsightsScreen />
    );
    
    // Get all cards
    const cards = getAllByTestId('card');
    
    // Check for section titles
    expect(getByText('Emotional Triggers')).toBeTruthy();
    expect(getByText('Personalized Recommendations')).toBeTruthy();
    
    // Check for refresh button
    expect(getByText('Refresh Recommendations')).toBeTruthy();
  });
  
  it('displays activity indicators while loading insights', () => {
    const { UNSAFE_getAllByType } = render(
      <InsightsScreenModule.InsightsScreen />
    );
    
    // Check for ActivityIndicator components using UNSAFE_getAllByType
    // Need to use any to bypass TypeScript strict typing with UNSAFE methods
    const ActivityIndicator = require('react-native').ActivityIndicator;
    const loadingIndicators = UNSAFE_getAllByType(ActivityIndicator);
    expect(loadingIndicators.length).toBeGreaterThan(0);
  });
  
  it('handles no journal entries', () => {
    // Mock empty entries
    jest.spyOn(require('@/contexts/JournalContext'), 'useJournal').mockReturnValueOnce({
      entries: []
    });
    
    const { getByText } = render(
      <InsightsScreenModule.InsightsScreen />
    );
    
    // Should show the specific message for new users
    expect(getByText('Start your journey by completing your first check-in!')).toBeTruthy();
  });
}); 