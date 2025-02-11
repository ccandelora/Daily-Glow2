import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import theme from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
}) => {
  return (
    <View
      style={[
        styles.card,
        variant === 'elevated' && styles.elevated,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.COLORS.ui.card,
    borderRadius: theme.BORDER_RADIUS.lg,
    padding: theme.SPACING.md,
    marginVertical: theme.SPACING.sm,
  },
  elevated: {
    shadowColor: theme.COLORS.ui.text,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
}); 