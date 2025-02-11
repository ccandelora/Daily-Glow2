import React from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';
import theme from '@/constants/theme';

interface TypographyProps {
  children: React.ReactNode;
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption';
  style?: StyleProp<TextStyle>;
  color?: string;
}

export const Typography: React.FC<TypographyProps> = ({
  children,
  variant = 'body',
  style,
  color,
}) => {
  const getVariantStyle = (): TextStyle => {
    switch (variant) {
      case 'h1':
        return {
          fontSize: theme.FONTS.sizes.xxl,
          fontWeight: theme.FONTS.weights.bold,
        };
      case 'h2':
        return {
          fontSize: theme.FONTS.sizes.xl,
          fontWeight: theme.FONTS.weights.bold,
        };
      case 'h3':
        return {
          fontSize: theme.FONTS.sizes.lg,
          fontWeight: theme.FONTS.weights.semibold,
        };
      case 'caption':
        return {
          fontSize: theme.FONTS.sizes.sm,
          color: theme.COLORS.ui.textSecondary,
        };
      default:
        return {
          fontSize: theme.FONTS.sizes.md,
        };
    }
  };

  return (
    <Text style={[
      { color: color || theme.COLORS.ui.text },
      getVariantStyle(),
      style
    ]}>
      {children}
    </Text>
  );
}; 