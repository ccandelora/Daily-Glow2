import React from 'react';
import { View, TouchableOpacity, TextInput } from 'react-native';

/**
 * Mock implementation of the Typography component
 * This mock simplifies the component but preserves testID for test queries
 */
export const Typography = ({ children, variant, style, glow }: any) => (
  <View testID={`typography-${variant || 'default'}`}>{children}</View>
);

/**
 * Mock implementation of the Card component
 */
export const Card = ({ children, style, variant }: any) => (
  <View testID={`card-${variant || 'default'}`}>{children}</View>
);

/**
 * Mock implementation of the Button component
 */
export const Button = ({ title, onPress, variant, style }: any) => (
  <TouchableOpacity testID={`button-${title}`} onPress={onPress}>
    <View>{title}</View>
  </TouchableOpacity>
);

/**
 * Mock implementation of the Input component
 */
export const Input = ({ label, value, onChangeText, multiline, numberOfLines, placeholder }: any) => (
  <View testID={`input-${label}`}>
    <TextInput
      testID={`input-field-${label}`}
      value={value}
      onChangeText={onChangeText}
      multiline={multiline}
      numberOfLines={numberOfLines}
      placeholder={placeholder}
    />
  </View>
);

/**
 * Mock implementation of the Header component
 */
export const Header = () => <View testID="header" />;

/**
 * Mock implementation of the EmotionWheel component
 */
export const EmotionWheel = ({ onSelect }: any) => (
  <View testID="emotion-wheel">
    <TouchableOpacity
      testID="select-emotion-happy"
      onPress={() => onSelect({ id: 'happy', value: 'Happy', category: 'positive' })}
    >
      <View>Happy</View>
    </TouchableOpacity>
    <TouchableOpacity
      testID="select-emotion-sad"
      onPress={() => onSelect({ id: 'sad', value: 'Sad', category: 'negative' })}
    >
      <View>Sad</View>
    </TouchableOpacity>
  </View>
);

/**
 * Mock implementation of the VideoBackground component
 */
export const VideoBackground = () => <View testID="video-background" />;

/**
 * Mock implementation of the EmptyState component
 */
export const EmptyState = ({ message, icon }: any) => (
  <View testID="empty-state">
    <View testID="empty-state-icon">{icon}</View>
    <View testID="empty-state-message">{message}</View>
  </View>
);

/**
 * Mock implementation of the SearchInput component
 */
export const SearchInput = ({ value, onChangeText, placeholder }: any) => (
  <View testID="search-input">
    <TextInput
      testID="search-input-field"
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
    />
  </View>
);

/**
 * Collection of all component mocks for easy import
 */
export default {
  Typography,
  Card,
  Button,
  Input,
  Header,
  EmotionWheel,
  VideoBackground,
  EmptyState,
  SearchInput,
}; 