import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AppStateProvider } from '@/contexts/AppStateContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { JournalProvider } from '@/contexts/JournalContext';
import { ChallengesProvider } from '@/contexts/ChallengesContext';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import { LoadingOverlay } from '@/components/common';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';

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