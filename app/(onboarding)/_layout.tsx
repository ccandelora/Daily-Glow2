import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { UserProfileProvider } from '@/contexts/UserProfileContext';
import { AchievementsProvider } from '@/contexts/AchievementsContext';
import { BadgeProvider } from '@/contexts/BadgeContext';
import theme from '@/constants/theme';

export default function OnboardingLayout() {
  console.log('📱 Rendering OnboardingLayout');
  const { session } = useAuth();
  const { hasCompletedOnboarding, loading } = useOnboarding();
  const router = useRouter();

  // Prevent accessing onboarding if not authenticated or already completed
  useEffect(() => {
    console.log('📱 OnboardingLayout effect with auth:', !!session, 'onboarding completed:', hasCompletedOnboarding);
    
    // Only redirect if we're sure about the state
    if (loading) {
      return;
    }
    
    if (!session) {
      console.log('📱 OnboardingLayout: No session, redirecting to sign-in');
      router.replace('/(auth)/sign-in');
      return;
    }
    
    if (hasCompletedOnboarding) {
      console.log('📱 OnboardingLayout: Onboarding already completed, redirecting to app');
      router.replace('/(app)');
      return;
    }
  }, [session, hasCompletedOnboarding, loading, router]);

  return (
    <View style={styles.container}>
      <UserProfileProvider>
        <BadgeProvider>
          <AchievementsProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: theme.COLORS.ui.background },
                animation: 'fade',
              }}
              initialRouteName="welcome"
            >
              <Stack.Screen 
                name="index" 
                options={{ 
                  gestureEnabled: false,
                  headerShown: false
                }} 
              />
              <Stack.Screen 
                name="welcome" 
                options={{ 
                  gestureEnabled: false,
                  headerShown: false 
                }} 
              />
              <Stack.Screen 
                name="personalize" 
                options={{ 
                  gestureEnabled: false,
                  headerShown: false 
                }} 
              />
              <Stack.Screen 
                name="notifications" 
                options={{ 
                  gestureEnabled: false,
                  headerShown: false 
                }} 
              />
            </Stack>
          </AchievementsProvider>
        </BadgeProvider>
      </UserProfileProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.ui.background,
  },
}); 