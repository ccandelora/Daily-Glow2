import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { Platform } from 'react-native';

/**
 * Direct URL handler that intercepts problematic development URLs
 * at the Linking level before they even reach Expo Router.
 * 
 * This follows best practices by:
 * 1. Only running in development mode
 * 2. Using proper TypeScript types
 * 3. Properly cleaning up listeners
 * 4. Using a consistent logging pattern
 */
export function useLinkingFix() {
  useEffect(() => {
    // Only apply in development mode on native platforms
    if (!__DEV__ || Platform.OS === 'web') {
      return;
    }
    
    console.log('🔧 LINKING FIX: Installing URL listener for development URLs');
    
    // Function to handle URL open events
    const handleUrl = (event: { url: string }) => {
      const { url } = event;
      console.log('🔧 LINKING FIX: URL detected:', url);
      
      // Handle the specific problematic URL pattern
      if (url.includes('--/app')) {
        console.log('🔧 LINKING FIX: Intercepting problematic URL pattern');
        
        // Navigate manually after a short delay
        setTimeout(() => {
          console.log('🔧 LINKING FIX: Redirecting to /app');
          router.replace('/app');
        }, 50);
        
        return true; // Signal that we handled this URL
      }
      
      // Add other patterns as needed
      if (url.includes('--/auth')) {
        console.log('🔧 LINKING FIX: Intercepting auth URL pattern');
        setTimeout(() => router.replace('/auth/sign-in'), 50);
        return true;
      }
      
      if (url.includes('--/onboarding') || url.includes('--/welcome')) {
        console.log('🔧 LINKING FIX: Intercepting welcome URL pattern');
        setTimeout(() => router.replace('/onboarding/welcome'), 50);
        return true;
      }
      
      return false; // Signal that we didn't handle this URL
    };
    
    // Add listener for URL open events
    const subscription = Linking.addEventListener('url', handleUrl);
    
    // Check initial URL (in case app was opened with URL)
    Linking.getInitialURL().then(url => {
      if (url) {
        handleUrl({ url });
      }
    });
    
    // Properly clean up on unmount
    return () => {
      subscription.remove();
    };
  }, []);
} 