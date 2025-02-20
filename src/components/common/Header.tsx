import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from './Typography';
import theme from '@/constants/theme';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onBack,
  rightElement,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      styles.container,
      { paddingTop: Math.max(insets.top, theme.SPACING.lg) }
    ]}>
      <View style={styles.content}>
        {onBack && (
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="chevron-back"
              size={28}
              color={theme.COLORS.ui.text}
            />
          </TouchableOpacity>
        )}
        
        <View style={styles.titleContainer}>
          <Typography variant="h2" style={styles.title} numberOfLines={2}>
            {title}
          </Typography>
        </View>

        <View style={styles.rightElement}>
          {rightElement}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.COLORS.ui.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.ui.border,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.SPACING.lg,
    paddingBottom: theme.SPACING.md,
    minHeight: 44,
  },
  backButton: {
    marginRight: theme.SPACING.sm,
    marginLeft: -theme.SPACING.sm,
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: theme.SPACING.sm,
  },
  title: {
    textAlign: 'left',
    paddingRight: theme.SPACING.xl,
  },
  rightElement: {
    marginLeft: 'auto',
  },
}); 