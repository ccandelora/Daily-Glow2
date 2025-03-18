import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboarding } from '@/contexts/OnboardingContext';
import theme from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const router = useRouter();
  const { hasCompletedOnboarding, setHasCompletedOnboarding } = useOnboarding();
  
  useEffect(() => {
    const checkAndLoadOnboardingStatus = async () => {
      try {
        console.log('📱 Onboarding index loaded, checking status');
        
        // Check AsyncStorage first, then update context if needed
        const storedStatus = await AsyncStorage.getItem('hasCompletedOnboarding');
        const completedFromStorage = storedStatus === 'true';
        
        // If AsyncStorage indicates complete but context doesn't, update context
        if (completedFromStorage && !hasCompletedOnboarding) {
          setHasCompletedOnboarding(true);
        }
        
        // Direct to appropriate screen
        if (completedFromStorage || hasCompletedOnboarding) {
          console.log('🔀 Onboarding already completed, redirecting to app');
          router.replace('/(app)');
        } else {
          console.log('🔀 Navigating to welcome screen');
          // Slight delay to allow navigation to stabilize
          setTimeout(() => {
            router.push('/(onboarding)/welcome');
          }, 100);
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // Default to welcome screen if there's an error
        router.push('/(onboarding)/welcome');
      }
    };
    
    checkAndLoadOnboardingStatus();
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