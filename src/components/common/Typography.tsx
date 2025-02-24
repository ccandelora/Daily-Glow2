import React from 'react';
import { Text, StyleSheet, TextStyle, TextProps } from 'react-native';
import theme from '@/constants/theme';

type GlowIntensity = 'none' | 'soft' | 'medium' | 'strong';

interface TypographyProps extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'button';
  color?: string;
  style?: TextStyle;
  glow?: GlowIntensity;
}

export const Typography: React.FC<TypographyProps> = ({
  children,
  variant = 'body',
  color,
  style,
  glow = 'none',
  ...props
}) => {
  const getGlowStyle = (intensity: GlowIntensity) => {
    if (intensity === 'none') return null;
    const glowStyles = {
      soft: styles.glowSoft,
      medium: styles.glowMedium,
      strong: styles.glowStrong,
    };
    return glowStyles[intensity];
  };

  return (
    <Text
      style={[
        styles.base,
        styles[variant],
        color && { color },
        getGlowStyle(glow),
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  base: {
    color: theme.COLORS.ui.text,
    fontSize: theme.FONTS.sizes.md,
    fontFamily: theme.FONTS.families.body,
  },
  h1: {
    fontSize: theme.FONTS.sizes.xxxl,
    fontWeight: theme.FONTS.weights.bold,
    fontFamily: theme.FONTS.families.heading,
    color: theme.COLORS.ui.text,
    textShadowColor: theme.COLORS.ui.accent,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  h2: {
    fontSize: theme.FONTS.sizes.xxl,
    fontWeight: theme.FONTS.weights.bold,
    fontFamily: theme.FONTS.families.heading,
    color: theme.COLORS.ui.text,
    textShadowColor: theme.COLORS.ui.accent,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  h3: {
    fontSize: theme.FONTS.sizes.xl,
    fontWeight: theme.FONTS.weights.semibold,
    fontFamily: theme.FONTS.families.heading,
    color: theme.COLORS.ui.text,
    textShadowColor: theme.COLORS.ui.accent,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  body: {
    fontSize: theme.FONTS.sizes.md,
    fontWeight: theme.FONTS.weights.regular,
    lineHeight: 24,
    color: theme.COLORS.ui.textSecondary,
  },
  caption: {
    fontSize: theme.FONTS.sizes.sm,
    fontWeight: theme.FONTS.weights.regular,
    color: theme.COLORS.ui.textSecondary,
  },
  button: {
    fontSize: theme.FONTS.sizes.md,
    fontWeight: theme.FONTS.weights.semibold,
    textAlign: 'center',
  },
  glowSoft: {
    textShadowColor: theme.COLORS.ui.accent,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  glowMedium: {
    textShadowColor: theme.COLORS.ui.accent,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  glowStrong: {
    textShadowColor: theme.COLORS.ui.accent,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
}); 