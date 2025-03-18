import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SearchInput } from '@/components/common/SearchInput';
import { TextInput, TouchableOpacity } from 'react-native';

// Mock FontAwesome6 from @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  FontAwesome6: 'FontAwesome6'
}));

describe('SearchInput Component', () => {
  const mockOnChangeText = jest.fn();
  const mockOnClear = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with default props', () => {
    const { toJSON, getByPlaceholderText } = render(
      <SearchInput value="" onChangeText={mockOnChangeText} />
    );
    
    // Should have rendered a TextInput with the correct placeholder
    expect(getByPlaceholderText('Search...')).toBeTruthy();
    
    // Should match snapshot
    expect(toJSON()).toMatchSnapshot();
  });

  it('passes the value to the TextInput', () => {
    const testValue = 'test search';
    const { getByDisplayValue } = render(
      <SearchInput value={testValue} onChangeText={mockOnChangeText} />
    );
    
    // Input should have the provided value
    expect(getByDisplayValue(testValue)).toBeTruthy();
  });

  it('calls onChangeText when text changes', () => {
    const { getByPlaceholderText } = render(
      <SearchInput value="" onChangeText={mockOnChangeText} />
    );
    
    const inputElement = getByPlaceholderText('Search...');
    const newValue = 'new search text';
    
    fireEvent.changeText(inputElement, newValue);
    
    // onChangeText should be called with the new value
    expect(mockOnChangeText).toHaveBeenCalledWith(newValue);
  });

  it('displays the clear button when value is not empty', () => {
    const { UNSAFE_getAllByType } = render(
      <SearchInput value="test" onChangeText={mockOnChangeText} onClear={mockOnClear} />
    );
    
    // Should have a TouchableOpacity for clearing
    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    expect(touchables.length).toBe(1); // One clear button
  });

  it('does not display the clear button when value is empty', () => {
    const { UNSAFE_queryAllByType } = render(
      <SearchInput value="" onChangeText={mockOnChangeText} onClear={mockOnClear} />
    );
    
    // Should not have a TouchableOpacity for clearing
    const touchables = UNSAFE_queryAllByType(TouchableOpacity);
    expect(touchables.length).toBe(0); // No clear button
  });

  it('calls onClear when clear button is pressed', () => {
    const { UNSAFE_getAllByType } = render(
      <SearchInput value="test" onChangeText={mockOnChangeText} onClear={mockOnClear} />
    );
    
    const clearButton = UNSAFE_getAllByType(TouchableOpacity)[0];
    fireEvent.press(clearButton);
    
    // onClear should be called
    expect(mockOnClear).toHaveBeenCalledTimes(1);
  });

  it('allows custom placeholder text', () => {
    const customPlaceholder = 'Find something...';
    const { getByPlaceholderText } = render(
      <SearchInput value="" onChangeText={mockOnChangeText} placeholder={customPlaceholder} />
    );
    
    // Should use the custom placeholder
    expect(getByPlaceholderText(customPlaceholder)).toBeTruthy();
  });

  it('applies custom style to container', () => {
    const customStyle = { backgroundColor: 'red' };
    const { toJSON } = render(
      <SearchInput value="" onChangeText={mockOnChangeText} style={customStyle} />
    );
    
    // Get the snapshot and check it contains our custom style
    const snapshot = toJSON();
    expect(snapshot).toMatchSnapshot();
  });
}); 