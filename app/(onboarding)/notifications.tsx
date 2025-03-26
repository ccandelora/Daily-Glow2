import React from 'react';
import { View, StyleSheet } from 'react-native';
import OnboardingNotificationsScreen from '@/screens/onboarding/OnboardingNotificationsScreen';
import { UserProfileProvider } from '@/contexts/UserProfileContext';

export default function Notifications() {
  return (
    <View style={styles.container}>
      <UserProfileProvider>
        <OnboardingNotificationsScreen />
      </UserProfileProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 