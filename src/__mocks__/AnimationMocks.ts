/**
 * Animation mocks using the dynamic require approach
 * These mocks help with testing components that use React Native's Animated API
 */

import React from 'react';

module.exports = {
  /**
   * Creates mock implementations for React Native's Animated API
   */
  createAnimationMocks: () => {
    const React = require('react');
    const { View, Text } = require('react-native');
    
    // Mock implementations with controlled animations
    const mockStart = jest.fn((callback?: (result: { finished: boolean }) => void) => {
      if (callback) {
        callback({ finished: true });
      }
      return { stop: jest.fn() };
    });
    
    // Create a standardized animation mock
    const createAnimationMock = () => ({
      start: mockStart,
      stop: jest.fn(),
      reset: jest.fn(),
    });
    
    return {
      // Core Animated components
      View: React.forwardRef((props: any, ref: React.Ref<any>) => 
        React.createElement(View, { 
          ...props, 
          ref, 
          testID: props.testID || 'animated-view' 
        })),
      
      Text: React.forwardRef((props: any, ref: React.Ref<any>) => 
        React.createElement(Text, { 
          ...props, 
          ref, 
          testID: props.testID || 'animated-text' 
        })),
      
      Image: React.forwardRef((props: any, ref: React.Ref<any>) => 
        React.createElement('img', { 
          ...props, 
          ref, 
          testID: props.testID || 'animated-image' 
        })),
      
      // Animation creation functions
      timing: jest.fn(() => createAnimationMock()),
      spring: jest.fn(() => createAnimationMock()),
      decay: jest.fn(() => createAnimationMock()),
      
      // Animation combination functions
      sequence: jest.fn(() => createAnimationMock()),
      parallel: jest.fn(() => createAnimationMock()),
      stagger: jest.fn(() => createAnimationMock()),
      loop: jest.fn((animation: any, config?: any) => createAnimationMock()),
      
      // Values and listeners
      Value: jest.fn((initial: number) => {
        let value = initial;
        return {
          _value: initial,
          setValue: jest.fn((newValue: number) => { value = newValue; }),
          setOffset: jest.fn(),
          flattenOffset: jest.fn(),
          extractOffset: jest.fn(),
          addListener: jest.fn(),
          removeAllListeners: jest.fn(),
          removeListener: jest.fn(),
          stopAnimation: jest.fn((callback?: (value: number) => void) => callback && callback(value)),
          resetAnimation: jest.fn(),
          interpolate: jest.fn(() => ({ _interpolation: true, interpolate: jest.fn() })),
          stopTracking: jest.fn(),
          __getValue: jest.fn(() => value),
        };
      }),
      
      // Other utilities
      createAnimatedComponent: jest.fn((Component: React.ComponentType<any>) => 
        React.forwardRef((props: any, ref: React.Ref<any>) =>
          React.createElement(Component, { 
            ...props, 
            ref, 
            testID: props.testID || 'animated-component' 
          })
        )
      ),
      
      // Easing functions
      Easing: {
        linear: jest.fn((t: number) => t),
        quad: jest.fn((t: number) => t * t),
        cubic: jest.fn((t: number) => t * t * t),
        ease: jest.fn((t: number) => t),
        elastic: jest.fn(() => jest.fn((t: number) => t)),
        back: jest.fn(() => jest.fn((t: number) => t)),
        bounce: jest.fn(() => jest.fn((t: number) => t)),
        bezier: jest.fn(() => jest.fn((t: number) => t)),
        circle: jest.fn((t: number) => t),
        sin: jest.fn((t: number) => t),
        exp: jest.fn((t: number) => t),
        in: jest.fn((easing: (t: number) => number) => jest.fn((t: number) => t)),
        out: jest.fn((easing: (t: number) => number) => jest.fn((t: number) => t)),
        inOut: jest.fn((easing: (t: number) => number) => jest.fn((t: number) => t)),
      },
      
      // Mock event system
      event: jest.fn(() => jest.fn()),
    };
  }
}; 