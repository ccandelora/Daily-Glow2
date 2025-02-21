import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, TextStyle, ActivityIndicator, StyleProp } from 'react-native';
import { Typography } from './Typography';
import theme from '@/constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        styles[size],
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' ? theme.COLORS.primary.green : theme.COLORS.ui.background}
          size="small"
        />
      ) : (
        <Typography
          variant="button"
          style={[
            styles.text,
            styles[`${variant}Text` as keyof typeof styles] as TextStyle,
            disabled && styles.disabledText,
            textStyle,
          ].filter(Boolean) as TextStyle}
        >
          {title}
        </Typography>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: theme.COLORS.ui.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primary: {
    backgroundColor: theme.COLORS.ui.accent,
    borderWidth: 0,
    shadowColor: theme.COLORS.ui.accent,
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  secondary: {
    backgroundColor: 'rgba(65, 105, 225, 0.1)',
    borderWidth: 1,
    borderColor: theme.COLORS.ui.accent,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.COLORS.ui.border,
  },
  small: {
    paddingVertical: theme.SPACING.sm,
    paddingHorizontal: theme.SPACING.lg,
    minWidth: 100,
  },
  medium: {
    paddingVertical: theme.SPACING.md,
    paddingHorizontal: theme.SPACING.xl,
    minWidth: 150,
  },
  large: {
    paddingVertical: theme.SPACING.lg,
    paddingHorizontal: theme.SPACING.xl * 1.5,
    minWidth: 200,
  },
  disabled: {
    backgroundColor: theme.COLORS.ui.disabled,
    borderColor: 'transparent',
    shadowOpacity: 0,
  },
  text: {
    textAlign: 'center',
  },
  primaryText: {
    color: theme.COLORS.ui.text,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  secondaryText: {
    color: theme.COLORS.ui.accent,
    textShadowColor: theme.COLORS.ui.accent,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  outlineText: {
    color: theme.COLORS.ui.text,
  },
  disabledText: {
    color: theme.COLORS.ui.textSecondary,
  },
}); 