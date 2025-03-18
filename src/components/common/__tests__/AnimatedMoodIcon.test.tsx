import React from 'react';
import { render, RenderAPI } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AnimatedMoodIcon } from '../AnimatedMoodIcon';

// Mock react-native Animated module
jest.mock('react-native', () => {
  const reactNative = jest.requireActual('react-native');
  
  return {
    ...reactNative,
    Animated: {
      ...reactNative.Animated,
      timing: jest.fn(() => ({
        start: jest.fn(callback => callback && callback()),
      })),
      Value: jest.fn(() => ({
        setValue: jest.fn(),
        interpolate: jest.fn(() => ({
          __getValue: jest.fn(() => 1),
        })),
      })),
    },
  };
});

describe('AnimatedMoodIcon', () => {
  it('renders correctly with default props', () => {
    const component = render(
      <AnimatedMoodIcon color="#FF5733">
        <Text>😊</Text>
      </AnimatedMoodIcon>
    );
    
    expect(component.getByText('😊')).toBeTruthy();
    expect(component.toJSON()).toMatchSnapshot();
  });

  it('renders correctly with custom size', () => {
    const component = render(
      <AnimatedMoodIcon color="#FF5733" size={100}>
        <Text>😊</Text>
      </AnimatedMoodIcon>
    );
    
    expect(component.getByText('😊')).toBeTruthy();
    expect(component.toJSON()).toMatchSnapshot();
  });

  it('renders correctly when active', () => {
    const component = render(
      <AnimatedMoodIcon color="#FF5733" active={true}>
        <Text>😊</Text>
      </AnimatedMoodIcon>
    );
    
    expect(component.getByText('😊')).toBeTruthy();
    expect(component.toJSON()).toMatchSnapshot();
  });

  it('renders correctly with custom style', () => {
    const component = render(
      <AnimatedMoodIcon 
        color="#FF5733" 
        style={{ marginTop: 10, elevation: 5 }}
      >
        <Text>😊</Text>
      </AnimatedMoodIcon>
    );
    
    expect(component.getByText('😊')).toBeTruthy();
    expect(component.toJSON()).toMatchSnapshot();
  });

  it('renders children correctly', () => {
    const component = render(
      <AnimatedMoodIcon color="#FF5733">
        <Text>Test Child</Text>
      </AnimatedMoodIcon>
    );
    
    expect(component.getByText('Test Child')).toBeTruthy();
    expect(component.toJSON()).toMatchSnapshot();
  });
}); 