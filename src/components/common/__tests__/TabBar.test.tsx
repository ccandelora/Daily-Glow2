import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TabBar } from '../TabBar';

// Mock navigation state and functions
const createMockNavigation = () => ({
  emit: jest.fn(() => ({ defaultPrevented: false })),
  navigate: jest.fn(),
});

describe('TabBar', () => {
  const mockTabs = [
    { key: 'home', label: 'Home', icon: '🏠' },
    { key: 'profile', label: 'Profile', icon: '👤' },
    { key: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  // Mock insets for safe area
  const mockInsets = { top: 0, right: 0, bottom: 0, left: 0 };

  it('renders all tabs correctly', () => {
    const mockNavigation = createMockNavigation();
    const mockState = {
      routeNames: ['home', 'profile', 'settings'],
      index: 0,
    };

    const { getByText } = render(
      <TabBar 
        state={mockState as any} 
        navigation={mockNavigation as any} 
        tabs={mockTabs}
        descriptors={{} as any}
        insets={mockInsets as any}
      />
    );

    // Check if all tab labels are rendered
    expect(getByText('Home')).toBeTruthy();
    expect(getByText('Profile')).toBeTruthy();
    expect(getByText('Settings')).toBeTruthy();

    // Check if all tab icons are rendered
    expect(getByText('🏠')).toBeTruthy();
    expect(getByText('👤')).toBeTruthy();
    expect(getByText('⚙️')).toBeTruthy();
  });

  it('highlights the active tab', () => {
    const mockNavigation = createMockNavigation();
    const mockState = {
      routeNames: ['home', 'profile', 'settings'],
      index: 1, // Profile tab is active
    };

    const { toJSON } = render(
      <TabBar 
        state={mockState as any} 
        navigation={mockNavigation as any} 
        tabs={mockTabs}
        descriptors={{} as any}
        insets={mockInsets as any}
      />
    );

    // Use snapshot to verify the active tab styling
    expect(toJSON()).toMatchSnapshot();
  });

  it('navigates to the correct tab when pressed', () => {
    const mockNavigation = createMockNavigation();
    const mockState = {
      routeNames: ['home', 'profile', 'settings'],
      index: 0,
    };

    const { getByText } = render(
      <TabBar 
        state={mockState as any} 
        navigation={mockNavigation as any} 
        tabs={mockTabs}
        descriptors={{} as any}
        insets={mockInsets as any}
      />
    );

    // Press the Profile tab
    fireEvent.press(getByText('Profile'));

    // Check if the navigation.emit was called with the correct parameters
    expect(mockNavigation.emit).toHaveBeenCalledWith({
      type: 'tabPress',
      target: 'profile',
      canPreventDefault: true,
    });

    // Check if navigation.navigate was called with the correct route name
    expect(mockNavigation.navigate).toHaveBeenCalledWith('profile');
  });

  it('does not navigate if the event is prevented', () => {
    const mockNavigation = {
      emit: jest.fn(() => ({ defaultPrevented: true })),
      navigate: jest.fn(),
    };
    
    const mockState = {
      routeNames: ['home', 'profile', 'settings'],
      index: 0,
    };

    const { getByText } = render(
      <TabBar 
        state={mockState as any} 
        navigation={mockNavigation as any} 
        tabs={mockTabs}
        descriptors={{} as any}
        insets={mockInsets as any}
      />
    );

    // Press the Settings tab
    fireEvent.press(getByText('Settings'));

    // Check if the navigation.emit was called
    expect(mockNavigation.emit).toHaveBeenCalled();

    // Check that navigation.navigate was NOT called because the event was prevented
    expect(mockNavigation.navigate).not.toHaveBeenCalled();
  });
}); 