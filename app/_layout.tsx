import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
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
import { logAppStartupInfo } from '@/utils/debugUtils';

// Error Boundary Component
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: { componentStack: string } | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { 
    hasError: false, 
    error: null, 
    errorInfo: null 
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }): void {
    console.error("App crashed with error:", error);
    console.error("Component stack:", errorInfo.componentStack);
    this.setState({ errorInfo });
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>
            {this.state.error && this.state.error.toString()}
          </Text>
          <Text style={styles.errorDetail}>
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

// Create a wrapper component to handle streak updates with badge context
function CheckInStreakWithBadges({ children }: { children: React.ReactNode }) {
  const { addUserBadge, isLoading } = useBadges();
  
  const handleStreakUpdated = useCallback(async (
    streaks: CheckInStreak, 
    isFirstCheckIn: boolean, 
    allPeriodsCompleted: boolean
  ) => {
    try {
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error in streak badge processing:", errorMessage);
    }
  }, [addUserBadge, isLoading]);
  
  return (
    <CheckInStreakProvider onStreakUpdated={handleStreakUpdated}>
      {children}
    </CheckInStreakProvider>
  );
}

function RootLayoutNav() {
  try {
    const { session, user } = useAuth();
    const { hasCompletedOnboarding, loading: onboardingLoading } = useOnboarding();
    const segments = useSegments();
    const router = useRouter();

    console.log('🚀 RootLayoutNav rendered with segments:', segments);

    useEffect(() => {
      try {
        // Simple navigation logic - if not authenticated, go to sign-in
        if (!session) {
          console.log('🔀 Not authenticated, redirecting to sign-in');
          router.replace('/(auth)/sign-in');
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Navigation error:", errorMessage);
      }
    }, [session]);

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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error in RootLayoutNav:", errorMessage);
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Navigation Error</Text>
        <Text style={styles.errorText}>{errorMessage}</Text>
      </View>
    );
  }
}

export default function RootLayout() {
  console.log('Root layout rendering');
  
  // Log diagnostic information about environment and configuration
  try {
    logAppStartupInfo();
  } catch (error) {
    console.error("Error logging app startup info:", error);
  }

  try {
    // Check for environment variables early
    if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
      console.error("Missing required environment variables for Supabase");
    }

    return (
      <ErrorBoundary>
        <AppStateProvider>
          <AuthProvider>
            <OnboardingProvider>
              <BadgeProvider>
                <JournalProvider>
                  <ChallengesProvider>
                    <ErrorBoundary>
                      <NotificationsProvider>
                        <CheckInStreakProvider>
                          <View style={styles.container}>
                            <RootLayoutNav />
                            <LoadingOverlay />
                          </View>
                        </CheckInStreakProvider>
                      </NotificationsProvider>
                    </ErrorBoundary>
                  </ChallengesProvider>
                </JournalProvider>
              </BadgeProvider>
            </OnboardingProvider>
          </AuthProvider>
        </AppStateProvider>
      </ErrorBoundary>
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Critical error in RootLayout:", errorMessage);
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Critical Error</Text>
        <Text style={styles.errorText}>{errorMessage}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'red',
  },
  errorText: {
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'center',
  },
  errorDetail: {
    fontSize: 12,
    color: '#666',
  },
}); 