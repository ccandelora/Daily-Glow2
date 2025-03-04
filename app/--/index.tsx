import React from 'react';
import { Redirect } from 'expo-router';

/**
 * Root handler for the /--/ development URL pattern
 * This file is located at app/--/index.tsx to match the exact URL pattern
 */
export default function DevRootHandler() {
  console.log('🚨 ROOT HANDLER: Caught /--/ URL pattern');
  
  // Use immediate redirect without any additional components
  return <Redirect href="/app" />;
} 