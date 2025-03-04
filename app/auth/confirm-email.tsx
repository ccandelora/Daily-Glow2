import React, { useEffect } from 'react';
import { EmailVerificationSuccessScreen } from '@/screens/auth/EmailVerificationSuccessScreen';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useAppState } from '@/contexts/AppStateContext';
import { verifyEmailWithToken } from '@/utils/authUtils';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';

export default function ConfirmEmailPage() {
  const { refreshSession } = useAuth();
  const { showSuccess, showError } = useAppState();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  useEffect(() => {
    const handleVerification = async () => {
      console.log('ConfirmEmailPage mounted with params:', JSON.stringify(params));
      
      // Check if we have a code in the URL params (PKCE flow)
      const code = params.code as string;
      
      if (code) {
        try {
          console.log('Exchanging code for session:', code);
          
          // Exchange the code for a session
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error('Error exchanging code for session:', error);
            showError('Failed to verify email: ' + error.message);
            
            Alert.alert(
              'Verification Failed',
              'Failed to verify email: ' + error.message,
              [{ text: 'OK', onPress: () => router.replace('(auth)/sign-in') }]
            );
            return;
          }
          
          if (data.session) {
            console.log('Successfully exchanged code for session');
            showSuccess('Email verified successfully!');
            
            // Refresh the session to update the verification status
            await refreshSession();
            
            // Show a success alert
            Alert.alert(
              'Verification Successful',
              'Your email has been verified successfully!',
              [{ text: 'OK', onPress: () => router.replace('(app)') }]
            );
          }
        } catch (error) {
          console.error('Error in code exchange:', error);
          showError('An error occurred during verification');
          
          Alert.alert(
            'Verification Error',
            `An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
            [{ text: 'OK', onPress: () => router.replace('(auth)/sign-in') }]
          );
        }
      }
      // Check if we have a token in the URL params (legacy flow)
      else {
        const token = params.token as string;
        
        if (token) {
          try {
            console.log('Verifying email with token from deep link params:', token);
            const success = await verifyEmailWithToken(token);
            
            if (success) {
              console.log('Email verification successful!');
              showSuccess('Email verified successfully!');
              // Refresh the session to update the verification status
              await refreshSession();
              
              // Show an alert for debugging in Expo Go
              Alert.alert(
                'Verification Successful',
                'Your email has been verified successfully!',
                [{ text: 'OK', onPress: () => router.replace('(app)') }]
              );
            } else {
              console.error('Email verification failed');
              showError('Failed to verify email. The link may have expired.');
              
              // Show an alert for debugging in Expo Go
              Alert.alert(
                'Verification Failed',
                'Failed to verify email. The link may have expired.',
                [{ text: 'OK', onPress: () => router.replace('(auth)/sign-in') }]
              );
            }
          } catch (error) {
            console.error('Error handling verification token:', error);
            showError('An error occurred while verifying your email');
            
            // Show an alert for debugging in Expo Go
            Alert.alert(
              'Verification Error',
              `An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
              [{ text: 'OK', onPress: () => router.replace('(auth)/sign-in') }]
            );
          }
        } else {
          console.log('No token or code found in params, refreshing session');
          // If no token or code, just refresh the session
          // This handles the case where verification happened in the browser
          await refreshSession();
        }
      }
    };
    
    handleVerification();
  }, [params.token, params.code]);
  
  return <EmailVerificationSuccessScreen />;
} 