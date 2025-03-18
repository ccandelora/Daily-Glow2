import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import theme from '@/constants/theme';

export default function OnboardingIndex() {
  const router = useRouter();
  
  useEffect(() => {
    console.log('📱 Onboarding index loaded, redirecting to welcome screen');
    
    // Add a small timeout to ensure navigation is ready
    setTimeout(() => {
      router.replace('/(onboarding)/welcome');
    }, 100);
  }, [router]);

  // Show loading while redirecting
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.COLORS.primary.green} />
      <Text style={styles.text}>Loading onboarding...</Text>
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
  text: {
    marginTop: 10,
    color: theme.COLORS.ui.text,
  }
}); 