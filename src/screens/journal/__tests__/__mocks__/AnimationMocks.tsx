/**
 * Mock implementations for animation related libraries and components
 * This centralizes animation mocks to ensure consistent behavior across tests
 */

// Mock for Animated from React Native
export const mockAnimatedTiming = jest.fn(() => ({
  start: jest.fn(callback => callback && callback()),
}));

export const mockAnimatedSpring = jest.fn(() => ({
  start: jest.fn(callback => callback && callback()),
}));

export const mockAnimatedValue = jest.fn((initialValue) => ({
  setValue: jest.fn(),
  interpolate: jest.fn(config => ({
    __interpolateConfig: config,
  })),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  stopAnimation: jest.fn(),
  _value: initialValue,
}));

export const mockAnimatedParallel = jest.fn(animations => ({
  start: jest.fn(callback => callback && callback()),
}));

export const mockAnimatedSequence = jest.fn(animations => ({
  start: jest.fn(callback => callback && callback()),
}));

export const mockAnimatedStagger = jest.fn((duration, animations) => ({
  start: jest.fn(callback => callback && callback()),
}));

// Mock for LinearGradient from Expo
export const mockLinearGradient = ({ children, colors, style, start, end }: any) => ({
  type: 'LinearGradient',
  props: {
    colors,
    style,
    start,
    end,
    children,
  },
});

// Extended Animated mock setup function
export const setupAnimatedMocks = () => {
  // This function returns an object that can be used to replace the entire Animated module
  return {
    timing: mockAnimatedTiming,
    spring: mockAnimatedSpring,
    parallel: mockAnimatedParallel,
    sequence: mockAnimatedSequence,
    stagger: mockAnimatedStagger,
    Value: mockAnimatedValue,
    View: ({ children, style }: any) => ({
      type: 'Animated.View',
      props: { style, children },
    }),
    Text: ({ children, style }: any) => ({
      type: 'Animated.Text',
      props: { style, children },
    }),
    Image: ({ source, style }: any) => ({
      type: 'Animated.Image',
      props: { source, style },
    }),
    ScrollView: ({ children, style, contentContainerStyle, onScroll }: any) => ({
      type: 'Animated.ScrollView',
      props: { style, contentContainerStyle, onScroll, children },
    }),
    createAnimatedComponent: (Component: any) => Component,
    event: jest.fn(),
  };
}; 