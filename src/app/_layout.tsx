import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AppStateProvider } from '@/contexts/AppStateContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { LoadingOverlay } from '@/components/common';
import theme from '@/constants/theme';

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