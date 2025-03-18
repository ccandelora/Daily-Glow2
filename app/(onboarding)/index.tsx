import React, { useEffect } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useOnboarding } from '@/contexts/OnboardingContext';
import theme from '@/constants/theme';

export default function Index() {
  const router = useRouter();
  const { hasCompletedOnboarding } = useOnboarding();
  
  useEffect(() => {
    console.log('📱 Onboarding index loaded, redirecting to welcome screen');
    
    // A slight delay to allow the router to initialize properly
    const timer = setTimeout(() => {
      // If user has already completed onboarding, redirect to app
      if (hasCompletedOnboarding) {
        console.log('🔀 Onboarding already completed, redirecting to app');
        router.replace('/(app)');
      } else {
        console.log('🔀 Navigating to welcome screen');
        router.push('/(onboarding)/welcome');
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [router, hasCompletedOnboarding]);

  // Show a loading indicator while redirecting
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#8062D6" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.COLORS.ui.background,
  },
}); 