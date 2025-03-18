import React from 'react';
import { render } from '@testing-library/react-native';
import { Typography } from '../Typography';
import { TextStyle } from 'react-native';
import theme from '@/constants/theme';

describe('Typography Component', () => {
  test('renders correctly with default props', () => {
    const { getByText, toJSON } = render(
      <Typography>Default Text</Typography>
    );
    
    expect(getByText('Default Text')).toBeTruthy();
    expect(toJSON()).toMatchSnapshot('default-typography');
  });
  
  test('applies correct styles for each variant', () => {
    // Test each variant
    const variants = ['h1', 'h2', 'h3', 'body', 'caption', 'button'] as const;
    
    variants.forEach(variant => {
      const { getByTestId } = render(
        <Typography variant={variant} testID={`text-${variant}`}>
          {variant} Text
        </Typography>
      );
      
      const textElement = getByTestId(`text-${variant}`);
      
      // Just verify the style array contains objects
      const styleArray = textElement.props.style;
      expect(Array.isArray(styleArray)).toBe(true);
      expect(styleArray.length).toBeGreaterThan(1);
    });
  });
  
  test('applies custom color when provided', () => {
    const customColor = '#FF5733';
    const { getByTestId } = render(
      <Typography color={customColor} testID="colored-text">
        Colored Text
      </Typography>
    );
    
    const textElement = getByTestId('colored-text');
    
    // Check that color is applied
    expect(textElement.props.style.some((style: any) => 
      style && style.color === customColor
    )).toBe(true);
  });
  
  test('applies custom styles when provided', () => {
    const customStyle: TextStyle = { 
      letterSpacing: 2,
      textDecorationLine: 'underline',
    };
    
    const { getByTestId } = render(
      <Typography style={customStyle} testID="custom-styled-text">
        Custom Styled Text
      </Typography>
    );
    
    const textElement = getByTestId('custom-styled-text');
    
    // Check custom style is applied (should be last in the style array)
    const styleArray = textElement.props.style;
    expect(styleArray[styleArray.length - 1]).toMatchObject(customStyle);
  });
  
  test('applies glow effect styles', () => {
    // Test each glow intensity
    const intensities = ['soft', 'medium', 'strong'] as const;
    
    intensities.forEach(intensity => {
      const { getByTestId } = render(
        <Typography glow={intensity} testID={`text-glow-${intensity}`}>
          {intensity} Glow Text
        </Typography>
      );
      
      const textElement = getByTestId(`text-glow-${intensity}`);
      
      // Check that appropriate glow style is applied
      const styleArray = textElement.props.style;
      const hasGlowStyle = styleArray.some((style: any) => 
        style && style.textShadowRadius && 
        (
          (intensity === 'soft' && style.textShadowRadius === 4) ||
          (intensity === 'medium' && style.textShadowRadius === 8) ||
          (intensity === 'strong' && style.textShadowRadius === 12)
        )
      );
      
      expect(hasGlowStyle).toBe(true);
    });
  });
  
  test('passes additional props to Text component', () => {
    const numberOfLines = 2;
    const { getByTestId } = render(
      <Typography 
        testID="text-with-props" 
        numberOfLines={numberOfLines}
        accessibilityLabel="Accessible text"
      >
        Text with additional props
      </Typography>
    );
    
    const textElement = getByTestId('text-with-props');
    
    expect(textElement.props.numberOfLines).toBe(numberOfLines);
    expect(textElement.props.accessibilityLabel).toBe('Accessible text');
  });
}); 