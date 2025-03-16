import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { View, TouchableOpacity, TextInput, Animated } from 'react-native';
import { CheckInScreen } from '../CheckInScreen';

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
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    back: jest.fn(),
  })),
}));

// Mock JournalContext
const mockAddEntry = jest.fn();
const mockGetLatestEntryForPeriod = jest.fn();
const mockGetTodayEntries = jest.fn();

jest.mock('@/contexts/JournalContext', () => ({
  useJournal: jest.fn(() => ({
    addEntry: mockAddEntry,
    getLatestEntryForPeriod: mockGetLatestEntryForPeriod,
    getTodayEntries: mockGetTodayEntries,
  })),
}));

// Mock AppStateContext
const mockShowError = jest.fn();

jest.mock('@/contexts/AppStateContext', () => ({
  useAppState: jest.fn(() => ({
    showError: mockShowError,
  })),
}));

// Mock common components
jest.mock('@/components/common', () => ({
  Typography: ({ children, variant, style }: any) => (
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
  Input: ({ label, value, onChangeText, multiline, numberOfLines, placeholder }: any) => (
    <View testID={`input-${label}`}>
      <TextInput
        testID={`input-field-${label}`}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        numberOfLines={numberOfLines}
        placeholder={placeholder}
      />
    </View>
  ),
  Header: () => <View testID="header" />,
  EmotionWheel: ({ onSelect }: any) => (
    <View testID="emotion-wheel">
      <TouchableOpacity
        testID="select-emotion-happy"
        onPress={() => onSelect({ id: 'happy', value: 'Happy', category: 'positive' })}
      >
        <View>Happy</View>
      </TouchableOpacity>
      <TouchableOpacity
        testID="select-emotion-sad"
        onPress={() => onSelect({ id: 'sad', value: 'Sad', category: 'negative' })}
      >
        <View>Sad</View>
      </TouchableOpacity>
    </View>
  ),
  VideoBackground: () => <View testID="video-background" />,
}));

// Mock LinearGradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: any) => <View testID="linear-gradient">{children}</View>,
}));

// Mock utils and constants
jest.mock('@/utils/dateTime', () => ({
  getCurrentTimePeriod: jest.fn(() => 'MORNING'),
  TimePeriod: {
    MORNING: 'MORNING',
    AFTERNOON: 'AFTERNOON',
    EVENING: 'EVENING',
  },
}));

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
  TIME_PERIODS: {
    MORNING: {
      label: 'Morning',
      description: 'Start your day with reflection',
      color: '#FFC107',
      hours: [6, 7, 8, 9, 10, 11],
    },
    AFTERNOON: {
      label: 'Afternoon',
      description: 'Check in during your day',
      color: '#2196F3',
      hours: [12, 13, 14, 15, 16, 17],
    },
    EVENING: {
      label: 'Evening',
      description: 'Reflect on your day',
      color: '#9C27B0',
      hours: [18, 19, 20, 21, 22, 23],
    },
  },
}));

