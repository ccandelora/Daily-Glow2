import { Redirect, usePathname } from 'expo-router';
import { Platform } from 'react-native';

/**
 * Comprehensive URL cleanup function for Expo development environments
 * Handles various URL patterns that can occur in development mode
 * Based on best practices for Expo Router URL handling
 */
export function cleanExpoDevUrl(pathname: string): string {
  if (!pathname) return '/';
  
  // Remove leading --/ 
  if (pathname.startsWith('--/')) {
    pathname = pathname.replace('--/', '');
  }
  
  // Remove leading -- if it exists
  if (pathname.startsWith('--')) {
    pathname = pathname.slice(2);
  }
  
  // Remove leading slash if exists
  if (pathname.startsWith('/')) {
    pathname = pathname.slice(1);
  }
  
  // Special handling for common development URL patterns
  pathname = pathname
    .replace(/^--/, '')           // Remove leading --
    .replace(/--/g, '/')          // Replace internal -- with /
    .replace(/^\(app\)\//, '')    // Remove (app) group prefix
    .replace(/^\(auth\)\//, '')   // Remove (auth) group prefix
    .replace(/^\(onboarding\)\//, 'onboarding/'); // Convert (onboarding) to onboarding
  
  // Handle any remaining group patterns
  pathname = pathname.replace(/^\(.*?\)\//, '');
  
  // Ensure path starts with / for proper routing
  return pathname.startsWith('/') ? pathname : `/${pathname}`;
}

/**
 * Universal route handler component for development and production
 * Only attempts cleanup in development mode
 */
export function RouteHandler({ pathname }: { pathname: string }) {
  // Skip if not in development
  if (Platform.OS !== 'web' && !__DEV__) {
    return null;
  }

  // Skip for already clean paths
  if (!pathname || pathname === '/' || !pathname.includes('--')) {
    return null;
  }

  console.log('[RouteHandler] Processing URL pattern:', pathname);
  const cleanedPath = cleanExpoDevUrl(pathname);
  
  // Redirect if path has been modified
  if (cleanedPath !== pathname) {
    console.log('[RouteHandler] Redirecting to cleaned path:', cleanedPath);
    return <Redirect href={cleanedPath} />;
  }
  
  return null;
} 