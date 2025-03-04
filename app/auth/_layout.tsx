import React from 'react';
import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';

/**
 * Layout for the authentication section
 * This wraps all routes in the /auth directory with a Stack navigator
 */
export default function AuthLayout() {
  console.log('🔍 DEBUG: Auth layout loaded');
  
  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1c0e2e',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          animation: 'slide_from_right',
          headerShown: false, // Hide headers in auth flow
        }}
      >
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="sign-up" />
        <Stack.Screen name="confirm-email" />
        <Stack.Screen name="verify-email" />
        <Stack.Screen name="verification-instructions" />
        <Stack.Screen name="manual-verification" />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c0e2e',
  },
}); 