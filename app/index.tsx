import React, { useEffect } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const { session, user, isLoading: authLoading } = useAuth();
  const { 
    hasCompletedOnboarding, 
    loading: onboardingLoading, 
    setHasCompletedOnboarding 
  } = useOnboarding();
  const router = useRouter();
  
  useEffect(() => {
    // Log initial state for debugging
    console.log('Root index rendered with:', {
      hasSession: !!session,
      userId: user?.id,
      hasCompletedOnboarding,
      authLoading,
      onboardingLoading
    });

    // Check if onboarding status is out of sync with AsyncStorage
    const syncOnboardingStatus = async () => {
      try {
        if (!user) return; // Skip if no user
        
        const storedStatus = await AsyncStorage.getItem('hasCompletedOnboarding');
        
        // If AsyncStorage has onboarding marked as complete but context doesn't
        if (storedStatus === 'true' && !hasCompletedOnboarding) {
          console.log('Syncing onboarding status from AsyncStorage to context (true)');
          setHasCompletedOnboarding(true);
        }
        // If context has onboarding marked as complete but AsyncStorage doesn't
        else if (storedStatus !== 'true' && hasCompletedOnboarding) {
          console.log('Syncing onboarding status from context to AsyncStorage (true)');
          await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
        }
      } catch (error) {
        console.error('Error syncing onboarding status:', error);
      }
    };

    // Only run when we have stable values
    if (!authLoading && !onboardingLoading) {
      syncOnboardingStatus();
    }
  }, [
    session, 
    user, 
    hasCompletedOnboarding, 
    authLoading, 
    onboardingLoading, 
    setHasCompletedOnboarding
  ]);

  // Show loading indicator while checking auth or onboarding status
  if (authLoading || onboardingLoading) {
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