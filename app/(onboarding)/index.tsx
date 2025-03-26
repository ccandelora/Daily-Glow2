import React from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import theme from '@/constants/theme';

export default function OnboardingIndex() {
  // Immediately redirect to welcome screen
  return <Redirect href="/(onboarding)/welcome" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.COLORS.ui.background,
  },
  text: {
    marginTop: 10,
    color: theme.COLORS.ui.text,
  }
}); 