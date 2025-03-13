import React from 'react';
import { View, StyleSheet } from 'react-native';
import OnboardingScreen from '@/screens/onboarding/OnboardingScreen';

export default function Index() {
  return (
    <View style={styles.container}>
      <OnboardingScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 