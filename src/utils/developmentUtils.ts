/**
 * Utilities for handling development-specific functionality
 */

import Constants from 'expo-constants';

/**
 * Check if the app is running in development mode
 */
export const isDevelopment = __DEV__;

/**
 * Clean a development path by removing the development server prefix
 * @param path The path to clean
 * @returns The cleaned path
 */
export function cleanDevelopmentPath(path: string): string {
  if (!path) return '';
  
  // Handle Expo development URLs with double dash pattern
  if (path.includes('/--/')) {
    // Extract the part after /--/
    const cleanPath = path.split('/--/')[1];
    console.log('🔍 DEV UTILS: Cleaned path from', path, 'to', cleanPath);
    return cleanPath;
  }
  
  // Handle paths that start with --/
  if (path.startsWith('--/')) {
    const cleanPath = path.substring(3); // Remove the '--/' prefix
    console.log('🔍 DEV UTILS: Cleaned path from', path, 'to', cleanPath);
    return cleanPath;
  }
  
  return path;
}

/**
 * Check if a path is a development URL
 * @param path The path to check
 * @returns Whether the path is a development URL
 */
export function isDevelopmentUrl(path: string): boolean {
  if (!path) return false;
  
  // Check for common development URL patterns
  const isDevUrl = path.includes('/--/') || 
                  path.startsWith('--/') || 
                  path.includes('exp://');
  
  if (isDevUrl && __DEV__) {
    console.log('🔍 DEV UTILS: Development URL detected:', path);
  }
  
  return isDevUrl;
}

/**
 * Get information about the Expo development server
 * @returns Object with server information or null if not in development
 */
export function getDevServerInfo() {
  if (!__DEV__) return null;
  
  try {
    // This would be expanded with actual server info in a real implementation
    return {
      isDevServer: true,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error getting dev server info:', error);
    return null;
  }
}

/**
 * Log debug information when in development mode
 * @param message The message to log
 * @param data Additional data to log
 */
export function logDevInfo(message: string, data?: any): void {
  if (!__DEV__) return;
  
  console.log(`🔍 DEV DEBUG: ${message}`, data || '');
}

// Map of exact development URL patterns to their target routes
// This is a direct mapping used as a last resort for stubborn routes
const DEV_URL_EXACT_MAPPINGS: Record<string, string> = {
  '/--/app': '/app',
  'exp://10.0.0.38:8081/--/app': '/app',
  '--/app': '/app',
  '/--/auth/sign-in': '/auth/sign-in',
  '/--/onboarding/welcome': '/onboarding/welcome',
  '/--/welcome': '/onboarding/welcome',
};

/**
 * Get a direct route mapping for stubborn development URLs
 * Returns the mapped route or null if no mapping exists
 */
export function getExactDevUrlMapping(url: string | null): string | null {
  if (!url || !isDevelopment) return null;
  
  // Clean the URL from any prefixes like exp://IP:PORT
  const cleanUrl = url.replace(/^exp:\/\/[^\/]+/, '');
  
  // Check direct mappings
  if (DEV_URL_EXACT_MAPPINGS[url]) {
    console.log('🔍 DEBUG: Found exact URL mapping for:', url);
    return DEV_URL_EXACT_MAPPINGS[url];
  }
  
  // Check for the cleaned URL
  if (DEV_URL_EXACT_MAPPINGS[cleanUrl]) {
    console.log('🔍 DEBUG: Found exact URL mapping for cleaned URL:', cleanUrl);
    return DEV_URL_EXACT_MAPPINGS[cleanUrl];
  }
  
  // Check URL patterns by examining parts of the URL
  const devPatterns = Object.keys(DEV_URL_EXACT_MAPPINGS);
  for (const pattern of devPatterns) {
    if (cleanUrl.includes(pattern)) {
      console.log('🔍 DEBUG: Found partial URL mapping for:', cleanUrl, '→', DEV_URL_EXACT_MAPPINGS[pattern]);
      return DEV_URL_EXACT_MAPPINGS[pattern];
    }
  }
  
  // No mapping found
  return null;
} 