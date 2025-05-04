import React, { useEffect } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import theme from '@/constants/theme';

export default function OnboardingIndex() {
  const router = useRouter();
  
  // Log the navigation attempt
  useEffect(() => {
    console.log('OnboardingIndex: Redirecting to welcome screen');
    // Add a timeout as a fallback for immediate router.replace
    const timer = setTimeout(() => {
      console.log('OnboardingIndex: Fallback redirect triggered');
      router.replace('/(onboarding)/welcome');
    }, 500);
    
    return () => clearTimeout(timer);
  }, [router]);
  
  // Immediate redirect to welcome screen
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