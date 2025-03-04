import { Redirect } from 'expo-router';
import { Platform } from 'react-native';
import React from 'react';

/**
 * Cleans up Expo development URLs by removing prefixes and group notations
 * @param pathname The current pathname to clean
 * @returns The cleaned pathname
 */
export function cleanExpoDevUrl(pathname: string): string {
  if (!pathname) return 'index';
  
  // Remove /--/ prefix (common in development URLs)
  if (pathname.includes('/--/')) {
    pathname = pathname.replace('/--/', '/');
  }
  
  // Remove --/ prefix (alternative format)
  if (pathname.startsWith('--/')) {
    pathname = pathname.replace('--/', '');
  }
  
  // Remove group notation like (app), (auth), etc.
  pathname = pathname.replace(/\(.*?\)/g, '');
  
  // Remove leading slashes
  pathname = pathname.replace(/^\/+/, '');
  
  // Handle specific app routing
  if (pathname === 'app' || pathname.startsWith('app/')) {
    return pathname;
  }
  
  // Handle onboarding routes
  if (pathname.includes('onboarding') || pathname.includes('welcome')) {
    return 'onboarding/welcome';
  }
  
  // Handle auth routes
  if (pathname.includes('auth')) {
    return pathname.includes('sign-in') ? 'auth/sign-in' : 'auth/sign-up';
  }
  
  return pathname || 'index';
}

/**
 * Component that handles development URLs by redirecting to the cleaned path
 */
export function DevRouteHandler({ pathname }: { pathname: string }): React.ReactNode {
  // Only apply in development
  if (__DEV__) {
    console.log('🔍 DEV ROUTE HANDLER: Processing path:', pathname);
    
    // Skip if not a development URL
    if (!pathname.includes('--')) {
      return null;
    }
    
    const cleanedPath = cleanExpoDevUrl(pathname);
    console.log('🔍 DEV ROUTE HANDLER: Cleaned path:', cleanedPath);
    
    // Redirect if path has been modified
    if (cleanedPath !== pathname) {
      console.log('🔍 DEV ROUTE HANDLER: Redirecting to:', cleanedPath);
      return <Redirect href={`/${cleanedPath}`} />;
    }
  }
  
  return null;
} 