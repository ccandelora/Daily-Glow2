import React from 'react';
import { View, StyleSheet } from 'react-native';
import OnboardingPersonalizeScreen from '@/screens/onboarding/OnboardingPersonalizeScreen';
import { UserProfileProvider } from '@/contexts/UserProfileContext';

export default function Personalize() {
  return (
    <View style={styles.container}>
      <UserProfileProvider>
        <OnboardingPersonalizeScreen />
      </UserProfileProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 