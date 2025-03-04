import React from 'react';
import { Stack } from 'expo-router';
import { useOnboarding } from '@/contexts/OnboardingContext';

/**
 * Layout for the onboarding section without using route groups
 * Uses a clean folder structure approach (app/onboarding/_layout.tsx)
 */
export default function OnboardingLayout() {
  const { currentStep, totalSteps } = useOnboarding();
  
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: {
          backgroundColor: '#1c0e2e', // Dark purple background
        }
      }}
    />
  );
} 