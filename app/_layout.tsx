import React, { useEffect } from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import { Stack, useRouter, useSegments, usePathname } from 'expo-router';
import '@/utils/cryptoPolyfill';
import { AppStateProvider } from '@/contexts/AppStateContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { JournalProvider } from '@/contexts/JournalContext';
import { ChallengesProvider } from '@/contexts/ChallengesContext';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import { OnboardingProvider, useOnboarding } from '@/contexts/OnboardingContext';
import { BadgeProvider } from '@/contexts/BadgeContext';
import { CheckInStreakProvider } from '@/contexts/CheckInStreakContext';
import { LoadingOverlay, DeepLinkHandler, ErrorBoundary } from '@/components/common';
import { isDevelopment, isDevelopmentUrl } from '@/utils/developmentUtils';
import { RouteHandler } from '@/utils/routeUtils';
import { useLinkingFix } from '@/utils/linkingFix';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import { SplashScreen } from '@/components/SplashScreen';
import { DevRouteHandler } from '@/utils/devRouteUtils';
import { Redirect } from 'expo-router';

// Auth middleware component that manages navigation based on auth state
function AuthMiddleware({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isEmailVerified } = useAuth();
  const { hasCompletedOnboarding, checkDatabaseOnboardingStatus } = useOnboarding();
  const segments = useSegments();
  const router = useRouter();
  const pathname = usePathname();

  const isDevUrl = isDevelopmentUrl(pathname);
  
  // For debugging
  useEffect(() => {
    if (segments.length && (segments[0]?.startsWith('--') || pathname.includes('--'))) {
      console.log('[AuthMiddleware] Development URL detected:', pathname);
      console.log('[AuthMiddleware] Navigation segments:', segments);
    }
  }, [segments, pathname]);

  const checkAuthAndOnboarding = async () => {
    // Skip navigation checks if we're in a development URL with -- pattern
    // Let the DevelopmentUrlHandler take care of it instead
    if (__DEV__ && pathname.includes('--')) {
      console.log('🔍 DEBUG: Skipping auth navigation for development URL:', pathname);
      return;
    }

    // For debugging
    if (__DEV__) {
      console.log('🔍 DEBUG: Checking auth and onboarding status');
      console.log('🔍 DEBUG: Current path:', pathname);
      console.log('🔍 DEBUG: User:', user ? 'Authenticated' : 'Not authenticated');
      console.log('🔍 DEBUG: Email verified:', isEmailVerified);
      console.log('🔍 DEBUG: Onboarding completed:', hasCompletedOnboarding);
      console.log('🔍 DEBUG: Is loading:', isLoading);
    }

    if (isLoading) return;

    const appRoute = segments.join('/');
    
    if (isDevUrl) {
      console.log('[AuthMiddleware] Skipping auth check for dev URL:', pathname);
      return;
    }

    // Root segment
    const segment = segments[0] || '';
    
    // Check if we're in the protected app area
    const isAppSegment = segment === 'app';
    // Check if we're in the auth flow
    const isAuthSegment = segment === 'auth';
    // Check if we're in the onboarding flow
    const isOnboardingSegment = segment === 'onboarding';
    
    console.log('Auth state:', { 
      isAppSegment, 
      isAuthSegment, 
      isOnboardingSegment, 
      user: !!user, 
      verified: isEmailVerified, 
      pathname
    });

    // Not signed in, trying to access protected route, redirect to login
    if (!user && isAppSegment) {
      console.log('Redirecting to sign-in: Not authenticated');
      router.replace('/auth/sign-in');
      return;
    }
    
    // If user not verified and trying to access the app, redirect to pending verification
    if (user && !isEmailVerified && isAppSegment) {
      console.log('Redirecting to pending: Email not verified');
      router.replace('/auth/pending');
      return;
    }
    
    // If user is signed in and verified but in auth flow, redirect to app
    if (user && isEmailVerified && (isAuthSegment || pathname === '/')) {
      console.log('Redirecting to app: Already authenticated');
      router.replace('/app');
      return;
    }

    // If user hasn't completed onboarding but is trying to access app
    // This would involve checking a user flag from the database
    if (user && isEmailVerified && !hasCompletedOnboarding && isAppSegment) {
      console.log('Redirecting to onboarding: Onboarding not completed');
      router.replace('/onboarding/welcome');
      return;
    }
  };

  useEffect(() => {
    checkAuthAndOnboarding();
  }, [isLoading, user, segments, pathname, router, isEmailVerified, hasCompletedOnboarding]);

  // Show splash screen while loading
  if (isLoading) {
    return <SplashScreen />;
  }

  return <>{children}</>;
}

// Root layout with all providers
export default function RootLayout() {
  const pathname = usePathname();
  
  // Special handling for development URLs
  if (__DEV__ && pathname && pathname.includes('/--/')) {
    console.log('🔍 ROOT LAYOUT: Development URL detected:', pathname);
    
    // Handle the specific problematic URL pattern
    if (pathname.includes('/--/app')) {
      console.log('🔍 ROOT LAYOUT: Redirecting /--/app to /app');
      return <Redirect href="/app" />;
    }
    
    // Handle other development URL patterns
    const cleanPath = pathname.split('/--/')[1];
    if (cleanPath) {
      console.log('🔍 ROOT LAYOUT: Redirecting to:', cleanPath);
      return <Redirect href={`/${cleanPath}`} />;
    }
  }
  
  console.log('Root Layout Rendering. Dev mode:', isDevelopment);
  
  return (
    <ErrorBoundary>
      <AppStateProvider>
        <ThemeProvider>
          <AuthProvider>
            <OnboardingProvider>
              <StatusBar style="light" />
              
              {/* Development URL Handler */}
              <DevRouteHandler pathname={pathname} />
              
              {/* Global Route Handler Component */}
              <RouteHandler pathname={pathname} />
              
              {/* Authentication Middleware */}
              <AuthMiddleware>
                <NotificationsProvider>
                  <View style={styles.container}>
                    <Stack screenOptions={{ headerShown: false }}>
                      <Stack.Screen name="index" />
                      <Stack.Screen name="app" />
                      <Stack.Screen name="app/index" />
                      <Stack.Screen name="auth/sign-in" />
                      <Stack.Screen name="auth/sign-up" />
                      <Stack.Screen name="auth/forgot-password" />
                      <Stack.Screen name="auth/reset-password" />
                      <Stack.Screen name="auth/pending" />
                      <Stack.Screen name="onboarding/welcome" />
                      <Stack.Screen name="onboarding/purpose" />
                      <Stack.Screen name="onboarding/notifications" />
                      <Stack.Screen name="onboarding/complete" />
                      <Stack.Screen name="--" />
                      <Stack.Screen name="--/app" />
                      <Stack.Screen name="--/app/index" />
                      <Stack.Screen name="--/[...route]" />
                      <Stack.Screen name="--/onboarding/welcome" />
                      <Stack.Screen name="--_app" />
                      <Stack.Screen name="[...404]" />
                    </Stack>
                  </View>
                </NotificationsProvider>
              </AuthMiddleware>
            </OnboardingProvider>
          </AuthProvider>
        </ThemeProvider>
      </AppStateProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginTop: 100,
  },
}); 