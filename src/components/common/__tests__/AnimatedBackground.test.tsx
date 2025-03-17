import React from 'react';
import { render } from '@testing-library/react-native';
import { AnimatedBackground } from '../AnimatedBackground';

// Mock Animated API
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Animated: {
      ...RN.Animated,
      Value: jest.fn(() => ({
        setValue: jest.fn(),
        interpolate: jest.fn().mockReturnValue(0),
      })),
      timing: jest.fn(() => ({
        start: jest.fn(callback => {
          if (callback) callback({ finished: true });
        }),
      })),
      loop: jest.fn(() => ({
        start: jest.fn(),
      })),
      View: RN.View,
    },
  };
});

// Mock LinearGradient
jest.mock('expo-linear-gradient', () => {
  const { View } = jest.requireActual('react-native');
  return {
    LinearGradient: ({ children, ...props }: { children?: React.ReactNode } & Record<string, any>) => (
      <View testID="linear-gradient" {...props}>
        {children}
      </View>
    ),
  };
});

// Disable act warnings for animation-related updates
jest.spyOn(console, 'error').mockImplementation((message) => {
  if (!message.includes('act(...)') && !message.includes('unmounted component')) {
    // eslint-disable-next-line no-console
    console.warn(message);
  }
});

describe('AnimatedBackground', () => {
  afterAll(() => {
    jest.restoreAllMocks();
  });
  
  it('renders correctly', () => {
    const { getByTestId } = render(<AnimatedBackground testID="animated-bg" />);
    expect(getByTestId('animated-bg')).toBeTruthy();
  });

  it('accepts custom style prop', () => {
    const customStyle = { backgroundColor: 'red' };
    const { getByTestId } = render(
      <AnimatedBackground style={customStyle} testID="animated-bg" />
    );
    
    expect(getByTestId('animated-bg')).toBeTruthy();
  });

  it('handles non-animated mode correctly', () => {
    const { getByTestId } = render(
      <AnimatedBackground animated={false} testID="static-bg" />
    );
    
    expect(getByTestId('static-bg')).toBeTruthy();
    // When animated is false, the animation will not start and fadeAnim should be set directly
  });

  it('renders with different intensity settings', () => {
    const { getByTestId: getLightBg } = render(
      <AnimatedBackground intensity="light" testID="light-bg" />
    );
    
    const { getByTestId: getDarkBg } = render(
      <AnimatedBackground intensity="dark" testID="dark-bg" />
    );
    
    expect(getLightBg('light-bg')).toBeTruthy();
    expect(getDarkBg('dark-bg')).toBeTruthy();
  });
}); 