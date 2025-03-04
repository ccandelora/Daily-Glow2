import React from 'react';
import { Stack } from 'expo-router';

/**
 * Layout for all development URL patterns
 * This handles all routes under the /--/ prefix
 */
export default function DevLayout() {
  console.log('🚨 DEV LAYOUT: Mounted');
  
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'none',
      }}
    />
  );
} 