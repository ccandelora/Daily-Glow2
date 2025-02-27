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
    console.log(`[DeepLinkHandler] Received deep link on ${Platform.OS}:`, url);
    
    try {
      // For our custom scheme links, we need to handle them differently
      if (url.startsWith('daily-glow://')) {
        console.log('[DeepLinkHandler] Handling custom scheme URL');
        
        // Check if this is a confirm-email link
        if (url.includes('confirm-email')) {
          console.log('[DeepLinkHandler] This is a confirm-email deep link');
          
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
                  [{ text: 'OK', onPress: () => router.replace('/(auth)/sign-in') }]
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
                  [{ text: 'OK', onPress: () => router.replace('/(app)') }]
                );
              }
            } catch (error) {
              console.error('[DeepLinkHandler] Error in code exchange:', error);
              showError('An error occurred during verification');
              
              Alert.alert(
                'Verification Error',
                `An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
                [{ text: 'OK', onPress: () => router.replace('/(auth)/sign-in') }]
              );
            }
          }
          // If we have a token, verify it (legacy flow)
          else if (params.token) {
            console.log('[DeepLinkHandler] Found token in custom scheme URL:', params.token);
            
            try {
              const success = await verifyEmailWithToken(params.token);
              
              if (success) {
                console.log('[DeepLinkHandler] Email verification successful!');
                showSuccess('Email verified successfully!');
                // Refresh the session to update the verification status
                await refreshSession();
                
                // Show a success alert
                Alert.alert(
                  'Verification Successful',
                  'Your email has been verified successfully!',
                  [{ text: 'OK', onPress: () => router.replace('/(app)') }]
                );
              } else {
                console.error('[DeepLinkHandler] Email verification failed');
                showError('Failed to verify email. The link may have expired.');
                
                // Show a failure alert
                Alert.alert(
                  'Verification Failed',
                  'Failed to verify email. The link may have expired.',
                  [{ text: 'OK', onPress: () => router.replace('/(auth)/sign-in') }]
                );
              }
            } catch (error) {
              console.error('[DeepLinkHandler] Error handling verification token:', error);
              showError('An error occurred while verifying your email');
              
              // Show an error alert
              Alert.alert(
                'Verification Error',
                `An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
                [{ text: 'OK', onPress: () => router.replace('/(auth)/sign-in') }]
              );
            }
          } else {
            // If we don't have a token or code, just refresh the session
            console.log('[DeepLinkHandler] No token or code found in custom scheme URL, refreshing session');
            await refreshSession();
            router.replace('/(app)');
          }
        }
      }
      // For Supabase verification links (https://...)
      else if (url.includes('supabase.co/auth/v1/verify') || url.includes('supabase.co/auth/v1/callback')) {
        console.log('[DeepLinkHandler] Handling Supabase verification/callback URL');
        
        // Parse the URL to extract parameters
        const params = parseQueryParams(url);
        console.log('[DeepLinkHandler] Supabase URL params:', JSON.stringify(params));
        
        // Handle PKCE flow with code parameter
        if (params.code) {
          console.log('[DeepLinkHandler] Found code in Supabase URL, exchanging for session');
          
          try {
            // Exchange the code for a session
            const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);
            
            if (error) {
              console.error('[DeepLinkHandler] Error exchanging code for session:', error);
              showError('Failed to verify email: ' + error.message);
              
              Alert.alert(
                'Verification Failed',
                'Failed to verify email: ' + error.message,
                [{ text: 'OK', onPress: () => router.replace('/(auth)/sign-in') }]
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
                [{ text: 'OK', onPress: () => router.replace('/(app)') }]
              );
            }
          } catch (error) {
            console.error('[DeepLinkHandler] Error in code exchange:', error);
            showError('An error occurred during verification');
            
            Alert.alert(
              'Verification Error',
              `An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
              [{ text: 'OK', onPress: () => router.replace('/(auth)/sign-in') }]
            );
          }
        }
        // Get the token from the URL parameters (legacy flow)
        else if (params.token) {
          console.log('[DeepLinkHandler] Found verification token in Supabase URL:', params.token);
          
          // Show an alert to inform the user
          Alert.alert(
            'Verification in Progress',
            'Processing your email verification...',
            [{ text: 'OK' }]
          );
          
          try {
            // Complete the verification by exchanging the token for a session
            const success = await verifyEmailWithToken(params.token);
            
            if (success) {
              console.log('[DeepLinkHandler] Email verification successful!');
              showSuccess('Email verified successfully!');
              // Refresh the session to update the verification status
              await refreshSession();
              
              // Show a success alert
              Alert.alert(
                'Verification Successful',
                'Your email has been verified successfully!',
                [{ text: 'OK', onPress: () => router.replace('/(app)') }]
              );
            } else {
              console.error('[DeepLinkHandler] Email verification failed');
              showError('Failed to verify email. The link may have expired.');
              
              // Show a failure alert
              Alert.alert(
                'Verification Failed',
                'Failed to verify email. The link may have expired.',
                [{ text: 'OK', onPress: () => router.replace('/(auth)/sign-in') }]
              );
            }
          } catch (error) {
            console.error('[DeepLinkHandler] Error handling verification token:', error);
            showError('An error occurred while verifying your email');
            
            // Show an error alert
            Alert.alert(
              'Verification Error',
              `An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
              [{ text: 'OK', onPress: () => router.replace('/(auth)/sign-in') }]
            );
          }
        } else {
          console.log('[DeepLinkHandler] No token or code found in Supabase verification link');
          showError('Invalid verification link. No token or code found.');
          
          // Show an invalid link alert
          Alert.alert(
            'Invalid Link',
            'No verification token or code found in the link.',
            [{ text: 'OK', onPress: () => router.replace('/(auth)/sign-in') }]
          );
        }
      }
    } catch (error) {
      console.error('[DeepLinkHandler] Error handling deep link:', error);
      
      // Show a general error alert
      Alert.alert(
        'Deep Link Error',
        `Error processing link: ${error instanceof Error ? error.message : 'Unknown error'}`,
        [{ text: 'OK' }]
      );
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
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('[DeepLinkHandler] App opened via deep link:', url);
        handleDeepLink(url);
      } else {
        console.log('[DeepLinkHandler] No initial URL');
      }
    }).catch(error => {
      console.error('[DeepLinkHandler] Error getting initial URL:', error);
    });
    
    return () => {
      console.log('[DeepLinkHandler] Removing deep link handler');
      subscription.remove();
    };
  }, []);
  
  // This component doesn't render anything
  return null;
}; 