import React, { useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Animated, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography, Card, Header } from '@/components/common';
import { useNotifications } from '@/contexts/NotificationsContext';
import theme from '@/constants/theme';
import { FontAwesome6 } from '@expo/vector-icons';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { getCompatibleIconName } from '@/utils/iconUtils';

const getCardStyle = (isUnread: boolean): ViewStyle => {
  const baseStyle: ViewStyle = {
    padding: theme.SPACING.md,
  };
  
  if (isUnread) {
    return {
      ...baseStyle,
      borderLeftWidth: 3,
      borderLeftColor: theme.COLORS.primary.green,
    };
  }
  
  return baseStyle;
};

export const NotificationsScreen = () => {
  const router = useRouter();
  const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  const handleMarkAllAsRead = useCallback(async () => {
    await Haptics.selectionAsync();
    await markAllAsRead();
  }, [markAllAsRead]);

  const handleNotificationPress = useCallback(async (notificationId: string) => {
    await Haptics.selectionAsync();
    await markAsRead(notificationId);
  }, [markAsRead]);

  const handleDelete = useCallback(async (notificationId: string) => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await deleteNotification(notificationId);
  }, [deleteNotification]);

  const renderRightActions = useCallback((
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
    notificationId: string
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    const opacity = dragX.interpolate({
      inputRange: [-80, -40, 0],
      outputRange: [1, 0.5, 0],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View 
        style={[
          styles.swipeActions,
          {
            transform: [{ scale }],
            opacity,
          }
        ]}
      >
        <TouchableOpacity
          onPress={() => handleDelete(notificationId)}
          style={[styles.swipeAction, { backgroundColor: theme.COLORS.primary.red }]}
        >
          <FontAwesome6 name={getCompatibleIconName("trash")} size={24} color={theme.COLORS.ui.background} />
        </TouchableOpacity>
      </Animated.View>
    );
  }, [handleDelete]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'achievement':
        return 'trophy';
      case 'badge':
        return 'award';
      case 'streak':
        return 'fire';
      case 'reminder':
        return 'bell';
      default:
        return 'circle-info';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'achievement':
        return theme.COLORS.primary.yellow;
      case 'badge':
        return theme.COLORS.primary.green;
      case 'streak':
        return theme.COLORS.primary.red;
      case 'reminder':
        return theme.COLORS.primary.blue;
      default:
        return theme.COLORS.ui.textSecondary;
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <Header
        title="Notifications"
        onBack={() => router.back()}
        rightAction={
          notifications.some(n => !n.read)
            ? {
                label: 'Mark all read',
                onPress: handleMarkAllAsRead,
              }
            : undefined
        }
      />

      <ScrollView style={styles.content}>
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <Swipeable
              key={notification.id}
              renderRightActions={(progress, dragX) => 
                renderRightActions(progress, dragX, notification.id)
              }
              overshootRight={false}
            >
              <TouchableOpacity
                onPress={() => handleNotificationPress(notification.id)}
                style={styles.notificationContainer}
              >
                <Card
                  style={getCardStyle(!notification.read)}
                >
                  <View style={styles.notificationContent}>
                    <View 
                      style={[
                        styles.iconContainer,
                        { backgroundColor: getNotificationColor(notification.type) },
                      ]}
                    >
                      <FontAwesome6
                        name={getNotificationIcon(notification.type)}
                        size={24}
                        color={theme.COLORS.ui.background}
                      />
                    </View>
                    <View style={styles.textContainer}>
                      <Typography variant="h3" style={styles.title}>
                        {notification.title}
                      </Typography>
                      <Typography
                        variant="body"
                        color={theme.COLORS.ui.textSecondary}
                        style={styles.message}
                      >
                        {notification.message}
                      </Typography>
                      <Typography
                        variant="caption"
                        color={theme.COLORS.ui.textSecondary}
                      >
                        {new Date(notification.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: 'numeric',
                        })}
                      </Typography>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            </Swipeable>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <FontAwesome6
              name="bell-slash"
              size={48}
              color={theme.COLORS.ui.textSecondary}
            />
            <Typography
              variant="body"
              color={theme.COLORS.ui.textSecondary}
              style={styles.emptyText}
            >
              No notifications yet
            </Typography>
          </View>
        )}
      </ScrollView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.ui.background,
  },
  content: {
    flex: 1,
  },
  notificationContainer: {
    marginHorizontal: theme.SPACING.lg,
    marginVertical: theme.SPACING.sm,
  },
  notification: {
    padding: theme.SPACING.md,
  },
  unreadNotification: {
    borderLeftWidth: 3,
    borderLeftColor: theme.COLORS.primary.green,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.SPACING.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    marginBottom: theme.SPACING.xs,
  },
  message: {
    marginBottom: theme.SPACING.sm,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: theme.SPACING.md,
  },
  swipeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.SPACING.sm,
  },
  swipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderRadius: theme.BORDER_RADIUS.lg,
  },
}); 