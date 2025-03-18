import React, { useEffect } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import theme from '@/constants/theme';

export default function Index() {
  const { session, isLoading: authLoading } = useAuth();
  const { hasCompletedOnboarding, loading: onboardingLoading } = useOnboarding();
  const router = useRouter();
  
  useEffect(() => {
    console.log('Root index loaded with:', {
      session: !!session,
      hasCompletedOnboarding,
      authLoading,
      onboardingLoading
    });
  }, [session, hasCompletedOnboarding, authLoading, onboardingLoading]);

  // Show loading indicator while checking auth or onboarding status
  if (authLoading || onboardingLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.COLORS.primary.green} />
        <Text style={styles.loadingText}>Loading app...</Text>
      </View>
    );
  }

  // If not authenticated, go to login
  if (!session) {
    console.log('Root index: No session, redirecting to login');
    return <Redirect href="/(auth)/sign-in" />;
  }

  // If onboarding not completed, go to onboarding flow
  if (!hasCompletedOnboarding) {
    console.log('Root index: Onboarding not completed, redirecting to onboarding');
    return <Redirect href="/(onboarding)" />;
  }
  
  // Otherwise, go to main app
  console.log('Root index: Auth and onboarding completed, redirecting to main app');
  return <Redirect href="/(app)" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.COLORS.ui.background,
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.COLORS.ui.textSecondary,
  },
}); 