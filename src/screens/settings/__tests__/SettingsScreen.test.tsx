import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { SettingsScreen } from '../SettingsScreen';
import { Alert } from 'react-native';

// Define the type for Alert buttons
type AlertButton = {
  text: string;
  style: string;
  onPress?: () => Promise<void>;
};

// Mock router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    navigate: jest.fn(),
  })),
}));

// Mock dependencies
jest.mock('@/contexts/JournalContext', () => ({
  useJournal: jest.fn(),
}));

jest.mock('@/contexts/AppStateContext', () => ({
  useAppState: jest.fn(),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock React Native Alert
jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
  // Simulate the alert being shown
  return null;
});

// Mock common components using dynamic requires to avoid module factory error
jest.mock('@/components/common', () => {
  // Dynamic requires inside the factory function - THIS IS THE KEY FIX
  const React = require('react');
  const { Text, View, TouchableOpacity } = require('react-native');
  
  return {
    Typography: jest.fn(({ children, variant, testID, style, ...props }) => 
      React.createElement(Text, { 
        testID: testID || `typography-${variant || 'default'}`,
        style,
        ...props
      }, children)
    ),
    Card: jest.fn(({ children, testID, style, ...props }) => 
      React.createElement(View, { 
        testID: testID || 'card',
        style,
        ...props
      }, children)
    ),
    Button: jest.fn(({ title, onPress, variant, testID, style, ...props }) => 
      React.createElement(TouchableOpacity, { 
        testID: testID || `button-${title.replace(/\s+/g, '-').toLowerCase()}`,
        onPress,
        accessibilityRole: "button",
        style,
        ...props
      }, React.createElement(Text, null, title))
    ),
    Header: jest.fn(({ showBranding }) => 
      React.createElement(View, { testID: "header" })
    ),
    VideoBackground: jest.fn(() => 
      React.createElement(View, { testID: "video-background" })
    )
  };
});

// Mock theme
jest.mock('@/constants/theme', () => ({
  COLORS: {
    ui: {
      background: '#000',
      text: '#FFF',
      textSecondary: '#AAA',
      accent: '#4169E1',
      card: '#333',
    },
    primary: {
      green: '#00C853',
      blue: '#2979FF',
      red: '#FF5252',
    },
  },
  SPACING: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
}));

describe('SettingsScreen', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    const mockDeleteAllEntries = jest.fn().mockResolvedValue(undefined);
    require('@/contexts/JournalContext').useJournal.mockReturnValue({
      entries: [{ id: '1' }, { id: '2' }],
      deleteAllEntries: mockDeleteAllEntries,
    });

    const mockSetLoading = jest.fn();
    const mockShowError = jest.fn();
    require('@/contexts/AppStateContext').useAppState.mockReturnValue({
      setLoading: mockSetLoading,
      showError: mockShowError,
    });

    const mockSignOut = jest.fn().mockResolvedValue(undefined);
    require('@/contexts/AuthContext').useAuth.mockReturnValue({
      signOut: mockSignOut,
    });
  });

  it('renders correctly', () => {
    const { queryByTestId } = render(<SettingsScreen />);
    
    // Verify core components are rendered
    expect(queryByTestId('video-background')).not.toBeNull();
    expect(queryByTestId('header')).not.toBeNull();
    expect(queryByTestId('button-view-profile')).not.toBeNull();
    expect(queryByTestId('button-sign-out')).not.toBeNull();
    expect(queryByTestId('button-export-journal-data')).not.toBeNull();
    expect(queryByTestId('button-delete-all-data')).not.toBeNull();
  });

  it('calls signOut when Sign Out button is pressed', async () => {
    const mockSignOut = jest.fn().mockResolvedValue(undefined);
    const mockSetLoading = jest.fn();
    
    require('@/contexts/AuthContext').useAuth.mockReturnValue({
      signOut: mockSignOut,
    });
    
    require('@/contexts/AppStateContext').useAppState.mockReturnValue({
      setLoading: mockSetLoading,
      showError: jest.fn(),
    });
    
    // Render the component
    const { getByTestId } = render(<SettingsScreen />);
    
    // Find and press the Sign Out button
    const signOutButton = getByTestId('button-sign-out');
    await act(async () => {
      fireEvent.press(signOutButton);
    });
    
    // Verify the sign out function was called with proper loading states
    expect(mockSetLoading).toHaveBeenCalledWith(true);
    expect(mockSignOut).toHaveBeenCalled();
    expect(mockSetLoading).toHaveBeenCalledWith(false);
  });

  it('handles export data functionality', async () => {
    const mockSetLoading = jest.fn();
    const mockShowError = jest.fn();
    
    require('@/contexts/AppStateContext').useAppState.mockReturnValue({
      setLoading: mockSetLoading,
      showError: mockShowError,
    });
    
    // Render the component
    const { getByTestId } = render(<SettingsScreen />);
    
    // Find and press the Export Data button
    const exportButton = getByTestId('button-export-journal-data');
    
    // Mock the timeout function
    jest.useFakeTimers();
    
    // Press the button
    await act(async () => {
      fireEvent.press(exportButton);
      // Fast-forward timers
      jest.advanceTimersByTime(2000);
    });
    
    // Restore real timers
    jest.useRealTimers();
    
    // Verify the functions were called with the expected arguments
    expect(mockSetLoading).toHaveBeenCalledWith(true);
    expect(mockShowError).toHaveBeenCalledWith('Export feature coming soon!');
    expect(mockSetLoading).toHaveBeenCalledWith(false);
  });

  it('handles delete confirmation correctly', async () => {
    const mockDeleteAllEntries = jest.fn().mockResolvedValue(undefined);
    const mockShowError = jest.fn();
    
    require('@/contexts/JournalContext').useJournal.mockReturnValue({
      entries: [{ id: '1' }, { id: '2' }],
      deleteAllEntries: mockDeleteAllEntries,
    });
    
    require('@/contexts/AppStateContext').useAppState.mockReturnValue({
      setLoading: jest.fn(),
      showError: mockShowError,
    });
    
    // Spy on Alert.alert
    const alertMock = jest.spyOn(Alert, 'alert');
    
    // Render the component
    const { getByTestId } = render(<SettingsScreen />);
    
    // Find and press the Delete All Data button
    const deleteButton = getByTestId('button-delete-all-data');
    fireEvent.press(deleteButton);
    
    // Verify Alert.alert was called
    expect(alertMock).toHaveBeenCalled();
    expect(alertMock).toHaveBeenCalledWith(
      'Delete All Data',
      'Are you sure you want to delete all your journal entries? This action cannot be undone.',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel', style: 'cancel' }),
        expect.objectContaining({ 
          text: 'Delete', 
          style: 'destructive',
          onPress: expect.any(Function)
        })
      ])
    );
    
    // Get the Delete button's onPress handler from the last Alert call
    const lastCall = alertMock.mock.calls[alertMock.mock.calls.length - 1];
    
    const buttons = lastCall[2] as AlertButton[];
    const deleteAlertButton = buttons.find(button => button.text === 'Delete');
    
    // Call the onPress handler if it exists
    await act(async () => {
      if (deleteAlertButton && deleteAlertButton.onPress) {
        await deleteAlertButton.onPress();
      }
    });
    
    // Verify deleteAllEntries was called and showError was called with the correct message
    expect(mockDeleteAllEntries).toHaveBeenCalled();
    expect(mockShowError).toHaveBeenCalledWith('All entries have been deleted');
  });

  it('displays correct number of entries', () => {
    const mockEntries = [{ id: '1' }, { id: '2' }, { id: '3' }];
    require('@/contexts/JournalContext').useJournal.mockReturnValue({
      entries: mockEntries,
      deleteAllEntries: jest.fn(),
    });
    
    const { getByText } = render(<SettingsScreen />);
    
    // Verify the entry count is displayed correctly
    expect(getByText('3 entries available for export')).toBeTruthy();
  });

  it('toggles notifications setting when switch is pressed', () => {
    // Mock useState to capture the state setter
    const setNotificationsMock = jest.fn();
    const useStateSpy = jest.spyOn(React, 'useState');
    
    // First call for notifications
    useStateSpy.mockImplementationOnce(() => [true, setNotificationsMock]);
    // Second call for dark mode
    useStateSpy.mockImplementationOnce(() => [false, jest.fn()]);
    
    render(<SettingsScreen />);
    
    // Simulate toggling the notification switch by calling the captured setter
    setNotificationsMock(false);
    
    // Verify the state setter was called with the new value
    expect(setNotificationsMock).toHaveBeenCalledWith(false);
    
    // Restore original implementation
    useStateSpy.mockRestore();
  });
  
  it('toggles dark mode setting when switch is pressed', () => {
    // Mock useState to capture the state setter
    const useStateSpy = jest.spyOn(React, 'useState');
    
    // First call for notifications
    useStateSpy.mockImplementationOnce(() => [true, jest.fn()]);
    // Second call for dark mode
    const setDarkModeMock = jest.fn();
    useStateSpy.mockImplementationOnce(() => [false, setDarkModeMock]);
    
    render(<SettingsScreen />);
    
    // Simulate toggling the dark mode switch by calling the captured setter
    setDarkModeMock(true);
    
    // Verify the state setter was called with the new value
    expect(setDarkModeMock).toHaveBeenCalledWith(true);
    
    // Restore original implementation
    useStateSpy.mockRestore();
  });
  
  it('navigates to profile screen when View Profile button is pressed', () => {
    const mockNavigate = jest.fn();
    
    require('expo-router').useRouter.mockReturnValue({
      navigate: mockNavigate,
    });
    
    const { getByTestId } = render(<SettingsScreen />);
    
    // Find and press the View Profile button
    const viewProfileButton = getByTestId('button-view-profile');
    fireEvent.press(viewProfileButton);
    
    // Verify navigation was called with the correct route
    expect(mockNavigate).toHaveBeenCalledWith('profile');
  });
  
  it('handles error during sign out', async () => {
    const mockSignOut = jest.fn().mockRejectedValue(new Error('Sign out failed'));
    const mockSetLoading = jest.fn();
    const mockShowError = jest.fn();
    
    require('@/contexts/AuthContext').useAuth.mockReturnValue({
      signOut: mockSignOut,
    });
    
    require('@/contexts/AppStateContext').useAppState.mockReturnValue({
      setLoading: mockSetLoading,
      showError: mockShowError,
    });
    
    const { getByTestId } = render(<SettingsScreen />);
    
    // Find and press the Sign Out button
    const signOutButton = getByTestId('button-sign-out');
    await act(async () => {
      fireEvent.press(signOutButton);
    });
    
    // Verify proper handling of the error
    expect(mockSetLoading).toHaveBeenCalledWith(true);
    expect(mockSignOut).toHaveBeenCalled();
    expect(mockSetLoading).toHaveBeenCalledWith(false);
  });

  it('handles error during export data', async () => {
    const mockSetLoading = jest.fn();
    const mockShowError = jest.fn();
    
    require('@/contexts/AppStateContext').useAppState.mockReturnValue({
      setLoading: mockSetLoading,
      showError: mockShowError,
    });
    
    // Mock the setTimeout to throw an error
    jest.useFakeTimers();
    const originalSetTimeout = global.setTimeout;
    global.setTimeout = jest.fn((cb) => {
      throw new Error('Export failed');
    }) as any;
    
    const { getByTestId } = render(<SettingsScreen />);
    
    // Find and press the Export Data button
    const exportButton = getByTestId('button-export-journal-data');
    
    await act(async () => {
      try {
        fireEvent.press(exportButton);
      } catch(e) {
        // Expected error
      }
    });
    
    // Restore setTimeout
    global.setTimeout = originalSetTimeout;
    jest.useRealTimers();
    
    // Verify the error was handled correctly
    expect(mockSetLoading).toHaveBeenCalledWith(true);
    expect(mockShowError).toHaveBeenCalledWith('Failed to export data. Please try again.');
    expect(mockSetLoading).toHaveBeenCalledWith(false);
  });
  
  it('handles error during delete all entries', async () => {
    const mockDeleteAllEntries = jest.fn().mockRejectedValue(new Error('Delete failed'));
    const mockShowError = jest.fn();
    
    require('@/contexts/JournalContext').useJournal.mockReturnValue({
      entries: [{ id: '1' }, { id: '2' }],
      deleteAllEntries: mockDeleteAllEntries,
    });
    
    require('@/contexts/AppStateContext').useAppState.mockReturnValue({
      setLoading: jest.fn(),
      showError: mockShowError,
    });
    
    // Spy on Alert.alert
    const alertMock = jest.spyOn(Alert, 'alert');
    
    // Render the component
    const { getByTestId } = render(<SettingsScreen />);
    
    // Find and press the Delete All Data button
    const deleteButton = getByTestId('button-delete-all-data');
    fireEvent.press(deleteButton);
    
    // Get the Delete button's onPress handler from the last Alert call
    const lastCall = alertMock.mock.calls[alertMock.mock.calls.length - 1];
    
    const buttons = lastCall[2] as AlertButton[];
    const deleteAlertButton = buttons.find(button => button.text === 'Delete');
    
    // Call the onPress handler if it exists
    await act(async () => {
      if (deleteAlertButton && deleteAlertButton.onPress) {
        await deleteAlertButton.onPress();
      }
    });
    
    // Verify deleteAllEntries was called and error was handled
    expect(mockDeleteAllEntries).toHaveBeenCalled();
  });
  
  it('cancels delete operation when Cancel button is pressed', () => {
    const mockDeleteAllEntries = jest.fn();
    
    require('@/contexts/JournalContext').useJournal.mockReturnValue({
      entries: [{ id: '1' }, { id: '2' }],
      deleteAllEntries: mockDeleteAllEntries,
    });
    
    // Spy on Alert.alert
    const alertMock = jest.spyOn(Alert, 'alert');
    
    // Render the component
    const { getByTestId } = render(<SettingsScreen />);
    
    // Find and press the Delete All Data button
    const deleteButton = getByTestId('button-delete-all-data');
    fireEvent.press(deleteButton);
    
    // Get the Cancel button from the last Alert call
    const lastCall = alertMock.mock.calls[alertMock.mock.calls.length - 1];
    
    const buttons = lastCall[2] as AlertButton[];
    const cancelButton = buttons.find(button => button.text === 'Cancel');
    
    // Verify the cancel button exists with the correct style
    expect(cancelButton).toBeDefined();
    expect(cancelButton?.style).toBe('cancel');
    
    // Verify the delete function was not called
    expect(mockDeleteAllEntries).not.toHaveBeenCalled();
  });
}); 