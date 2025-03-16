import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AnimatedMoodIcon } from '../AnimatedMoodIcon';

// Mock Animated
jest.mock('react-native', () => {
  const rn = jest.requireActual('react-native');
  rn.Animated.timing = jest.fn(() => ({
    start: jest.fn(cb => cb && cb({ finished: true })),
  }));
  rn.Animated.spring = jest.fn(() => ({
    start: jest.fn(cb => cb && cb({ finished: true })),
  }));
  rn.Animated.parallel = jest.fn(animations => ({
    start: jest.fn(cb => cb && cb({ finished: true })),
  }));
  return rn;
});

describe('AnimatedMoodIcon', () => {
  it('renders correctly with default props', () => {
    const { toJSON } = render(
      <AnimatedMoodIcon color="#FF5733">
        <Text>😊</Text>
      </AnimatedMoodIcon>
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders correctly with custom size', () => {
    const { toJSON } = render(
      <AnimatedMoodIcon color="#FF5733" size={100}>
        <Text>😊</Text>
      </AnimatedMoodIcon>
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders correctly when active', () => {
    const { toJSON } = render(
      <AnimatedMoodIcon color="#FF5733" active={true}>
        <Text>😊</Text>
      </AnimatedMoodIcon>
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders correctly with custom style', () => {
    const { toJSON } = render(
      <AnimatedMoodIcon 
        color="#FF5733" 
        style={{ marginTop: 10, elevation: 5 }}
      >
        <Text>😊</Text>
      </AnimatedMoodIcon>
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders children correctly', () => {
    const { getByText } = render(
      <AnimatedMoodIcon color="#FF5733">
        <Text>Test Child</Text>
      </AnimatedMoodIcon>
    );
    expect(getByText('Test Child')).toBeTruthy();
  });
}); 