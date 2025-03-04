import React from 'react';
import { Redirect } from 'expo-router';

/**
 * Main app entry point - provides a simple fallback for development URLs
 * This file will be matched when accessing exp://IP:PORT/app or exp://IP:PORT/--/app
 */
export default function AppEntryPoint() {
  // Simple redirect to the actual app index
  return <Redirect href="/app/index" />;
} 