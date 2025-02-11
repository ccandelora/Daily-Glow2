import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { AppStateProvider } from '@/contexts/AppStateContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { JournalProvider } from '@/contexts/JournalContext';
import { ChallengesProvider } from '@/contexts/ChallengesContext';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import { LoadingOverlay } from '@/components/common';
import theme from '@/constants/theme';

export default function RootLayout() {
  return (
    <AppStateProvider>
      <AuthProvider>
        <JournalProvider>
          <ChallengesProvider>
            <NotificationsProvider>
              <OnboardingProvider>
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
              </OnboardingProvider>
            </NotificationsProvider>
          </ChallengesProvider>
        </JournalProvider>
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