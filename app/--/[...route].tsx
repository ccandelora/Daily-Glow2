import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';

/**
 * Catch-all handler for any route under the /--/ prefix
 * This file is located at app/--/[...route].tsx
 */
export default function DevCatchAllHandler() {
  const params = useLocalSearchParams();
  const route = params.route as string[] || [];
  
  console.log('🚨 CATCH-ALL HANDLER: Caught route segments:', route);
  
  // Handle specific cases
  if (route.includes('app') || route[0] === 'app') {
    console.log('🚨 CATCH-ALL HANDLER: Redirecting to /app');
    return <Redirect href="/app" />;
  }
  
  if (route.includes('onboarding') || route.includes('welcome')) {
    console.log('🚨 CATCH-ALL HANDLER: Redirecting to /onboarding/welcome');
    return <Redirect href="/onboarding/welcome" />;
  }
  
  // Extract the real route from /--/whatever
  const realPath = '/' + route.join('/');
  console.log('🚨 CATCH-ALL HANDLER: Redirecting to:', realPath || '/app');
  
  return <Redirect href={realPath || '/app'} />;
} 