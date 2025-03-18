import React from 'react';
import { render } from '@testing-library/react-native';
import { Animated } from 'react-native';
import { LoadingSpinner } from '../LoadingSpinner';

// Instead of mocking NativeAnimatedHelper, just mock the specific animation methods we need
jest.mock('react-native', () => {
  const rn = jest.requireActual('react-native');
  
  return {
    ...rn,
    Animated: {
      ...rn.Animated,
      timing: jest.fn(() => ({
        start: jest.fn(),
        stop: jest.fn(),
      })),
      loop: jest.fn(() => ({
        start: jest.fn(),
        stop: jest.fn(),
      })),
      Value: jest.fn(() => ({
        interpolate: jest.fn(() => 'interpolated-value'),
      })),
    },
  };
});

describe('LoadingSpinner Component', () => {
  test('renders correctly with default props', () => {
    const { toJSON } = render(<LoadingSpinner />);
    expect(toJSON()).toMatchSnapshot('default-spinner');
  });

  test('applies custom size', () => {
    const customSize = 60;
    const { toJSON } = render(<LoadingSpinner size={customSize} />);
    expect(toJSON()).toMatchSnapshot(`spinner-with-size-${customSize}`);
  });

  test('applies custom color', () => {
    const customColor = '#FF0000';
    const { toJSON } = render(<LoadingSpinner color={customColor} />);
    expect(toJSON()).toMatchSnapshot(`spinner-with-color-${customColor}`);
  });

  test('applies custom style', () => {
    const customStyle = { marginTop: 20, backgroundColor: '#F0F0F0' };
    const { toJSON } = render(<LoadingSpinner style={customStyle} />);
    expect(toJSON()).toMatchSnapshot('spinner-with-custom-style');
  });
}); 