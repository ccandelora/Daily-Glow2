import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NotificationBadge } from '@/components/common/NotificationBadge';
import { useNotifications } from '@/contexts/NotificationsContext';
import { TouchableOpacity, View, Animated } from 'react-native';

// Mock the NotificationsContext
jest.mock('@/contexts/NotificationsContext', () => ({
  useNotifications: jest.fn()
}));

// Mock FontAwesome6 from @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  FontAwesome6: 'FontAwesome6'
}));

describe('NotificationBadge Component', () => {
  // Set up mocks for different scenarios
  const mockOnPress = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders correctly with zero unread notifications', () => {
    // Mock the useNotifications hook for 0 unread count
    (useNotifications as jest.Mock).mockReturnValue({ unreadCount: 0 });
    
    const { toJSON, queryByText } = render(
      <NotificationBadge />
    );
    
    // Badge should not be visible when unreadCount is 0
    expect(queryByText('0')).toBeFalsy();
    
    // Should match snapshot
    expect(toJSON()).toMatchSnapshot();
  });
  
  it('renders correctly with unread notifications', () => {
    // Mock the useNotifications hook for 5 unread count
    (useNotifications as jest.Mock).mockReturnValue({ unreadCount: 5 });
    
    const { toJSON, getByText } = render(
      <NotificationBadge />
    );
    
    // Badge should be visible and show the correct count
    expect(getByText('5')).toBeTruthy();
    
    // Should match snapshot
    expect(toJSON()).toMatchSnapshot();
  });
  
  it('renders 99+ when unread notifications exceed 99', () => {
    // Mock the useNotifications hook for 100 unread count
    (useNotifications as jest.Mock).mockReturnValue({ unreadCount: 100 });
    
    const { toJSON, getByText } = render(
      <NotificationBadge />
    );
    
    // Badge should show 99+ instead of the actual value
    expect(getByText('99+')).toBeTruthy();
    
    // Should match snapshot
    expect(toJSON()).toMatchSnapshot();
  });
  
  it('renders as TouchableOpacity when onPress is provided', () => {
    // Mock the useNotifications hook
    (useNotifications as jest.Mock).mockReturnValue({ unreadCount: 5 });
    
    const { UNSAFE_getAllByType } = render(
      <NotificationBadge onPress={mockOnPress} />
    );
    
    // Should render as TouchableOpacity
    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    expect(touchables.length).toBeGreaterThan(0);
  });
  
  it('renders as View when onPress is not provided', () => {
    // Mock the useNotifications hook
    (useNotifications as jest.Mock).mockReturnValue({ unreadCount: 5 });
    
    const { UNSAFE_getAllByType } = render(
      <NotificationBadge />
    );
    
    // Should render as View
    const views = UNSAFE_getAllByType(View);
    expect(views.length).toBeGreaterThan(0);
  });
  
  it('calls onPress when pressed', () => {
    // Mock the useNotifications hook
    (useNotifications as jest.Mock).mockReturnValue({ unreadCount: 5 });
    
    const { UNSAFE_getAllByType } = render(
      <NotificationBadge onPress={mockOnPress} />
    );
    
    // Get the TouchableOpacity and simulate press
    const touchable = UNSAFE_getAllByType(TouchableOpacity)[0];
    fireEvent.press(touchable);
    
    // onPress should be called
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });
  
  it('applies custom size prop', () => {
    // Mock the useNotifications hook
    (useNotifications as jest.Mock).mockReturnValue({ unreadCount: 5 });
    
    const { toJSON } = render(
      <NotificationBadge size={32} />
    );
    
    // Should match snapshot with custom size
    expect(toJSON()).toMatchSnapshot();
  });
  
  it('applies custom color prop', () => {
    // Mock the useNotifications hook
    (useNotifications as jest.Mock).mockReturnValue({ unreadCount: 5 });
    
    const { toJSON } = render(
      <NotificationBadge color="red" />
    );
    
    // Should match snapshot with custom color
    expect(toJSON()).toMatchSnapshot();
  });
}); 