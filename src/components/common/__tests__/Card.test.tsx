import React from 'react';
import { render } from '@testing-library/react-native';
import { Card } from '../Card';
import { Text, StyleSheet } from 'react-native';
import theme from '@/constants/theme';

describe('Card Component', () => {
  test('renders correctly with default props', () => {
    const { toJSON } = render(
      <Card>
        <Text>Test Content</Text>
      </Card>
    );
    
    expect(toJSON()).toMatchSnapshot();
  });
  
  test('renders with correct default styles', () => {
    const { getByTestId } = render(
      <Card testID="card-container">
        <Text>Test Content</Text>
      </Card>
    );
    
    const cardContainer = getByTestId('card-container');
    
    // Check specific style properties instead of the entire style object
    expect(cardContainer.props.style[0]).toMatchObject({
      backgroundColor: theme.COLORS.ui.card,
      borderRadius: theme.BORDER_RADIUS.lg,
      padding: theme.SPACING.lg,
    });
  });
  
  test('applies the elevated style when variant is elevated', () => {
    const { getByTestId } = render(
      <Card variant="elevated" testID="card-container">
        <Text>Elevated Card</Text>
      </Card>
    );
    
    const cardContainer = getByTestId('card-container');
    
    // Testing specific style properties from the elevated style
    expect(cardContainer.props.style[0]).toMatchObject({
      backgroundColor: theme.COLORS.ui.card,
    });
    expect(cardContainer.props.style[1]).toMatchObject({
      backgroundColor: theme.COLORS.ui.background,
      borderColor: theme.COLORS.ui.accent,
    });
  });
  
  test('applies the glow style when variant is glow', () => {
    const { getByTestId } = render(
      <Card variant="glow" testID="card-container">
        <Text>Glowing Card</Text>
      </Card>
    );
    
    const cardContainer = getByTestId('card-container');
    
    // Testing specific style properties from the glow style
    expect(cardContainer.props.style[0]).toMatchObject({
      backgroundColor: theme.COLORS.ui.card,
    });
    expect(cardContainer.props.style[2]).toMatchObject({
      backgroundColor: 'rgba(38, 20, 60, 0.95)',
      borderColor: theme.COLORS.ui.accent,
    });
  });
  
  test('applies custom styles when provided', () => {
    const customStyle = {
      backgroundColor: 'purple',
      margin: 20,
    };
    
    const { getByTestId } = render(
      <Card style={customStyle} testID="card-container">
        <Text>Custom Styled Card</Text>
      </Card>
    );
    
    const cardContainer = getByTestId('card-container');
    
    // Custom styles should be applied as the fourth item in the style array
    expect(cardContainer.props.style[3]).toMatchObject(customStyle);
  });
  
  test('passes additional props to View component', () => {
    const accessibilityLabel = 'Card component with accessibility label';
    const { getByTestId } = render(
      <Card testID="card-container" accessibilityLabel={accessibilityLabel}>
        <Text>Accessible Card</Text>
      </Card>
    );
    
    const cardContainer = getByTestId('card-container');
    expect(cardContainer.props.accessibilityLabel).toBe(accessibilityLabel);
  });
}); 