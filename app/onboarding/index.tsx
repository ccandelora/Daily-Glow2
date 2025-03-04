import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Redirect, useRouter } from 'expo-router';

/**
 * Default onboarding index that redirects to the welcome screen
 * This uses a traditional folder structure approach without parentheses
 */
export default function OnboardingIndex() {
  console.log('🔍 DEBUG: Traditional onboarding index loaded');
  
  // Redirect directly to the welcome screen
  return <Redirect href="/onboarding/welcome" />;
} 