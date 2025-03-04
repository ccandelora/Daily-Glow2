import React from 'react';
import { Redirect } from 'expo-router';

/**
 * Direct handler for the /--/app/ URL pattern with trailing slash
 * This file is located at app/--/app/index.tsx
 */
export default function DevAppIndexHandler() {
  console.log('🚨 DIRECT HANDLER: Caught /--/app/ URL pattern with trailing slash');
  
  // Use immediate redirect without any additional components
  return <Redirect href="/app" />;
} 