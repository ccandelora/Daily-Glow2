import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AppStateProvider } from '@/contexts/AppStateContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { JournalProvider } from '@/contexts/JournalContext';
import { ChallengesProvider } from '@/contexts/ChallengesContext';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import { OnboardingProvider, useOnboarding } from '@/contexts/OnboardingContext';
import { BadgeProvider, useBadges } from '@/contexts/BadgeContext';
import { CheckInStreakProvider, CheckInStreak } from '@/contexts/CheckInStreakContext';
import { LoadingOverlay } from '@/components/common';
import { BadgeService } from '@/services/BadgeService';

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
  const { session } = useAuth();
  const { hasCompletedOnboarding } = useOnboarding();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    const inAppGroup = segments[0] === '(app)';
    const inOnboardingGroup = segments[0] === '(onboarding)';

    console.log('Root layout navigation check:', {
      session: !!session,
      hasCompletedOnboarding,
      currentSegment: segments[0],
      inAuthGroup,
      inAppGroup,
      inOnboardingGroup
    });

    if (!session) {
      // Not authenticated
      if (!inAuthGroup) {
        console.log('Not authenticated, redirecting to login');
        router.replace('/(auth)/login');
      }
    } else {
      // Authenticated
      if (!hasCompletedOnboarding && !inOnboardingGroup) {
        console.log('Onboarding incomplete, redirecting to welcome');
        router.replace('/(onboarding)/welcome');
      } else if (hasCompletedOnboarding && !inAppGroup) {
        console.log('Onboarding complete, redirecting to app');
        router.replace('/(app)');
      }
    }
  }, [session, hasCompletedOnboarding, segments]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
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