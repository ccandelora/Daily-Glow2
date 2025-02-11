import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { Typography } from './Typography';
import theme from '@/constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  style,
  textStyle,
  disabled = false,
}) => {
  const getButtonStyle = (): StyleProp<ViewStyle> => {
    const baseStyle = styles.button;
    const variantStyle = variant === 'secondary' ? styles.secondaryButton : {};
    const disabledStyle = disabled ? styles.disabledButton : {};
    const customStyle = style || {};
    
    return [baseStyle, variantStyle, disabledStyle, customStyle];
  };

  const getTextStyle = (): StyleProp<TextStyle> => {
    const baseStyle = styles.text;
    const variantStyle = variant === 'secondary' ? styles.secondaryText : {};
    const disabledStyle = disabled ? styles.disabledText : {};
    const customStyle = textStyle || {};
    
    return [baseStyle, variantStyle, disabledStyle, customStyle];
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={disabled ? 1 : 0.8}
    >
      <Typography style={getTextStyle()}>{title}</Typography>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.COLORS.primary.green,
    paddingVertical: theme.SPACING.sm,
    paddingHorizontal: theme.SPACING.md,
    borderRadius: theme.BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.COLORS.primary.green,
  },
  disabledButton: {
    backgroundColor: theme.COLORS.ui.disabled,
    borderColor: theme.COLORS.ui.disabled,
  },
  text: {
    color: theme.COLORS.ui.background,
    fontWeight: '600',
  },
  secondaryText: {
    color: theme.COLORS.primary.green,
  },
  disabledText: {
    color: theme.COLORS.ui.textSecondary,
  },
}); 