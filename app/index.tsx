import React, { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Text, View, StyleSheet, ActivityIndicator } from 'react-native';

export default function Index() {
  const { session } = useAuth();
  const { hasCompletedOnboarding, loading } = useOnboarding();
  
  useEffect(() => {
    console.log('Root index rendered with:', {
      hasSession: !!session,
      hasCompletedOnboarding,
      loading
    });
  }, [session, hasCompletedOnboarding, loading]);

  // Show loading indicator while checking onboarding status
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#8062D6" />
        <Text style={styles.loadingText}>Loading...</Text>
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
    return <Redirect href="/(onboarding)/welcome" />;
  }
  
  // Otherwise, go to main app
  console.log('Root index: Onboarding completed, redirecting to main app');
  return <Redirect href="/(app)" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
}); 