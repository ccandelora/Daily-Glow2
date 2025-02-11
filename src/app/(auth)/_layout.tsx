import React from 'react';
import { Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingOverlay } from '@/components/common';
import theme from '@/constants/theme';

export default function AuthLayout() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <LoadingOverlay />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.COLORS.ui.background },
      }}
    >
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
    </Stack>
  );
} 