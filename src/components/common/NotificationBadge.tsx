import React, { useEffect } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Typography } from './Typography';
import { useNotifications } from '@/contexts/NotificationsContext';
import theme from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface NotificationBadgeProps {
  size?: number;
  color?: string;
  onPress?: () => void;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  size = 24,
  color = theme.COLORS.ui.text,
  onPress,
}) => {
  const { unreadCount } = useNotifications();
  const scaleAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (unreadCount > 0) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 3,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [unreadCount]);

  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container onPress={onPress} style={styles.container}>
      <Ionicons
        name="notifications-outline"
        size={size}
        color={color}
      />
      {unreadCount > 0 && (
        <Animated.View
          style={[
            styles.badge,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Typography
            variant="caption"
            style={styles.badgeText}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Typography>
        </Animated.View>
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.COLORS.primary.red,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: theme.COLORS.ui.background,
  },
  badgeText: {
    color: theme.COLORS.ui.background,
    fontSize: 10,
    fontWeight: 'bold',
  },
}); 