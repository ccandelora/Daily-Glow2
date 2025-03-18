import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { View } from 'react-native';
import { EntryDetailScreen } from '../EntryDetailScreen';

// Import mocks from separate files
import { 
  Typography, 
  Card, 
  Button, 
  VideoBackground 
} from './__mocks__/ComponentMocks';

import { 
  mockJournalEntries,
  setupJournalContextMock,
  mockRouterBack,
  setupRouterMock,
  setupSearchParamsMock
} from './__mocks__/ContextMocks';

import {
  mockEmotions,
  mockGetEmotionById,
  mockGetAllEmotions,
  mockColors,
  mockSpacing
} from './__mocks__/UtilityMocks';

import { setupAnimatedMocks } from './__mocks__/AnimationMocks';

// Setup mocks for external dependencies
jest.mock('react-native/Libraries/Animated/Animated', () => setupAnimatedMocks());

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    back: mockRouterBack,
  })),
  useLocalSearchParams: jest.fn(() => setupSearchParamsMock()),
}));

// Mock emotions
jest.mock('@/constants/emotions', () => ({
  getEmotionById: jest.fn(id => mockGetEmotionById(id)),
  getAllEmotions: jest.fn(() => mockGetAllEmotions()),
}));

// Entry for testing
const mockEntry = mockJournalEntries[0];

// Mock JournalContext
jest.mock('@/contexts/JournalContext', () => ({
  useJournal: jest.fn(() => setupJournalContextMock({
    entries: [mockEntry]
  })),
}));

// Mock common components
jest.mock('@/components/common', () => ({
  Typography,
  Card,
  Button,
  VideoBackground
}));

// Mock theme
jest.mock('@/constants/theme', () => ({
  COLORS: mockColors,
  SPACING: mockSpacing,
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
    require('@/contexts/JournalContext').useJournal.mockReturnValueOnce(
      setupJournalContextMock({ entries: [] })
    );
    
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
    require('@/contexts/JournalContext').useJournal.mockReturnValueOnce(
      setupJournalContextMock({ entries: [entryWithoutNote] })
    );
    
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
      id: 'test-entry-id-2',
    });
    
    // Use the second entry from our mock entries
    const anotherEntry = mockJournalEntries[1];
    
    // Mock useJournal to return both entries
    require('@/contexts/JournalContext').useJournal.mockReturnValueOnce(
      setupJournalContextMock({ entries: [mockEntry, anotherEntry] })
    );
    
    const { getByTestId } = render(<EntryDetailScreen />);
    
    // Title should have Tuesday (the new entry is on May 16)
    const title = getByTestId('typography-h1');
    expect(title.props.children).toBe('Tuesday');
  });
}); 