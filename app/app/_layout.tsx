import React from 'react';
import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { JournalProvider } from '@/contexts/JournalContext';
import { CheckInStreakProvider } from '@/contexts/CheckInStreakContext';
import { ChallengesProvider } from '@/contexts/ChallengesContext';

/**
 * Layout for the main app section
 * This wraps all routes in the /app directory with providers and a Stack navigator
 */
export default function AppLayout() {
  console.log('🔍 DEBUG: App layout loaded');
  
  return (
    <JournalProvider>
      <CheckInStreakProvider>
        <ChallengesProvider>
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
              }}
            >
              <Stack.Screen
                name="index"
                options={{
                  title: 'Daily Glow',
                  headerShown: true,
                }}
              />
              <Stack.Screen
                name="achievements"
                options={{
                  title: 'Achievements',
                  headerShown: true,
                }}
              />
              <Stack.Screen
                name="profile"
                options={{
                  title: 'Your Profile',
                  headerShown: true,
                }}
              />
              <Stack.Screen
                name="settings"
                options={{
                  title: 'Settings',
                  headerShown: true,
                }}
              />
            </Stack>
          </View>
        </ChallengesProvider>
      </CheckInStreakProvider>
    </JournalProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c0e2e',
  },
}); 