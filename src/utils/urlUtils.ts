/**
 * Utility functions for handling URLs and routes
 */

/**
 * Get the correct path for a route, ensuring it's in the proper format
 */
export function getCorrectRoutePath(route: string): string {
  // Ensure route has a leading slash if it doesn't already
  if (!route.startsWith('/') && !route.startsWith('?')) {
    return `/${route}`;
  }
  
  return route;
}

/**
 * Helper function to safely parse deep link URLs
 */
export function parseDeepLink(url: string): { path: string; params: Record<string, string> } {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    const params: Record<string, string> = {};
    
    urlObj.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    return { path, params };
  } catch (error) {
    console.error('Error parsing deep link URL:', error);
    return { path: '/', params: {} };
  }
} 