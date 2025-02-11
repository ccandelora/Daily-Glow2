import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Typography } from './Typography';
import theme from '@/constants/theme';

interface LoadingOverlayProps {
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message }) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={theme.COLORS.primary.green} />
        {message && (
          <Typography
            variant="body"
            color={theme.COLORS.ui.textSecondary}
            style={styles.message}
          >
            {message}
          </Typography>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  content: {
    backgroundColor: theme.COLORS.ui.card,
    padding: theme.SPACING.xl,
    borderRadius: theme.BORDER_RADIUS.lg,
    alignItems: 'center',
  },
  message: {
    marginTop: theme.SPACING.md,
    textAlign: 'center',
  },
}); 