import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import '@/utils/cryptoPolyfill';
import { AppStateProvider } from '@/contexts/AppStateContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { JournalProvider } from '@/contexts/JournalContext';
import { ChallengesProvider } from '@/contexts/ChallengesContext';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import { OnboardingProvider, useOnboarding } from '@/contexts/OnboardingContext';
import { BadgeProvider, useBadges } from '@/contexts/BadgeContext';
import { CheckInStreakProvider, CheckInStreak } from '@/contexts/CheckInStreakContext';
import { LoadingOverlay, DeepLinkHandler } from '@/components/common';
import { BadgeService } from '@/services/BadgeService';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';
import { extractTokenFromUrl, verifyEmailWithToken } from '@/utils/authUtils';
import { useAppState } from '@/contexts/AppStateContext';

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

function RootLayoutNav() {
  const { session, user } = useAuth();
  const { hasCompletedOnboarding, loading: onboardingLoading } = useOnboarding();
  const segments = useSegments();
  const router = useRouter();

  console.log('🚀 RootLayoutNav rendered with segments:', segments);

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    const inAppGroup = segments[0] === '(app)';
    const inOnboardingGroup = segments[0] === '(onboarding)';

    console.log('🧭 Navigation check:', {
      inAuthGroup,
      inAppGroup,
      inOnboardingGroup,
      hasSession: !!session,
      currentSegment: segments[0]
    });

    // Skip all complicated checks, use simple navigation logic:
    
    // If not authenticated and not in auth group, go to sign-in
    if (!session && !inAuthGroup) {
      console.log('🔀 Not authenticated, redirecting to sign-in');
      router.replace('/(auth)/sign-in');
      return;
    }
    
    // The rest of the navigation will be handled by the signin screen itself
  }, [session, segments]);

  return (
    <>
      <DeepLinkHandler />
      
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </>
  );
}

export default function RootLayout() {
  console.log('Root layout rendering');

  return (
    <AppStateProvider>
      <AuthProvider>
        <OnboardingProvider>
          <BadgeProvider>
            <CheckInStreakWithBadges>
              <JournalProvider>
                <ChallengesProvider>
                  <NotificationsProvider>
                    <View style={styles.container}>
                      <RootLayoutNav />
                      <LoadingOverlay />
                    </View>
                  </NotificationsProvider>
                </ChallengesProvider>
              </JournalProvider>
            </CheckInStreakWithBadges>
          </BadgeProvider>
        </OnboardingProvider>
      </AuthProvider>
    </AppStateProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 