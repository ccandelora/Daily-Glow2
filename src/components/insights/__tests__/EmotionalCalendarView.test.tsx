import React from 'react';
import { render } from '@testing-library/react-native';
import { EmotionalCalendarView } from '../EmotionalCalendarView';
import { JournalEntry } from '@/types';

// Mock the emotion constants
jest.mock('@/constants/emotions', () => ({
  getEmotionById: jest.fn((id: string) => {
    const emotionMap: Record<string, { id: string; label: string; color: string }> = {
      'happy': { id: 'happy', label: 'Happy', color: '#2E7D32' },
      'sad': { id: 'sad', label: 'Sad', color: '#1565C0' },
      'angry': { id: 'angry', label: 'Angry', color: '#FF5252' },
      'scared': { id: 'scared', label: 'Scared', color: '#F57F17' },
      'optimistic': { id: 'optimistic', label: 'Optimistic', color: '#388E3C' },
      'peaceful': { id: 'peaceful', label: 'Peaceful', color: '#43A047' },
      'powerful': { id: 'powerful', label: 'Powerful', color: '#4CAF50' },
      'proud': { id: 'proud', label: 'Proud', color: '#66BB6A' },
    };
    return emotionMap[id] || { id, label: id, color: '#808080' };
  }),
}));

// Mock the Typography component
jest.mock('@/components/common', () => ({
  Typography: 'TypographyMock',
}));

// Mock theme constants
jest.mock('@/constants/theme', () => ({
  COLORS: {
    primary: { green: '#00C853' },
    ui: {
      background: '#121212',
      textSecondary: 'rgba(255, 255, 255, 0.7)',
      border: 'rgba(82, 67, 194, 0.3)',
    },
  },
  SPACING: {
    xs: 4,
    sm: 8,
    md: 16,
  },
  BORDER_RADIUS: {
    sm: 4,
  },
}));

// Mock react-native components
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    View: 'ViewMock',
    StyleSheet: {
      ...RN.StyleSheet,
      create: (styles: Record<string, any>) => styles,
    },
  };
});

describe('EmotionalCalendarView', () => {
  // Set up fixed date for consistent testing
  const currentDate = new Date('2023-05-15T12:00:00Z'); // Set this to a Monday for easier testing
  const originalDate = global.Date;
  
  beforeAll(() => {
    // Mock Date.now to return our fixed date
    jest.spyOn(global.Date, 'now').mockImplementation(() => currentDate.getTime());
    
    // Store the original Date constructor
    const OriginalDate = global.Date;
    
    // Mock the Date constructor
    // @ts-ignore - Typecasting required for this complex mock
    global.Date = class extends OriginalDate {
      constructor(...args: any[]) {
        if (args.length === 0) {
          super(currentDate);
        } else {
          // @ts-ignore - We need to spread args to the parent constructor
          super(...args);
        }
      }
      
      static now() {
        return currentDate.getTime();
      }
    };
    
    // Preserve static methods
    global.Date.UTC = OriginalDate.UTC;
    global.Date.parse = OriginalDate.parse;
  });
  
  afterAll(() => {
    // Restore original Date
    global.Date = originalDate;
    jest.restoreAllMocks();
  });
  
  // Generate mock entries for testing
  const generateMockEntries = (): JournalEntry[] => {
    const entries: JournalEntry[] = [];
    
    // Create entries for the past week with different emotions
    const today = new Date(currentDate);
    
    // Entry for today (happy)
    entries.push({
      id: '1',
      date: new Date(today),
      initial_emotion: 'happy',
      emotional_shift: 2,
      time_period: 'MORNING',
    });
    
    // Entry for yesterday (sad)
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    entries.push({
      id: '2',
      date: yesterday,
      initial_emotion: 'sad',
      emotional_shift: -1,
      time_period: 'AFTERNOON',
    });
    
    // Entry for two days ago (angry)
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);
    entries.push({
      id: '3',
      date: twoDaysAgo,
      initial_emotion: 'angry',
      emotional_shift: 0,
      time_period: 'EVENING',
    });
    
    // Entry for a week ago (peaceful)
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    entries.push({
      id: '4',
      date: weekAgo,
      initial_emotion: 'peaceful',
      emotional_shift: 1,
      time_period: 'MORNING',
    });
    
    // Entry for a month ago (optimistic)
    const monthAgo = new Date(today);
    monthAgo.setDate(today.getDate() - 30);
    entries.push({
      id: '5',
      date: monthAgo,
      initial_emotion: 'optimistic',
      emotional_shift: 2,
      time_period: 'EVENING',
    });
    
    return entries;
  };
  
  it('renders weekly calendar view correctly', () => {
    const entries = generateMockEntries();
    const { toJSON } = render(<EmotionalCalendarView entries={entries} timeFilter="week" />);
    
    // Verify component structure
    expect(toJSON()).toMatchSnapshot();
  });
  
  it('renders monthly calendar view correctly', () => {
    const entries = generateMockEntries();
    const { toJSON } = render(<EmotionalCalendarView entries={entries} timeFilter="month" />);
    
    // Verify component structure
    expect(toJSON()).toMatchSnapshot();
  });
  
  it('renders all-time calendar view correctly', () => {
    const entries = generateMockEntries();
    const { toJSON } = render(<EmotionalCalendarView entries={entries} timeFilter="all" />);
    
    // Verify component structure
    expect(toJSON()).toMatchSnapshot();
  });
  
  it('handles empty entries correctly', () => {
    const { toJSON } = render(<EmotionalCalendarView entries={[]} timeFilter="week" />);
    
    // Verify component still renders with empty data
    expect(toJSON()).toMatchSnapshot();
  });
  
  it('handles entries with same date but different emotions', () => {
    const today = new Date(currentDate);
    const entries: JournalEntry[] = [
      {
        id: '1',
        date: today,
        initial_emotion: 'happy',
        emotional_shift: 2,
        time_period: 'MORNING',
      },
      {
        id: '2',
        date: today, // Same date
        initial_emotion: 'happy', // Same emotion (count should increase)
        emotional_shift: 1,
        time_period: 'AFTERNOON',
      },
      {
        id: '3',
        date: today, // Same date
        initial_emotion: 'sad', // Different emotion
        emotional_shift: -1,
        time_period: 'EVENING',
      },
    ];
    
    const { toJSON } = render(<EmotionalCalendarView entries={entries} timeFilter="week" />);
    
    // Verify component handles multiple emotions on the same day
    expect(toJSON()).toMatchSnapshot();
  });
}); 