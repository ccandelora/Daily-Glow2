import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from './Typography';
import theme from '@/constants/theme';

interface HeaderProps {
  title?: string;
  onBack?: () => void;
  rightAction?: {
    label: string;
    onPress: () => void | Promise<void>;
  };
  showBranding?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onBack,
  rightAction,
  showBranding = true,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      styles.container,
      { paddingTop: Math.max(insets.top, theme.SPACING.lg) }
    ]}>
      {showBranding && (
        <View style={styles.branding}>
          <Typography 
            variant="h1" 
            style={styles.brandText}
            glow="medium"
            color={theme.COLORS.primary.green}
          >
            Daily Glow
          </Typography>
        </View>
      )}
      
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
        
        {title && (
          <View style={styles.titleContainer}>
            <Typography 
              variant="h2" 
              style={styles.title}
              glow="soft"
            >
              {title}
            </Typography>
          </View>
        )}

        <View style={styles.rightElement}>
          {rightAction && (
            <TouchableOpacity
              onPress={rightAction.onPress}
              style={styles.rightActionButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Typography 
                variant="body" 
                style={styles.rightActionLabel}
                glow="soft"
              >
                {rightAction.label}
              </Typography>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    paddingBottom: theme.SPACING.md,
  },
  branding: {
    alignItems: 'center',
    marginBottom: theme.SPACING.md,
    paddingHorizontal: theme.SPACING.lg,
  },
  brandText: {
    fontSize: 36,
    textAlign: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.SPACING.lg,
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
    color: theme.COLORS.ui.text,
  },
  rightElement: {
    marginLeft: 'auto',
  },
  rightActionButton: {
    padding: theme.SPACING.sm,
  },
  rightActionLabel: {
    textAlign: 'center',
    color: theme.COLORS.ui.text,
  },
}); 