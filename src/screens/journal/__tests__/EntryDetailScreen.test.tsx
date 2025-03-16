import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { View, TouchableOpacity, Animated } from 'react-native';
import { EntryDetailScreen } from '../EntryDetailScreen';

// Mock Animated
jest.mock('react-native/Libraries/Animated/Animated', () => {
  const ActualAnimated = jest.requireActual('react-native/Libraries/Animated/Animated');
  return {
    ...ActualAnimated,
    timing: jest.fn(() => ({
      start: jest.fn(callback => callback && callback()),
    })),
    spring: jest.fn(() => ({
      start: jest.fn(callback => callback && callback()),
    })),
    parallel: jest.fn(() => ({
      start: jest.fn(callback => callback && callback()),
    })),
    Value: jest.fn(() => ({
      interpolate: jest.fn(),
      setValue: jest.fn(),
    })),
  };
});

// Mock dependencies
const mockRouterBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    back: mockRouterBack,
  })),
  useLocalSearchParams: jest.fn(() => ({
    id: 'test-entry-id',
  })),
}));

// Mock emotions
const mockEmotions = [
  { id: 'happy', label: 'Happy', color: '#FFDE7D', category: 'joy' },
  { id: 'excited', label: 'Excited', color: '#FFC107', category: 'joy' },
  { id: 'calm', label: 'Calm', color: '#81D4FA', category: 'peace' },
  { id: 'sad', label: 'Sad', color: '#90CAF9', category: 'sadness' },
];

// Mock getEmotionById implementation
const mockGetEmotionById = (id) => {
  return mockEmotions.find(e => e.id === id);
};

jest.mock('@/constants/emotions', () => ({
  getEmotionById: jest.fn(id => mockGetEmotionById(id)),
  getAllEmotions: jest.fn(() => mockEmotions),
}));

// Mock entry data
const mockEntry = {
  id: 'test-entry-id',
  date: new Date('2023-05-15T10:00:00'),
  time_period: 'MORNING',
  initial_emotion: 'happy',
  secondary_emotion: 'excited',
  emotional_shift: 0.2,
  gratitude: 'I am grateful for my health',
  note: 'Today is a good day',
  user_id: 'user1',
  created_at: '2023-05-15T10:00:00',
};

// Mock JournalContext
jest.mock('@/contexts/JournalContext', () => ({
  useJournal: jest.fn(() => ({
    entries: [mockEntry],
  })),
}));

// Mock common components
jest.mock('@/components/common', () => ({
  Typography: ({ children, variant, style, glow }: any) => (
    <View testID={`typography-${variant || 'default'}`}>{children}</View>
  ),
  Card: ({ children, style, variant }: any) => (
    <View testID={`card-${variant || 'default'}`}>{children}</View>
  ),
  Button: ({ title, onPress, variant, style }: any) => (
    <TouchableOpacity testID={`button-${title}`} onPress={onPress}>
      <View>{title}</View>
    </TouchableOpacity>
  ),
  VideoBackground: () => <View testID="video-background" />,
}));

