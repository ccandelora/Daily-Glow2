import React from 'react';
import { Redirect } from 'expo-router';

/**
 * Direct handler for the exact problematic path: /--/app
 * This file is located at app/--/app.tsx to match the exact URL pattern
 */
export default function DevAppHandler() {
  console.log('🚨 DIRECT HANDLER: Caught /--/app URL pattern');
  
  // Use immediate redirect without any additional components
  return <Redirect href="/app" />;
} 