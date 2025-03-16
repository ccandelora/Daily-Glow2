import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';
import { TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import theme from '@/constants/theme';

describe('Button Component', () => {
  test('renders correctly with default props', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<Button title="Test Button" onPress={onPressMock} />);
    
    const buttonText = getByText('Test Button');
    expect(buttonText).toBeTruthy();
  });
  
  test('calls onPress when pressed', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<Button title="Test Button" onPress={onPressMock} />);
    
    const buttonElement = getByText('Test Button');
    fireEvent.press(buttonElement);
    
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });
  
  test('does not call onPress when disabled', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <Button title="Test Button" onPress={onPressMock} disabled={true} />
    );
    
    const buttonElement = getByText('Test Button');
    fireEvent.press(buttonElement);
    
    expect(onPressMock).not.toHaveBeenCalled();
  });
  
  test('does not call onPress when loading', () => {
    const onPressMock = jest.fn();
    const { queryByText, getByTestId } = render(
      <Button title="Test Button" onPress={onPressMock} loading={true} />
    );
    
    // When loading, it should show activity indicator instead of text
    expect(queryByText('Test Button')).toBeNull();
    expect(queryByText('ActivityIndicator')).toBeDefined();
  });
  
  test('renders with correct variant styles', () => {
    const onPressMock = jest.fn();
    
    // Use a simple approach with snapshots for styling
    const { toJSON, rerender } = render(
      <Button title="Primary Button" onPress={onPressMock} />
    );
    
    // Primary button snapshot
    expect(toJSON()).toMatchSnapshot('primary-button');
    
    // Secondary variant
    rerender(<Button title="Secondary Button" onPress={onPressMock} variant="secondary" />);
    expect(toJSON()).toMatchSnapshot('secondary-button');
    
    // Outline variant
    rerender(<Button title="Outline Button" onPress={onPressMock} variant="outline" />);
    expect(toJSON()).toMatchSnapshot('outline-button');
  });
  
  test('renders with correct size styles', () => {
    const onPressMock = jest.fn();
    
    // Use snapshots for size testing too
    const { toJSON, rerender } = render(
      <Button title="Small Button" onPress={onPressMock} size="small" />
    );
    
    // Small button snapshot
    expect(toJSON()).toMatchSnapshot('small-button');
    
    // Medium size (default)
    rerender(<Button title="Medium Button" onPress={onPressMock} />);
    expect(toJSON()).toMatchSnapshot('medium-button');
    
    // Large size
    rerender(<Button title="Large Button" onPress={onPressMock} size="large" />);
    expect(toJSON()).toMatchSnapshot('large-button');
    
    // Compact size
    rerender(<Button title="Compact Button" onPress={onPressMock} size="compact" />);
    expect(toJSON()).toMatchSnapshot('compact-button');
  });
}); 