describe('CheckInScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mocks for a fresh check-in (no completed periods)
    mockGetLatestEntryForPeriod.mockReturnValue(null);
    mockGetTodayEntries.mockReturnValue([]);
  });

  it('renders initial emotion selection step', () => {
    const { getByTestId, getByText } = render(<CheckInScreen />);
    
    // Check that basic elements are rendered
    expect(getByTestId('video-background')).toBeTruthy();
    expect(getByTestId('header')).toBeTruthy();
    expect(getByTestId('emotion-wheel')).toBeTruthy();
    
    // Check for step title
    expect(getByText('How are you feeling right now?')).toBeTruthy();
  });

  it('moves through the 3-step check-in process', async () => {
    const { getByTestId, getByText } = render(<CheckInScreen />);
    
    // Step 1: Select initial emotion
    fireEvent.press(getByTestId('select-emotion-happy'));
    
    // Should now be on step 2
    await waitFor(() => {
      expect(getByText('Can you be more specific?')).toBeTruthy();
    });
    
    // Step 2: Select secondary emotion
    fireEvent.press(getByTestId('select-emotion-sad'));
    
    // Should now be on step 3
    await waitFor(() => {
      expect(getByText('What are you grateful for today?')).toBeTruthy();
      expect(getByTestId('input-What are you grateful for?')).toBeTruthy();
    });
    
    // Step 3: Enter gratitude and submit
    const gratitudeInput = getByTestId('input-field-What are you grateful for?');
    fireEvent.changeText(gratitudeInput, 'I am grateful for this test passing');
    
    // Optional note
    const noteInput = getByTestId('input-field-Add a note (optional)');
    fireEvent.changeText(noteInput, 'This is a test note');
    
    // Submit
    const submitButton = getByTestId('button-Submit');
    fireEvent.press(submitButton);
    
    // Check that addEntry was called with correct values
    expect(mockAddEntry).toHaveBeenCalledWith(
      'happy',
      'sad',
      'I am grateful for this test passing',
      'This is a test note'
    );
    
    // Should navigate back
    const router = require('expo-router').useRouter();
    expect(router.back).toHaveBeenCalled();
  });

  it('validates gratitude input on submit', async () => {
    const { getByTestId, getByText } = render(<CheckInScreen />);
    
    // Go through steps 1 and 2
    fireEvent.press(getByTestId('select-emotion-happy'));
    await waitFor(() => {
      expect(getByText('Can you be more specific?')).toBeTruthy();
    });
    
    fireEvent.press(getByTestId('select-emotion-sad'));
    await waitFor(() => {
      expect(getByText('What are you grateful for today?')).toBeTruthy();
    });
    
    // Try to submit without entering gratitude
    const submitButton = getByTestId('button-Submit');
    fireEvent.press(submitButton);
    
    // Check that error was shown
    expect(mockShowError).toHaveBeenCalledWith('Please share what you are grateful for');
    
    // Check that addEntry was not called
    expect(mockAddEntry).not.toHaveBeenCalled();
  });

  it('allows navigation back through steps', async () => {
    const { getByTestId, getByText } = render(<CheckInScreen />);
    
    // Go to step 2
    fireEvent.press(getByTestId('select-emotion-happy'));
    await waitFor(() => {
      expect(getByText('Can you be more specific?')).toBeTruthy();
    });
    
    // Go back to step 1
    const backButton = getByTestId('button-Back');
    fireEvent.press(backButton);
    
    // Should be back at step 1
    await waitFor(() => {
      expect(getByText('How are you feeling right now?')).toBeTruthy();
    });
    
    // Go to step 2 again
    fireEvent.press(getByTestId('select-emotion-happy'));
    await waitFor(() => {
      expect(getByText('Can you be more specific?')).toBeTruthy();
    });
    
    // Go to step 3
    fireEvent.press(getByTestId('select-emotion-sad'));
    await waitFor(() => {
      expect(getByText('What are you grateful for today?')).toBeTruthy();
    });
    
    // Go back to step 2
    fireEvent.press(backButton);
    await waitFor(() => {
      expect(getByText('Can you be more specific?')).toBeTruthy();
    });
  });

  it('shows already completed screen if period is already checked in', () => {
    // Mock that this period has already been completed
    mockGetLatestEntryForPeriod.mockReturnValue({
      id: 'existing-entry',
      time_period: 'MORNING',
    });
    
    const { getByText, queryByTestId } = render(<CheckInScreen />);
    
    // Should show completion message
    expect(getByText('Check-in Complete')).toBeTruthy();
    
    // Should not show emotion wheel
    expect(queryByTestId('emotion-wheel')).toBeNull();
    
    // Should have return to home button
    expect(getByText('Return to Home')).toBeTruthy();
  });

  it('suggests next available check-in time if current period is completed', () => {
    // Mock that morning is completed but afternoon is available
    mockGetLatestEntryForPeriod.mockReturnValue({
      id: 'existing-entry',
      time_period: 'MORNING',
    });
    mockGetTodayEntries.mockReturnValue([{
      id: 'existing-entry',
      time_period: 'MORNING',
    }]);
    
    const { getByText } = render(<CheckInScreen />);
    
    // Should show suggestion for next period
    expect(getByText('Your next check-in will be available for Afternoon')).toBeTruthy();
  });

  it('handles error during entry submission', async () => {
    // Mock addEntry to throw an error
    mockAddEntry.mockRejectedValueOnce(new Error('Failed to add entry'));
    
    const { getByTestId, getByText } = render(<CheckInScreen />);
    
    // Go through all steps
    fireEvent.press(getByTestId('select-emotion-happy'));
    await waitFor(() => {
      expect(getByText('Can you be more specific?')).toBeTruthy();
    });
    
    fireEvent.press(getByTestId('select-emotion-sad'));
    await waitFor(() => {
      expect(getByText('What are you grateful for today?')).toBeTruthy();
    });
    
    const gratitudeInput = getByTestId('input-field-What are you grateful for?');
    fireEvent.changeText(gratitudeInput, 'Test gratitude');
    
    // Submit and trigger error
    const submitButton = getByTestId('button-Submit');
    await fireEvent.press(submitButton);
    
    // Should still try to submit
    expect(mockAddEntry).toHaveBeenCalled();
    
    // Error handling should be in JournalContext (tested elsewhere)
  });
}); 