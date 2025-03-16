import React from 'react';
import { render } from '@testing-library/react-native';
import { EmotionalWordCloud } from '@/components/insights/EmotionalWordCloud';
import { Text, View } from 'react-native';

// Suppress console logs during tests
const originalConsoleLog = console.log;
beforeAll(() => {
  console.log = jest.fn();
});
afterAll(() => {
  console.log = originalConsoleLog;
});

// Mock dependencies
jest.mock('@/constants/emotions', () => ({
  getEmotionById: jest.fn((id: string) => {
    const emotions: Record<string, { color: string; name: string }> = {
      'happy': { color: '#FFD700', name: 'Happy' },
      'peaceful': { color: '#90EE90', name: 'Peaceful' },
      'optimistic': { color: '#87CEEB', name: 'Optimistic' },
      'powerful': { color: '#FF6347', name: 'Powerful' },
      'sad': { color: '#6495ED', name: 'Sad' },
      'scared': { color: '#9370DB', name: 'Scared' },
    };
    return emotions[id] || { color: '#FFFFFF', name: 'Unknown' };
  }),
}));

jest.mock('@/constants/theme', () => ({
  COLORS: {
    ui: {
      text: '#000000',
      textSecondary: '#666666',
    },
  },
  SPACING: {
    md: 16,
  },
}));

// Define the JournalEntry type to match the component's expected type
type JournalEntry = {
  id: string;
  date: Date;
  initial_emotion: string;
  emotional_shift: number;
  time_period: 'MORNING' | 'AFTERNOON' | 'EVENING';
  note?: string;
};

describe('EmotionalWordCloud', () => {
  it('renders correctly with journal entries', () => {
    const sampleEntries: JournalEntry[] = [
      {
        id: '1',
        date: new Date(),
        initial_emotion: 'happy',
        emotional_shift: 1,
        time_period: 'MORNING',
        note: 'Today was a great day with family and friends. I felt really happy and energized.',
      },
      {
        id: '2',
        date: new Date(),
        initial_emotion: 'peaceful',
        emotional_shift: 0,
        time_period: 'EVENING',
        note: 'Spent some quiet time reading and relaxing. Very peaceful evening.',
      },
    ];

    const { UNSAFE_getAllByType } = render(
      <EmotionalWordCloud entries={sampleEntries} width={320} height={200} />
    );

    // Get all Text components (words)
    const words = UNSAFE_getAllByType(Text);
    
    // Should have some words
    expect(words.length).toBeGreaterThan(0);
    
    // Check that words have the expected style properties
    words.forEach(word => {
      // The style is an array with the base style and the specific style
      const wordStyle = word.props.style[1]; // The specific style is at index 1
      expect(wordStyle).toHaveProperty('fontSize');
      expect(wordStyle).toHaveProperty('color');
      expect(wordStyle).toHaveProperty('left');
      expect(wordStyle).toHaveProperty('top');
      expect(wordStyle).toHaveProperty('transform');
      expect(wordStyle).toHaveProperty('opacity');
    });
  });

  it('renders sample data when no entries are provided', () => {
    const { UNSAFE_getAllByType } = render(
      <EmotionalWordCloud entries={[]} width={320} height={200} />
    );

    // Get all Text components (words)
    const words = UNSAFE_getAllByType(Text);
    
    // Should have sample words
    expect(words.length).toBeGreaterThan(0);
  });

  it('renders entries with short notes using sample data', () => {
    const entriesWithShortNotes: JournalEntry[] = [
      {
        id: '1',
        date: new Date(),
        initial_emotion: 'happy',
        emotional_shift: 1,
        time_period: 'MORNING',
        note: 'Hi', // Too short
      },
    ];

    const { UNSAFE_getAllByType } = render(
      <EmotionalWordCloud entries={entriesWithShortNotes} width={320} height={200} />
    );

    // Get all Text components (words)
    const words = UNSAFE_getAllByType(Text);
    
    // Should have sample words since the note is too short
    expect(words.length).toBeGreaterThan(0);
  });

  it('handles different dimensions correctly', () => {
    const { toJSON } = render(
      <EmotionalWordCloud entries={[]} width={500} height={400} />
    );

    const component = toJSON();
    expect(component).not.toBeNull();
    
    // The container style is an array with the base style and the specific dimensions
    const containerStyle = component.props.style;
    expect(containerStyle[1]).toHaveProperty('width', 500);
    expect(containerStyle[1]).toHaveProperty('height', 400);
  });
}); 