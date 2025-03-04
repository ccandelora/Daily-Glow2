import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, usePathname } from 'expo-router';
import { ProgressBar } from '@/components/common';
import { OnboardingProvider, useOnboarding } from '@/contexts/OnboardingContext';
import theme from '@/constants/theme';

function OnboardingStack() {
  const { currentStep, totalSteps } = useOnboarding();
  const progress = currentStep / totalSteps;

  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.COLORS.ui.background },
          animation: 'slide_from_right',
          animationDuration: 300,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          presentation: 'card',
          animationTypeForReplace: 'push',
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="purpose"
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="setup"
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="challenges"
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="first-check-in"
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="complete"
          options={{
            animation: 'fade',
            gestureEnabled: false,
          }}
        />
      </Stack>
      <View style={styles.progressContainer}>
        <ProgressBar progress={progress} color={theme.COLORS.primary.green} />
      </View>
    </View>
  );
}

export default function OnboardingLayout() {
  return (
    <OnboardingProvider>
      <OnboardingStack />
    </OnboardingProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.ui.background,
  },
  progressContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: theme.SPACING.md,
  },
}); 