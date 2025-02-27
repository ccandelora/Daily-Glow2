import React from 'react';
import { TextInput, View, StyleSheet, TextInputProps, TouchableOpacity } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import theme from '@/constants/theme';

interface SearchInputProps extends TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChangeText,
  onClear,
  placeholder = "Search...",
  style,
  ...props
}) => {
  return (
    <View style={[styles.container, style]}>
      <FontAwesome6 
        name="search" 
        size={18} 
        color={theme.COLORS.ui.textSecondary}
        style={styles.searchIcon}
      />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.COLORS.ui.textSecondary}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="never"
        returnKeyType="search"
        {...props}
      />
      {value ? (
        <TouchableOpacity
          onPress={onClear}
          style={styles.clearButton}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <FontAwesome6 
            name="circle-xmark" 
            size={18} 
            color={theme.COLORS.ui.textSecondary} 
          />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.COLORS.ui.card}80`,
    borderRadius: theme.BORDER_RADIUS.md,
    paddingHorizontal: theme.SPACING.md,
    borderWidth: 1,
    borderColor: `${theme.COLORS.ui.border}50`,
    height: 50,
  },
  searchIcon: {
    marginRight: theme.SPACING.sm,
  },
  input: {
    flex: 1,
    height: '100%',
    color: theme.COLORS.ui.text,
    fontSize: 16,
    paddingVertical: 0,
  },
  clearButton: {
    padding: theme.SPACING.xs,
    marginLeft: theme.SPACING.xs,
  },
}); 