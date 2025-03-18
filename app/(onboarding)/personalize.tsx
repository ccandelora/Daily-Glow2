import React from 'react';
import { View, StyleSheet } from 'react-native';
import OnboardingPersonalizeScreen from '@/screens/onboarding/OnboardingPersonalizeScreen';

export default function Personalize() {
  return (
    <View style={styles.container}>
      <OnboardingPersonalizeScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 