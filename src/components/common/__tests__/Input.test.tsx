import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ViewStyle } from 'react-native';
import { Input } from '../Input';
import theme from '@/constants/theme';

describe('Input Component', () => {
  test('renders correctly with default props', () => {
    const { getByTestId, toJSON } = render(
      <Input testID="test-input" placeholder="Enter text" />
    );
    
    expect(getByTestId('test-input')).toBeTruthy();
    expect(toJSON()).toMatchSnapshot('default-input');
  });
  
  test('displays label when provided', () => {
    const labelText = 'Username';
    const { getByText } = render(
      <Input label={labelText} placeholder="Enter username" />
    );
    
    expect(getByText(labelText)).toBeTruthy();
  });
  
  test('displays error message when provided', () => {
    const errorMessage = 'This field is required';
    const { getByText } = render(
      <Input error={errorMessage} placeholder="Enter text" />
    );
    
    const errorElement = getByText(errorMessage);
    expect(errorElement).toBeTruthy();
    
    // Check error text color
    expect(errorElement.props.style.some((style: any) => 
      style && style.color === theme.COLORS.status.error
    )).toBe(true);
  });
  
  test('applies error styles to input when error is provided', () => {
    const { getByTestId } = render(
      <Input 
        testID="error-input" 
        error="Error message" 
        placeholder="Enter text" 
      />
    );
    
    const inputElement = getByTestId('error-input');
    
    // Check that error style is applied (borderColor should be error color)
    expect(inputElement.props.style.some((style: any) => 
      style && style.borderColor === theme.COLORS.status.error
    )).toBe(true);
  });
  
  test('applies multiline styles when multiline prop is true', () => {
    const { getByTestId } = render(
      <Input 
        testID="multiline-input" 
        multiline={true} 
        placeholder="Enter text" 
      />
    );
    
    const inputElement = getByTestId('multiline-input');
    
    // Check that multiline is passed to TextInput
    expect(inputElement.props.multiline).toBe(true);
    
    // Check that multiline style is applied
    expect(inputElement.props.style.some((style: any) => 
      style && style.minHeight === 100 && style.textAlignVertical === 'top'
    )).toBe(true);
  });
  
  test('applies custom container styles when provided', () => {
    const containerStyle = { marginTop: 20, width: '90%' as any };
    const { toJSON } = render(
      <Input 
        containerStyle={containerStyle} 
        placeholder="Enter text" 
      />
    );
    
    // Using snapshot to verify container style since it's not directly accessible
    expect(toJSON()).toMatchSnapshot('input-with-container-style');
  });
  
  test('applies custom input styles when provided', () => {
    const inputStyle = { backgroundColor: '#F3F3F3', fontSize: 18 };
    const { getByTestId } = render(
      <Input 
        testID="styled-input" 
        style={inputStyle} 
        placeholder="Enter text" 
      />
    );
    
    const inputElement = getByTestId('styled-input');
    
    // Check that custom style is applied
    const styleArray = inputElement.props.style;
    expect(styleArray[styleArray.length - 1]).toMatchObject(inputStyle);
  });
  
  test('handles text input correctly', () => {
    const onChangeTextMock = jest.fn();
    const { getByTestId } = render(
      <Input 
        testID="change-input" 
        onChangeText={onChangeTextMock} 
        placeholder="Enter text" 
      />
    );
    
    const inputElement = getByTestId('change-input');
    const testText = 'Hello, world!';
    
    fireEvent.changeText(inputElement, testText);
    
    expect(onChangeTextMock).toHaveBeenCalledWith(testText);
  });
  
  test('passes additional props to TextInput', () => {
    const { getByTestId } = render(
      <Input 
        testID="props-input" 
        placeholder="Enter text"
        maxLength={20}
        autoCapitalize="none"
        secureTextEntry={true}
      />
    );
    
    const inputElement = getByTestId('props-input');
    
    expect(inputElement.props.maxLength).toBe(20);
    expect(inputElement.props.autoCapitalize).toBe('none');
    expect(inputElement.props.secureTextEntry).toBe(true);
  });
}); 