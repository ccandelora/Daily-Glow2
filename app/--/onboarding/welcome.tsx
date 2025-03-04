import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Redirect, router } from 'expo-router';

/**
 * Direct handler for the /--/onboarding/welcome URL pattern in development
 */
export default function DevOnboardingWelcomeHandler() {
  useEffect(() => {
    // Log that we've caught this specific URL pattern
    console.log('🔍 DEV ONBOARDING HANDLER: Caught /--/onboarding/welcome URL pattern');
    
    // Use programmatic navigation as a backup
    setTimeout(() => {
      router.replace('/onboarding/welcome');
    }, 100);
  }, []);
  
  // Use immediate redirect as primary method
  return <Redirect href="/onboarding/welcome" />;
} 