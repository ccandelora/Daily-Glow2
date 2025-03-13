import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useEffect, useState } from 'react';
import { Text, View, StyleSheet, Button } from 'react-native';

export default function Index() {
  const { session } = useAuth();
  const { hasCompletedOnboarding } = useOnboarding();
  
  useEffect(() => {
    console.log('Root index rendered with:', {
      hasSession: !!session,
      hasCompletedOnboarding
    });
  }, [session, hasCompletedOnboarding]);

  // If not authenticated, go to login
  if (!session) {
    console.log('Root index: No session, redirecting to login');
    return <Redirect href="/(auth)/sign-in" />;
  }

  // TEMPORARY: Force showing onboarding regardless of state
  console.log('Root index: FORCING redirect to onboarding');
  return <Redirect href="/(onboarding)" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  debugContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    width: '100%',
  },
  debugText: {
    fontSize: 14,
    marginBottom: 5,
  },
}); 