// Mock theme
jest.mock('@/constants/theme', () => ({
  COLORS: {
    ui: {
      background: '#121212',
      card: '#1E1E1E',
      text: '#FFFFFF',
      accent: '#6200EE',
    },
  },
  SPACING: {
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
}));

// Console spy for debugging elements in tests
const originalConsoleLog = console.log;

describe('EntryDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Silence debug logs
    console.log = jest.fn();
  });

  afterAll(() => {
    // Restore console.log
    console.log = originalConsoleLog;
  });

  it('renders entry details correctly', () => {
    const { getByTestId, getAllByTestId } = render(<EntryDetailScreen />);
    
    // Check that basic elements are rendered
    expect(getByTestId('video-background')).toBeTruthy();
    
    // Check for back button
    expect(getByTestId('button-← Back')).toBeTruthy();
    
    // Check for entry details sections
    const cards = getAllByTestId('card-glow');
    expect(cards.length).toBe(4); // Initial emotion, Secondary emotion, Gratitude, Notes
    
    // Check that emotion badges are rendered
    expect(getByTestId('emotion-badge-initial')).toBeTruthy();
    expect(getByTestId('emotion-badge-secondary')).toBeTruthy();
  });

  it('navigates back when back button is clicked', () => {
    const { getByTestId } = render(<EntryDetailScreen />);
    
    // Find and press the back button
    const backButton = getByTestId('button-← Back');
    fireEvent.press(backButton);
    
    // Check that router.back was called
    expect(mockRouterBack).toHaveBeenCalled();
  });

  it('handles case when entry is not found', () => {
    // Mock useJournal to return no matching entry
    require('@/contexts/JournalContext').useJournal.mockReturnValueOnce({
      entries: [],
    });
    
    const { getByText, getByTestId } = render(<EntryDetailScreen />);
    
    // Should show error message
    expect(getByText('Entry not found')).toBeTruthy();
    
    // Should have Go Back button
    expect(getByTestId('button-Go Back')).toBeTruthy();
  });

  it('handles case when emotion data is invalid', () => {
    // Mock getEmotionById to return null for one emotion
    require('@/constants/emotions').getEmotionById.mockImplementation((id) => {
      if (id === 'happy') return null;
      return mockEmotions.find(e => e.id === id);
    });
    
    const { getByText, getByTestId } = render(<EntryDetailScreen />);
    
    // Should show error message
    expect(getByText('Invalid emotion data')).toBeTruthy();
    
    // Should have Go Back button
    expect(getByTestId('button-Go Back')).toBeTruthy();
  });

  it('renders note section when note is present', () => {
    const { getAllByTestId } = render(<EntryDetailScreen />);
    
    // Get all cards
    const cards = getAllByTestId('card-glow');
    
    // Fourth card should be the note
    expect(cards[3]).toBeTruthy();
  });

  it('does not render note section when note is absent', () => {
    // Mock entry without a note
    const entryWithoutNote = {
      ...mockEntry,
      note: undefined,
    };
    
    // Mock useJournal to return entry without note
    require('@/contexts/JournalContext').useJournal.mockReturnValueOnce({
      entries: [entryWithoutNote],
    });
    
    const { getAllByTestId } = render(<EntryDetailScreen />);
    
    // Should only have 3 cards (no note card)
    const cards = getAllByTestId('card-glow');
    expect(cards.length).toBe(3);
  });

  it('renders correct date formatting', () => {
    const { getByTestId } = render(<EntryDetailScreen />);
    
    // Title should have weekday
    const title = getByTestId('typography-h1');
    expect(title.props.children).toBe('Monday');
    
    // Subtitle should have full date
    const subtitle = getByTestId('typography-h3');
    expect(subtitle.props.children).toBe('May 15, 2023');
  });

  it('renders emotional shift indicator correctly', () => {
    const { getByTestId } = render(<EntryDetailScreen />);
    
    // Check that emotional shift indicator is rendered
    expect(getByTestId('emotional-shift-indicator')).toBeTruthy();
  });

  it('handles different entry ID from search params', () => {
    // Mock different entry ID
    require('expo-router').useLocalSearchParams.mockReturnValueOnce({
      id: 'different-id',
    });
    
    // Add another entry
    const anotherEntry = {
      id: 'different-id',
      date: new Date('2023-05-16T16:00:00'),
      time_period: 'AFTERNOON',
      initial_emotion: 'calm',
      secondary_emotion: 'sad',
      emotional_shift: -0.1,
      gratitude: 'I am grateful for this test',
      note: 'Another test',
      user_id: 'user1',
      created_at: '2023-05-16T16:00:00',
    };
    
    // Mock useJournal to return both entries
    require('@/contexts/JournalContext').useJournal.mockReturnValueOnce({
      entries: [mockEntry, anotherEntry],
    });
    
    const { getByTestId } = render(<EntryDetailScreen />);
    
    // Title should have Tuesday (the new entry is on May 16)
    const title = getByTestId('typography-h1');
    expect(title.props.children).toBe('Tuesday');
  });
}); 