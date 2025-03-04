import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Switch, Animated, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography, Button, Card, Input } from '@/components/common';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAppState } from '@/contexts/AppStateContext';
import theme from '@/constants/theme';

export const SetupScreen = () => {
  const router = useRouter();
  const { state, setNotificationPreferences } = useOnboarding();
  const { showError } = useAppState();
  const [notifications, setNotifications] = useState(state.notifications);
  const [reminderTime, setReminderTime] = useState(state.reminderTime || '20:00');

  const headerAnim = React.useRef(new Animated.Value(0)).current;
  const cardAnim = React.useRef(new Animated.Value(50)).current;
  const footerAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // Fade in header
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      // Slide up card
      Animated.spring(cardAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      // Fade in footer
      Animated.timing(footerAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const validateTime = (time: string): boolean => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  };

  const handleNotificationToggle = (value: boolean) => {
    setNotifications(value);
    setNotificationPreferences(value, reminderTime);
  };

  const handleTimeChange = (time: string) => {
    // Allow typing by not validating incomplete input
    setReminderTime(time);
    
    // Only update preferences if time is valid
    if (validateTime(time)) {
      setNotificationPreferences(notifications, time);
    }
  };

  const formatTimeForDisplay = (time: string): string => {
    if (!validateTime(time)) return time;
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const handleContinue = () => {
    if (notifications && !validateTime(reminderTime)) {
      showError('Please enter a valid time (HH:MM)');
      return;
    }
    router.push('/challenges');
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.header, { opacity: headerAnim }]}>
        <Typography variant="h2" style={styles.title}>
          Let's get you setup
        </Typography>
        <Typography variant="body" style={styles.subtitle}>
          Make sure you're in a quiet space and ready for a few simple steps.
        </Typography>
      </Animated.View>

      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ translateY: cardAnim }],
            opacity: headerAnim,
          },
        ]}
      >
        <Card style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingText}>
              <Typography variant="h3">Daily Reminders</Typography>
              <Typography variant="caption" color={theme.COLORS.ui.textSecondary}>
                Get gentle notifications to check in
              </Typography>
            </View>
            <Switch
              value={notifications}
              onValueChange={handleNotificationToggle}
              trackColor={{
                false: theme.COLORS.ui.border,
                true: theme.COLORS.primary.green,
              }}
            />
          </View>
          {notifications && (
            <View style={styles.timeInput}>
              <Input
                label="Reminder Time"
                value={reminderTime}
                onChangeText={handleTimeChange}
                placeholder="20:00"
                keyboardType="numbers-and-punctuation"
                maxLength={5}
                error={reminderTime.length === 5 && !validateTime(reminderTime) ? 'Please enter a valid time (HH:MM)' : undefined}
              />
              <Typography 
                variant="caption" 
                color={theme.COLORS.ui.textSecondary}
                style={styles.timeHelper}
              >
                {validateTime(reminderTime) 
                  ? `Reminder set for ${formatTimeForDisplay(reminderTime)}`
                  : 'Enter time in 24-hour format (e.g., 20:00)'}
              </Typography>
            </View>
          )}
        </Card>
      </Animated.View>

      <Animated.View style={[styles.footer, { opacity: footerAnim }]}>
        <Button
          title="Continue"
          onPress={handleContinue}
          style={styles.button}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.ui.background,
    paddingHorizontal: theme.SPACING.lg,
  },
  header: {
    paddingVertical: theme.SPACING.xl,
  },
  title: {
    marginBottom: theme.SPACING.sm,
  },
  subtitle: {
    color: theme.COLORS.ui.textSecondary,
  },
  content: {
    flex: 1,
  },
  card: {
    marginBottom: theme.SPACING.md,
    padding: theme.SPACING.lg,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingText: {
    flex: 1,
    marginRight: theme.SPACING.md,
  },
  timeInput: {
    marginTop: theme.SPACING.md,
  },
  timeHelper: {
    marginTop: theme.SPACING.xs,
  },
  footer: {
    paddingVertical: theme.SPACING.xl,
  },
  button: {
    marginBottom: theme.SPACING.md,
  },
}); 