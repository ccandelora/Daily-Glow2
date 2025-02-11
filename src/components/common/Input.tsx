import React from 'react';
import { TextInput, View, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { Typography } from './Typography';
import theme from '../../constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  multiline?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  style,
  multiline = false,
  ...props
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Typography variant="caption" style={styles.label}>
          {label}
        </Typography>
      )}
      <TextInput
        style={[
          styles.input,
          multiline && styles.multiline,
          error && styles.errorInput,
          style,
        ]}
        placeholderTextColor={theme.COLORS.ui.textSecondary}
        multiline={multiline}
        {...props}
      />
      {error && (
        <Typography variant="caption" color={theme.COLORS.status.error} style={styles.error}>
          {error}
        </Typography>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.SPACING.md,
  },
  label: {
    marginBottom: theme.SPACING.xs,
  },
  input: {
    backgroundColor: theme.COLORS.ui.card,
    borderRadius: theme.BORDER_RADIUS.md,
    padding: theme.SPACING.md,
    color: theme.COLORS.ui.text,
    fontSize: theme.FONTS.sizes.md,
    borderWidth: 1,
    borderColor: theme.COLORS.ui.border,
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorInput: {
    borderColor: theme.COLORS.status.error,
  },
  error: {
    marginTop: theme.SPACING.xs,
  },
}); 