import React, { useEffect } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { Stack } from 'expo-router';
import '@/utils/cryptoPolyfill';
import { AppStateProvider } from '@/contexts/AppStateContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { JournalProvider } from '@/contexts/JournalContext';
import { ChallengesProvider } from '@/contexts/ChallengesContext';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import { OnboardingProvider, useOnboarding } from '@/contexts/OnboardingContext';
import { BadgeProvider } from '@/contexts/BadgeContext';
import { CheckInStreakProvider } from '@/contexts/CheckInStreakContext';
import { AchievementsProvider } from '@/contexts/AchievementsContext';
import { MoodProvider } from '@/contexts/MoodContext';
import { LoadingOverlay, DeepLinkHandler } from '@/components/common';
import { logAppStartupInfo } from '@/utils/debugUtils';
import NotificationProvider from '@/components/achievements/AchievementNotificationManager';

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

function RootLayoutNav() {
  // Simple routing container that defines the structure but doesn't enforce navigation
  // Navigation logic is handled in each group's _layout.tsx or index.tsx
  return (
    <>
      <DeepLinkHandler />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </>
  );
}

// Root app component that sets up all providers
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
            <BadgeProvider>
              <JournalProvider>
                <MoodProvider>
                  <OnboardingProvider>
                    <ChallengesProvider>
                      <CheckInStreakProvider>
                        <AchievementsProvider>
                          <ErrorBoundary>
                            <NotificationsProvider>
                              <NotificationProvider>
                                <View style={styles.container}>
                                  <RootLayoutNav />
                                  <LoadingOverlay />
                                </View>
                              </NotificationProvider>
                            </NotificationsProvider>
                          </ErrorBoundary>
                        </AchievementsProvider>
                      </CheckInStreakProvider>
                    </ChallengesProvider>
                  </OnboardingProvider>
                </MoodProvider>
              </JournalProvider>
            </BadgeProvider>
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