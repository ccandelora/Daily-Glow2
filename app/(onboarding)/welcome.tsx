import React from 'react';
import { View, StyleSheet } from 'react-native';
import OnboardingWelcomeScreen from '@/screens/onboarding/OnboardingWelcomeScreen';

export default function Welcome() {
  return (
    <View style={styles.container}>
      <OnboardingWelcomeScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 