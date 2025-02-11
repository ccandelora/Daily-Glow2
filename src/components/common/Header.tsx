import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Typography } from './Typography';
import theme from '../../constants/theme';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: {
    label: string;
    onPress: () => void;
  };
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onBack,
  rightAction,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.leftContainer}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Typography>←</Typography>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.titleContainer}>
        <Typography variant="h2" style={styles.title}>
          {title}
        </Typography>
      </View>

      <View style={styles.rightContainer}>
        {rightAction && (
          <TouchableOpacity onPress={rightAction.onPress}>
            <Typography color={theme.COLORS.primary.green}>
              {rightAction.label}
            </Typography>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.SPACING.md,
    paddingVertical: theme.SPACING.lg,
    backgroundColor: theme.COLORS.ui.background,
  },
  leftContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 2,
    alignItems: 'center',
  },
  rightContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  title: {
    textAlign: 'center',
  },
  backButton: {
    padding: theme.SPACING.sm,
    marginLeft: -theme.SPACING.sm,
  },
}); 