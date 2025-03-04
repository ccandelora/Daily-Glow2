import React from 'react';
import { Redirect, usePathname } from 'expo-router';

/**
 * Handler for URLs with -- prefix
 * This file is located at app/--.tsx to catch URLs with the -- pattern
 */
export default function DoubleDashHandler() {
  const pathname = usePathname();
  console.log('🔍 DOUBLE DASH HANDLER: Caught URL with -- pattern:', pathname);
  
  // Extract the path after --
  const cleanPath = pathname.replace(/^\/--\//, '/');
  console.log('🔍 DOUBLE DASH HANDLER: Cleaned path:', cleanPath);
  
  // Handle specific cases
  if (pathname.includes('/app')) {
    console.log('🔍 DOUBLE DASH HANDLER: Redirecting to /app');
    return <Redirect href="/app" />;
  }
  
  if (pathname.includes('/onboarding') || pathname.includes('/welcome')) {
    console.log('🔍 DOUBLE DASH HANDLER: Redirecting to /onboarding/welcome');
    return <Redirect href="/onboarding/welcome" />;
  }
  
  // Default redirect to cleaned path
  return <Redirect href={cleanPath} />;
} 