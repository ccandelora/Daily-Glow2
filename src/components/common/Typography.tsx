import React from 'react';
import { Text, TextStyle, TextProps } from 'react-native';
import theme from '@/constants/theme';

type TypographyVariant = 'h1' | 'h2' | 'h3' | 'body' | 'caption';

export interface TypographyProps extends Omit<TextProps, 'style'> {
  variant?: TypographyVariant;
  color?: string;
  style?: TextStyle | TextStyle[];
  children: React.ReactNode;
}

export const Typography: React.FC<TypographyProps> = ({
  variant = 'body',
  color = theme.COLORS.ui.text,
  style,
  children,
  ...props
}) => {
  const variantStyles: Record<TypographyVariant, TextStyle> = {
    h1: {
      fontSize: theme.FONTS.sizes.xxl,
      fontWeight: theme.FONTS.weights.bold,
      lineHeight: theme.FONTS.sizes.xxl * 1.2,
    },
    h2: {
      fontSize: theme.FONTS.sizes.xl,
      fontWeight: theme.FONTS.weights.bold,
      lineHeight: theme.FONTS.sizes.xl * 1.2,
    },
    h3: {
      fontSize: theme.FONTS.sizes.lg,
      fontWeight: theme.FONTS.weights.semibold,
      lineHeight: theme.FONTS.sizes.lg * 1.2,
    },
    body: {
      fontSize: theme.FONTS.sizes.md,
      fontWeight: theme.FONTS.weights.regular,
      lineHeight: theme.FONTS.sizes.md * 1.5,
    },
    caption: {
      fontSize: theme.FONTS.sizes.sm,
      fontWeight: theme.FONTS.weights.regular,
      lineHeight: theme.FONTS.sizes.sm * 1.5,
    },
  };

  return (
    <Text
      style={[
        variantStyles[variant],
        { color },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}; 