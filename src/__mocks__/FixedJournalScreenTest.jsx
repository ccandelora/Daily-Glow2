/**
 * Example of fixing JournalScreen tests using shared mock utilities
 * This example demonstrates how to properly mock animations and avoid
 * the module factory error for components with animations
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import JournalScreen from '../../screens/journal/JournalScreen';

// Mock navigation
jest.mock('@react-navigation/native', () => {
  return {
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn()
    })
  };
});

// Mock animated components using shared animation mocks
jest.mock('react-native/Libraries/Animated/Animated', () => {
  const { createAnimationMocks } = require('../../__mocks__/AnimationMocks');
  return createAnimationMocks();
});

// Mock Typography component using shared component mocks
jest.mock('../../components/Typography', () => {
  const { createCommonComponentMocks } = require('../../__mocks__/SharedComponentMocks');
  return createCommonComponentMocks().Typography;
});

// Mock Button component using shared component mocks
jest.mock('../../components/Button', () => {
  const { createCommonComponentMocks } = require('../../__mocks__/SharedComponentMocks');
  return createCommonComponentMocks().Button;
});

// Mock Card component using shared component mocks
jest.mock('../../components/Card', () => {
  const { createCommonComponentMocks } = require('../../__mocks__/SharedComponentMocks');
  return createCommonComponentMocks().Card;
});

// Mock LoadingIndicator component using shared component mocks
jest.mock('../../components/LoadingIndicator', () => {
  const { createCommonComponentMocks } = require('../../__mocks__/SharedComponentMocks');
  return createCommonComponentMocks().LoadingIndicator;
});

// Mock EmptyState component
jest.mock('../../components/EmptyState', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  
  return {
    __esModule: true,
    default: ({ title, message, icon, button }) => {
      return React.createElement(View, { testID: 'empty-state' }, [
        React.createElement(Text, { key: 'title' }, title),
        React.createElement(Text, { key: 'message' }, message),
        button
      ]);
    }
  };
});

// Mock JournalEntry component
jest.mock('../../components/journal/JournalEntry', () => {
  const React = require('react');
  const { TouchableOpacity, View, Text } = require('react-native');
  
  return {
    __esModule: true,
    default: ({ entry, onPress }) => {
      return React.createElement(TouchableOpacity, { 
        testID: `journal-entry-${entry.id}`,
        onPress: () => onPress(entry)
      }, [
        React.createElement(View, { key: 'content' }, [
          React.createElement(Text, { key: 'title' }, entry.title || 'Entry'),
          React.createElement(Text, { key: 'date' }, entry.created_at),
          React.createElement(Text, { key: 'emotion' }, entry.emotion?.name || 'No emotion')
        ])
      ]);
    }
  };
});

// Mock all date functions for consistent testing
jest.mock('../../utils/dateTime', () => ({
  formatDate: jest.fn((date) => '2023-01-01'),
  formatTime: jest.fn((date) => '10:00 AM'),
  formatShortDate: jest.fn((date) => 'Jan 1'),
  getFormattedDateRange: jest.fn(() => 'January 1-7, 2023'),
  getCurrentWeekRange: jest.fn(() => ({ start: new Date('2023-01-01'), end: new Date('2023-01-07') }))
}));

// Mock JournalContext using our shared ContextMocks
jest.mock('../../contexts/JournalContext', () => {
  const { createJournalContextMock } = require('../../__mocks__/ContextMocks');
  const React = require('react');
  
  // Create mock entries
  const mockEntries = [
    {
      id: '1',
      title: 'Morning Reflection',
      content: 'I feel great today!',
      emotion: { id: 'happy', name: 'Happy' },
      created_at: '2023-01-01T10:00:00Z'
    },
    {
      id: '2',
      title: 'Evening Thoughts',
      content: 'Today was challenging but rewarding.',
      emotion: { id: 'satisfied', name: 'Satisfied' },
      created_at: '2023-01-01T20:00:00Z'
    }
  ];
  
  // Create a default mock with entries
  const defaultMock = createJournalContextMock({
    entries: mockEntries,
    getEntries: jest.fn().mockResolvedValue(mockEntries)
  });
  
  return {
    useJournal: jest.fn(() => defaultMock),
    JournalProvider: ({ children }) => {
      return React.createElement('div', { 'data-testid': 'mock-journal-provider' }, children);
    },
    // Export mocks for test manipulation
    __mocks: {
      entries: mockEntries,
      getEntries: defaultMock.getEntries,
      setEntries: (entries) => {
        defaultMock.entries = entries;
        defaultMock.getEntries.mockResolvedValue(entries);
      },
      setIsLoading: (isLoading) => {
        defaultMock.isLoading = isLoading;
      }
    }
  };
});

// Mock AppStateContext using our shared ContextMocks
jest.mock('../../contexts/AppStateContext', () => {
  const { createAppStateMock } = require('../../__mocks__/ContextMocks');
  const React = require('react');
  
  const mockAppState = createAppStateMock();
  
  return {
    useAppState: jest.fn(() => mockAppState),
    AppStateProvider: ({ children }) => {
      return React.createElement('div', { 'data-testid': 'mock-app-state-provider' }, children);
    }
  };
});

describe('JournalScreen', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset navigation mocks
    const { useNavigation } = require('@react-navigation/native');
    useNavigation().navigate.mockClear();
    
    // Reset journal context mocks with default entries
    const { __mocks } = require('../../contexts/JournalContext');
    __mocks.setEntries(__mocks.entries);
    __mocks.setIsLoading(false);
    __mocks.getEntries.mockClear();
  });
  
  test('renders journal entries correctly', async () => {
    const { getByTestId, getByText, queryByTestId } = render(<JournalScreen />);
    
    // Should initially call getEntries
    const { __mocks } = require('../../contexts/JournalContext');
    expect(__mocks.getEntries).toHaveBeenCalled();
    
    // Should render both entries
    await waitFor(() => {
      expect(getByTestId('journal-entry-1')).toBeTruthy();
      expect(getByTestId('journal-entry-2')).toBeTruthy();
    });
    
    // Should show entry titles
    expect(getByText('Morning Reflection')).toBeTruthy();
    expect(getByText('Evening Thoughts')).toBeTruthy();
    
    // Should show emotions
    expect(getByText('Happy')).toBeTruthy();
    expect(getByText('Satisfied')).toBeTruthy();
    
    // Should not show empty state
    expect(queryByTestId('empty-state')).toBeNull();
  });
  
  test('navigates to entry detail when entry is pressed', async () => {
    const { getByTestId } = render(<JournalScreen />);
    
    // Wait for entries to render
    await waitFor(() => {
      expect(getByTestId('journal-entry-1')).toBeTruthy();
    });
    
    // Press the first entry
    fireEvent.press(getByTestId('journal-entry-1'));
    
    // Get navigation mock
    const { useNavigation } = require('@react-navigation/native');
    
    // Verify that we navigated to entry detail with the correct entry ID
    expect(useNavigation().navigate).toHaveBeenCalledWith('EntryDetail', { 
      entryId: '1' 
    });
  });
  
  test('navigates to add entry when add button is pressed', () => {
    const { getByTestId } = render(<JournalScreen />);
    
    // Find and press the add button
    // Note: The actual test ID might be different in your app
    fireEvent.press(getByTestId('add-entry-button'));
    
    // Get navigation mock
    const { useNavigation } = require('@react-navigation/native');
    
    // Verify that we navigated to add entry
    expect(useNavigation().navigate).toHaveBeenCalledWith('AddEntry');
  });
  
  test('shows empty state when there are no entries', async () => {
    // Set empty entries list
    const { __mocks } = require('../../contexts/JournalContext');
    __mocks.setEntries([]);
    
    const { getByTestId, queryByTestId, getByText } = render(<JournalScreen />);
    
    // Should show loading initially
    expect(getByTestId('loading-indicator')).toBeTruthy();
    
    // Should show empty state when loaded
    await waitFor(() => {
      expect(getByTestId('empty-state')).toBeTruthy();
    });
    
    // Should show appropriate empty state message
    expect(getByText('No journal entries yet')).toBeTruthy();
    expect(getByText('Start capturing your thoughts and emotions')).toBeTruthy();
    
    // Should not render any entries
    expect(queryByTestId('journal-entry-1')).toBeNull();
  });
  
  test('shows loading state while fetching entries', async () => {
    // Set loading state to true
    const { __mocks } = require('../../contexts/JournalContext');
    __mocks.setIsLoading(true);
    
    const { getByTestId } = render(<JournalScreen />);
    
    // Should show loading indicator
    expect(getByTestId('loading-indicator')).toBeTruthy();
    
    // Change loading state to false
    __mocks.setIsLoading(false);
    
    // Wait for entries to render after loading
    await waitFor(() => {
      expect(getByTestId('journal-entry-1')).toBeTruthy();
    });
  });
  
  test('filters entries by search query', async () => {
    const { getByTestId, queryByTestId } = render(<JournalScreen />);
    
    // Wait for entries to render
    await waitFor(() => {
      expect(getByTestId('journal-entry-1')).toBeTruthy();
      expect(getByTestId('journal-entry-2')).toBeTruthy();
    });
    
    // Type in search box
    fireEvent.changeText(getByTestId('search-input'), 'Morning');
    
    // Should filter entries to only show matching ones
    // Note: This assumes your app filters client-side. If it calls getEntries with a filter, 
    // you would need to mock that behavior differently.
    expect(getByTestId('journal-entry-1')).toBeTruthy(); // "Morning Reflection" should match
    expect(queryByTestId('journal-entry-2')).toBeNull(); // "Evening Thoughts" should not match
  });
}); 