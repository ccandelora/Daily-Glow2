import React from 'react';
import { View, StyleSheet } from 'react-native';
import OnboardingNotificationsScreen from '@/screens/onboarding/OnboardingNotificationsScreen';

export default function Notifications() {
  return (
    <View style={styles.container}>
      <OnboardingNotificationsScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 