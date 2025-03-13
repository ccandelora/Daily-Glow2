import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import theme from '@/constants/theme';

export default function OnboardingLayout() {
  console.log('📱 Rendering OnboardingLayout');

  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.COLORS.ui.background },
          animation: 'fade',
          presentation: 'card',
        }}
      >
        <Stack.Screen name="index" options={{ gestureEnabled: false }} />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.ui.background,
  },
}); 