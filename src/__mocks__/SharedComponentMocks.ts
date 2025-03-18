/**
 * Shared component mocks using the dynamic require approach
 * This approach avoids the "module factory of jest.mock() is not allowed 
 * to reference any out-of-scope variables" error.
 */

import React from 'react';

module.exports = {
  /**
   * Creates mock implementations for common UI components
   */
  createCommonComponentMocks: () => {
    const React = require('react');
    const { View, Text, TouchableOpacity, TextInput } = require('react-native');
    
    return {
      // Typography component mock
      Typography: ({ 
        children, 
        variant, 
        style, 
        glow, 
        color, 
        ...props 
      }: { 
        children: React.ReactNode; 
        variant?: string; 
        style?: any; 
        glow?: boolean; 
        color?: string; 
        [key: string]: any;
      }) => 
        React.createElement(View, { 
          testID: `typography-${variant || 'default'}`, 
          style 
        }, React.createElement(Text, { style: { color } }, children)),
      
      // Button component mock
      Button: ({ 
        title, 
        onPress, 
        variant, 
        style, 
        disabled, 
        ...props 
      }: { 
        title: string; 
        onPress?: () => void; 
        variant?: string; 
        style?: any; 
        disabled?: boolean; 
        [key: string]: any;
      }) => 
        React.createElement(TouchableOpacity, { 
          testID: `button-${title}`, 
          onPress,
          disabled,
          style,
          accessibilityRole: 'button'
        }, React.createElement(Text, null, title)),
      
      // Input component mock
      Input: ({ 
        label, 
        value, 
        onChangeText, 
        placeholder, 
        secureTextEntry, 
        error, 
        ...props 
      }: { 
        label: string; 
        value?: string; 
        onChangeText?: (text: string) => void; 
        placeholder?: string; 
        secureTextEntry?: boolean; 
        error?: string; 
        [key: string]: any;
      }) =>
        React.createElement(View, { 
          testID: `input-${label}` 
        }, [
          React.createElement(Text, { key: 'label' }, label),
          React.createElement(TextInput, { 
            key: 'input',
            value, 
            onChangeText,
            placeholder,
            secureTextEntry,
            testID: `input-field-${label}`
          }),
          error ? React.createElement(Text, { key: 'error', testID: 'input-error' }, error) : null
        ]),
        
      // Card component mock
      Card: ({ 
        children, 
        style, 
        ...props 
      }: { 
        children: React.ReactNode; 
        style?: any; 
        [key: string]: any;
      }) =>
        React.createElement(View, {
          testID: 'card',
          style: [{ padding: 16, margin: 8, borderRadius: 8 }, style],
          ...props
        }, children),
      
      // Header component mock
      Header: ({ 
        title, 
        leftButton, 
        rightButton, 
        ...props 
      }: { 
        title: string; 
        leftButton?: React.ReactNode; 
        rightButton?: React.ReactNode; 
        [key: string]: any;
      }) =>
        React.createElement(View, {
          testID: 'header',
          style: { height: 56, flexDirection: 'row', alignItems: 'center' }
        }, [
          leftButton && React.createElement(View, { key: 'left', testID: 'header-left' }, leftButton),
          React.createElement(View, { key: 'title', testID: 'header-title', style: { flex: 1 } },
            React.createElement(Text, null, title)
          ),
          rightButton && React.createElement(View, { key: 'right', testID: 'header-right' }, rightButton)
        ]),
      
      // LoadingIndicator component mock
      LoadingIndicator: ({ 
        size, 
        color, 
        ...props 
      }: { 
        size?: 'small' | 'large' | number; 
        color?: string; 
        [key: string]: any;
      }) =>
        React.createElement(View, {
          testID: 'loading-indicator',
          ...props
        }),
      
      // LoadingSpinner component mock
      LoadingSpinner: ({ 
        size, 
        color, 
        ...props 
      }: { 
        size?: 'small' | 'large' | number; 
        color?: string; 
        [key: string]: any;
      }) =>
        React.createElement(View, {
          testID: 'loading-spinner',
          ...props
        }),
      
      // EmotionWheel component mock
      EmotionWheel: ({ 
        onSelect, 
        ...props 
      }: { 
        onSelect?: (emotion: { id: string; name: string }) => void; 
        [key: string]: any;
      }) =>
        React.createElement(View, {
          testID: 'emotion-wheel',
          ...props
        }, [
          React.createElement(TouchableOpacity, {
            key: 'happy',
            testID: 'select-emotion-happy',
            onPress: () => onSelect?.({ id: 'happy', name: 'Happy' })
          }),
          React.createElement(TouchableOpacity, {
            key: 'sad',
            testID: 'select-emotion-sad',
            onPress: () => onSelect?.({ id: 'sad', name: 'Sad' })
          })
        ]),
      
      // VideoBackground component mock
      VideoBackground: ({ 
        children, 
        ...props 
      }: { 
        children: React.ReactNode; 
        [key: string]: any;
      }) =>
        React.createElement(View, {
          testID: 'video-background',
          ...props
        }, children),
      
      // Toast component mock
      Toast: ({ 
        message, 
        type, 
        duration, 
        ...props 
      }: { 
        message: string; 
        type?: 'success' | 'error' | 'info' | 'warning'; 
        duration?: number; 
        [key: string]: any;
      }) =>
        React.createElement(View, {
          testID: `toast-${type || 'default'}`,
          ...props
        }, React.createElement(Text, null, message))
    };
  }
}; 