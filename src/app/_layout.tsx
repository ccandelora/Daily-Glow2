import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AppStateProvider } from '@/contexts/AppStateContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { BadgeProvider, useBadges } from '@/contexts/BadgeContext';
import { CheckInStreakProvider, CheckInStreak } from '@/contexts/CheckInStreakContext';
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

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      // Redirect to sign-in if not authenticated and not in auth group
      router.replace('/(auth)/sign-in');
    } else if (session && inAuthGroup) {
      // Redirect to home if authenticated and in auth group
      router.replace('/(app)');
    }
  }, [session, segments, isLoading]);

  if (isLoading) {
    return <LoadingOverlay />;
  }

  return null;
}

export default function RootLayout() {
  return (
    <AppStateProvider>
      <AuthProvider>
        <BadgeProvider>
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
              </Stack>
              <ProtectedRoute />
            </View>
          </CheckInStreakWithBadges>
        </BadgeProvider>
      </AuthProvider>
    </AppStateProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.ui.background,
  },
}); 