import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AppStateProvider } from '@/contexts/AppStateContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { BadgeProvider, useBadges } from '@/contexts/BadgeContext';
import { CheckInStreakProvider, CheckInStreak } from '@/contexts/CheckInStreakContext';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import { BadgeService } from '@/services/BadgeService';
import { LoadingOverlay } from '@/components/common';
import theme from '@/constants/theme';

// Create a wrapper component to handle streak updates with badge context
function CheckInStreakWithBadges({ children }: { children: React.ReactNode }) {
  const { addUserBadge, isLoading } = useBadges();
  
  const handleStreakUpdated = useCallback(async (
    streaks: CheckInStreak, 
    isFirstCheckIn: boolean, 
    allPeriodsCompleted: boolean
  ) => {
    // Skip badge processing if badges are still loading
    if (isLoading) {
      console.log('Badges still loading, skipping badge processing');
      return;
    }
    
    // Award badges based on streak updates
    if (isFirstCheckIn) {
      await BadgeService.awardFirstCheckInBadge(addUserBadge);
    }
    
    // Check streak badges
    await BadgeService.checkStreakBadges(streaks, addUserBadge);
    
    // Check if all periods were completed
    if (allPeriodsCompleted) {
      await BadgeService.checkAllPeriodsCompleted(addUserBadge);
    }
  }, [addUserBadge, isLoading]);
  
  return (
    <CheckInStreakProvider onStreakUpdated={handleStreakUpdated}>
      {children}
    </CheckInStreakProvider>
  );
}

function ProtectedRoute() {
  const segments = useSegments();
  const router = useRouter();
  const { session, isLoading } = useAuth();
  
  // Import OnboardingContext to check if onboarding is completed
  const { useOnboarding } = require('@/contexts/OnboardingContext');
  const { hasCompletedOnboarding, loading: onboardingLoading, dbError } = useOnboarding();

  useEffect(() => {
    // If still loading, don't do any redirects
    if (isLoading || onboardingLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';
    const inAppGroup = segments[0] === '(app)';

    console.log('Navigation check:', { 
      authenticated: !!session, 
      completed: hasCompletedOnboarding, 
      currentGroup: segments[0],
      dbError
    });

    try {
      // Handle missing user auth case first - always go to auth
      if (!session && !inAuthGroup) {
        console.log('Redirecting to sign-in: Not authenticated');
        router.replace('/(auth)/sign-in');
        return;
      }
      
      // If authenticated but in auth group
      if (session && inAuthGroup) {
        // Check if onboarding is needed
        if (!hasCompletedOnboarding) {
          console.log('Redirecting to onboarding: Auth completed but onboarding needed');
          router.replace('/(onboarding)');
        } else {
          console.log('Redirecting to main app: Auth and onboarding completed');
          router.replace('/(app)');
        }
        return;
      }
      
      // If authenticated but onboarding not completed and not in onboarding group
      if (session && !hasCompletedOnboarding && !inOnboardingGroup) {
        console.log('Redirecting to onboarding: Auth completed but outside onboarding');
        router.replace('/(onboarding)');
        return;
      }
      
      // If authenticated with completed onboarding but in onboarding group
      if (session && hasCompletedOnboarding && inOnboardingGroup) {
        console.log('Redirecting to main app: Onboarding already completed');
        router.replace('/(app)');
        return;
      }
    } catch (error) {
      console.error('Error in navigation logic:', error);
      // In case of navigation error, default to the main screen or auth
      if (!session) {
        router.replace('/(auth)/sign-in');
      } else {
        router.replace('/(app)');
      }
    }
  }, [session, segments, isLoading, hasCompletedOnboarding, onboardingLoading, dbError]);

  if (isLoading || onboardingLoading) {
    return <LoadingOverlay />;
  }

  return null;
}

export default function RootLayout() {
  return (
    <AppStateProvider>
      <BadgeProvider>
        <AuthProvider>
          <OnboardingProvider>
            <CheckInStreakWithBadges>
              <View style={styles.container}>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: theme.COLORS.ui.background },
                  }}
                >
                  <Stack.Screen
                    name="(auth)"
                    options={{
                      animation: 'fade',
                    }}
                  />
                  <Stack.Screen
                    name="(app)"
                    options={{
                      animation: 'fade',
                    }}
                  />
                  <Stack.Screen
                    name="(onboarding)"
                    options={{
                      animation: 'fade',
                    }}
                  />
                </Stack>
                <ProtectedRoute />
              </View>
            </CheckInStreakWithBadges>
          </OnboardingProvider>
        </AuthProvider>
      </BadgeProvider>
    </AppStateProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.ui.background,
  },
}); 