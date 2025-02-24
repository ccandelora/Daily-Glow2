import React from 'react';
import { View, StyleSheet, ViewStyle, ViewProps } from 'react-native';
import theme from '@/constants/theme';

interface CardProps extends ViewProps {
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'glow';
}

export const Card: React.FC<CardProps> = ({ children, style, variant = 'default', ...props }) => {
  return (
    <View 
      style={[
        styles.card,
        variant === 'elevated' && styles.elevated,
        variant === 'glow' && styles.glow,
        style
      ]} 
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.COLORS.ui.card,
    borderRadius: theme.BORDER_RADIUS.lg,
    padding: theme.SPACING.lg,
    borderWidth: 1,
    borderColor: theme.COLORS.ui.border,
    shadowColor: theme.COLORS.ui.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  elevated: {
    backgroundColor: theme.COLORS.ui.background,
    borderColor: theme.COLORS.ui.accent,
    shadowColor: theme.COLORS.ui.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  glow: {
    backgroundColor: 'rgba(38, 20, 60, 0.95)',
    borderColor: theme.COLORS.ui.accent,
    shadowColor: theme.COLORS.ui.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
}); 