import React from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import OnboardingNotificationsScreen from '@/screens/onboarding/OnboardingNotificationsScreen';
import theme from '@/constants/theme';

export default function Notifications() {
  // Add error boundary to catch any issues loading the component
  try {
    return (
      <View style={styles.container}>
        <OnboardingNotificationsScreen />
      </View>
    );
  } catch (error) {
    console.error('Error loading notifications screen:', error);
    // Fallback UI in case of error
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error loading notifications screen</Text>
        <ActivityIndicator size="large" color={theme.COLORS.primary.green} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    marginBottom: 20,
    textAlign: 'center',
  },
}); 