import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import theme from '../../constants/theme';

interface ProgressBarProps {
  progress: number; // 0 to 1
  color?: string;
  style?: ViewStyle;
  height?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color = theme.COLORS.primary.green,
  style,
  height = 4,
}) => {
  const validProgress = Math.min(Math.max(progress, 0), 1);

  return (
    <View style={[styles.container, { height }, style]}>
      <View
        style={[
          styles.progress,
          {
            width: `${validProgress * 100}%`,
            backgroundColor: color,
            height,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: theme.COLORS.ui.border,
    borderRadius: theme.BORDER_RADIUS.circle,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    borderRadius: theme.BORDER_RADIUS.circle,
  },
}); 