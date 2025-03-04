import React, { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { useAuth } from '@/contexts/AuthContext';
import { useAppState } from '@/contexts/AppStateContext';
import { verifyEmailWithToken } from '@/utils/authUtils';
import { useRouter } from 'expo-router';
import { Alert, Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

// Simple function to parse query parameters from a URL
const parseQueryParams = (url: string): Record<string, string> => {
  try {
    const parsedUrl = new URL(url);
    const params: Record<string, string> = {};
    
    // Get query parameters from the URL
    parsedUrl.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    // Also check for hash fragment parameters (common in OAuth flows)
    if (parsedUrl.hash) {
      const hashParams = new URLSearchParams(parsedUrl.hash.substring(1));
      hashParams.forEach((value, key) => {
        params[key] = value;
      });
    }
    
    return params;
  } catch (error) {
    console.error('Error parsing URL:', error);
    return {};
  }
};

export const DeepLinkHandler = () => {
  const { refreshSession } = useAuth();
  const { showSuccess, showError } = useAppState();
  const router = useRouter();
  
  // Handle deep links
  const handleDeepLink = async (url: string) => {
    console.log(`[DeepLinkHandler] Received deep link:`, url);
    
    try {
      // Parse the URL to extract parameters
      const params = parseQueryParams(url);
      console.log('[DeepLinkHandler] Deep link params:', JSON.stringify(params));
      
      // Handle PKCE flow with code parameter
      if (params.code) {
        console.log('[DeepLinkHandler] Found code in URL, exchanging for session');
        
        try {
          // Exchange the code for a session
          const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);
          
          if (error) {
            console.error('[DeepLinkHandler] Error exchanging code for session:', error);
            showError('Failed to verify email: ' + error.message);
            
            Alert.alert(
              'Verification Failed',
              'Failed to verify email: ' + error.message,
              [{ text: 'OK', onPress: () => router.replace('/auth/sign-in') }]
            );
            return;
          }
          
          if (data.session) {
            console.log('[DeepLinkHandler] Successfully exchanged code for session');
            showSuccess('Email verified successfully!');
            
            // Refresh the session to update the verification status
            await refreshSession();
            
            // Show a success alert
            Alert.alert(
              'Verification Successful',
              'Your email has been verified successfully!',
              [{ text: 'OK', onPress: () => router.replace('/app') }]
            );
          }
        } catch (error) {
          console.error('[DeepLinkHandler] Error in code exchange:', error);
          showError('An error occurred during verification');
          
          Alert.alert(
            'Verification Error',
            `An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
            [{ text: 'OK', onPress: () => router.replace('/auth/sign-in') }]
          );
        }
        return;
      }
      
      // Handle token parameter
      if (params.token) {
        console.log('[DeepLinkHandler] Found token in URL, verifying email');
        
        try {
          const success = await verifyEmailWithToken(params.token);
          
          if (success) {
            console.log('[DeepLinkHandler] Email verification successful');
            showSuccess('Email verified successfully!');
            
            // Refresh the session to update the verification status
            await refreshSession();
            
            // Show a success alert
            Alert.alert(
              'Verification Successful',
              'Your email has been verified successfully!',
              [{ text: 'OK', onPress: () => router.replace('/app') }]
            );
          } else {
            console.error('[DeepLinkHandler] Email verification failed');
            showError('Failed to verify email. The link may have expired.');
            
            Alert.alert(
              'Verification Failed',
              'Failed to verify email. The link may have expired.',
              [{ text: 'OK', onPress: () => router.replace('/auth/sign-in') }]
            );
          }
        } catch (error) {
          console.error('[DeepLinkHandler] Error verifying email:', error);
          showError('An error occurred during verification');
          
          Alert.alert(
            'Verification Error',
            `An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
            [{ text: 'OK', onPress: () => router.replace('/auth/sign-in') }]
          );
        }
        return;
      }
      
      // If no special parameters, refresh session and navigate to app
      console.log('[DeepLinkHandler] No special parameters found, refreshing session');
      await refreshSession();
      router.replace('/app');
      
    } catch (error) {
      console.error('[DeepLinkHandler] Error handling deep link:', error);
      showError('An error occurred while processing the link');
    }
  };
  
  useEffect(() => {
    console.log('[DeepLinkHandler] Setting up deep link handlers');
    
    // Handle deep links when the app is already open
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('[DeepLinkHandler] Deep link received while app is open:', url);
      handleDeepLink(url);
    });
    
    // Handle deep links that opened the app
    const getInitialLink = async () => {
      try {
        // Get initial URL
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          console.log('[DeepLinkHandler] App opened via deep link:', initialUrl);
          handleDeepLink(initialUrl);
        } else {
          console.log('[DeepLinkHandler] No initial URL found');
        }
      } catch (error) {
        console.error('[DeepLinkHandler] Error getting initial URL:', error);
      }
    };
    
    getInitialLink();
    
    return () => {
      console.log('[DeepLinkHandler] Removing deep link handler');
      subscription.remove();
    };
  }, []);
  
  // This component doesn't render anything
  return null;
}; 