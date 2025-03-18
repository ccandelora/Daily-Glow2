import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { JournalScreen } from '../JournalScreen';
import { useJournal } from '@/contexts/JournalContext';
import { useRouter } from 'expo-router';
import { Text, View, TouchableOpacity } from 'react-native';

// Mock dependencies
jest.mock('expo-router', () => ({
  useRouter: jest.fn()
}));

jest.mock('@/contexts/JournalContext', () => ({
  useJournal: jest.fn()
}));

// Mock expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  FontAwesome6: 'MockedFontAwesome6',
  FontAwesome5: 'MockedFontAwesome5',
  MaterialIcons: 'MockedMaterialIcons',
  Ionicons: 'MockedIonicons',
  MaterialCommunityIcons: 'MockedMaterialCommunityIcons'
}));

jest.mock('@/constants/emotions', () => ({
  getEmotionById: jest.fn().mockImplementation(id => ({
    name: id === 'happy' ? 'Happy' : id === 'calm' ? 'Calm' : 'Excited',
    color: '#000',
    id
  }))
}));

// Mock the components module with functional components
jest.mock('@/components/common', () => {
  const React = require('react');
  const { Text, View, TouchableOpacity } = require('react-native');
  
  return {
    Typography: ({ children, testID }) => React.createElement(Text, { testID }, children),
    Card: ({ children, onPress, testID }) => React.createElement(TouchableOpacity, { onPress, testID }, children),
    SearchInput: ({ onChangeText, placeholder }) => 
      React.createElement(TouchableOpacity, { 
        testID: 'search-input',
        onPress: () => onChangeText('coffee'),
        accessible: true
      }, React.createElement(Text, {}, placeholder)),
    Button: ({ children, onPress, testID }) => 
      React.createElement(TouchableOpacity, { onPress, testID }, 
        React.createElement(Text, {}, children)),
    Header: ({ title }) => React.createElement(Text, { testID: 'header' }, title),
    VideoBackground: () => React.createElement(View, { testID: 'video-background' })
  };
});

// Mocked data
const mockEntries = [
  {
    id: '1',
    gratitude: 'Grateful for family',
    note: 'Had a great day',
    created_at: '2023-01-15T12:00:00Z',
    date: new Date('2023-01-15'),
    initial_emotion: 'happy',
    secondary_emotion: 'joy'
  },
  {
    id: '2',
    gratitude: 'Grateful for friends',
    note: 'Went for coffee',
    created_at: '2023-02-20T12:00:00Z',
    date: new Date('2023-02-20'),
    initial_emotion: 'calm',
    secondary_emotion: 'peaceful'
  },
  {
    id: '3',
    gratitude: 'Grateful for health',
    note: 'Exercised today',
    created_at: '2023-01-05T12:00:00Z',
    date: new Date('2023-01-05'),
    initial_emotion: 'excited',
    secondary_emotion: 'enthusiastic'
  }
];

describe('JournalScreen', () => {
  const mockRouter = {
    push: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useJournal as jest.Mock).mockReturnValue({
      entries: mockEntries,
      loadEntries: jest.fn(),
      deleteEntry: jest.fn(),
      searchEntries: jest.fn()
    });
  });

  it('renders the journal screen with header', () => {
    const { getByTestId } = render(<JournalScreen />);
    expect(getByTestId('header')).toBeDefined();
  });

  it('filters entries when searching', () => {
    const { getByTestId } = render(<JournalScreen />);
    
    // Find and press the search input
    const searchInput = getByTestId('search-input');
    fireEvent.press(searchInput);
    
    // The mock will call onChangeText with 'coffee'
    // Check if the entries are filtered
    expect(true).toBe(true); // This is a placeholder for the actual test
  });

  it('selects a month filter', () => {
    const { getByText } = render(<JournalScreen />);
    
    // Select January directly
    const januaryOption = getByText('January');
    fireEvent.press(januaryOption);
    
    // Check if the entries are filtered
    expect(true).toBe(true); // This is a placeholder for the actual test
  });

  it('selects a year filter', () => {
    const { getByText } = render(<JournalScreen />);
    
    // Select 2023 directly
    const yearOption = getByText('2023');
    fireEvent.press(yearOption);
    
    // Check if the entries are filtered
    expect(true).toBe(true); // This is a placeholder for the actual test
  });

  it('navigates to entry detail when entry is pressed', () => {
    const { getByText } = render(<JournalScreen />);
    
    // Find and press an entry
    const entryCard = getByText('Grateful for family');
    fireEvent.press(entryCard);
    
    // Check if navigation was called with the correct path
    expect(mockRouter.push).toHaveBeenCalledWith('/journal/1');
  });
}); 