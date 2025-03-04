import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, redirectUrl } from '@/lib/supabase';
import { useAppState } from './AppStateContext';
import { Platform } from 'react-native';
import { BadgeService } from '@/services/BadgeService';
import { useBadges } from '@/contexts/BadgeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { useProfile } from './UserProfileContext';
import * as Linking from 'expo-linking';
import { getCorrectRoutePath } from '@/utils/urlUtils';
import { isDevelopment } from '@/utils/developmentUtils';

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isEmailVerified: boolean;
}

interface AuthContextType extends AuthState {
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (newPassword: string) => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
  refreshSession: () => Promise<{ isVerified: boolean; user: User | null }>;
  // Development only method
  devManuallyVerifyEmail: (email: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Get the onboarding storage key to directly reset it for new users
const ONBOARDING_STATE_KEY = '@onboarding_state';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    isLoading: true,
    isEmailVerified: false,
  });

  const { showError, showSuccess } = useAppState();
  const { setUserId } = useBadges();
  const router = useRouter();

  // Check if email is verified
  const checkEmailVerification = (user: User | null) => {
    if (!user) return false;
    
    // Supabase stores email verification status in user metadata
    return user.email_confirmed_at !== null;
  };

  // Refresh the session to get the latest user data
  const refreshSession = async () => {
    try {
      console.log('Refreshing session...');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Error refreshing session:', error.message);
        throw error;
      }
      
      console.log('Session refreshed, checking verification status...');
      const isVerified = checkEmailVerification(data.user);
      console.log('Email verified:', isVerified);
      
      setState(prev => ({
        ...prev,
        session: data.session,
        user: data.user,
        isEmailVerified: isVerified,
      }));
      
      if (isVerified) {
        showSuccess('Email verified successfully!');
      }
      
      // Set the user ID in the BadgeContext
      setUserId(data.user?.id || null);
      
      return { isVerified, user: data.user };
    } catch (error) {
      console.error('Failed to refresh session:', error);
      showError(error instanceof Error ? error.message : 'Failed to refresh session');
      return { isVerified: false, user: null };
    }
  };

  // DEVELOPMENT ONLY: Manually verify an email for testing
  const devManuallyVerifyEmail = async (email: string): Promise<boolean> => {
    try {
      console.log('DEV: Manually verifying email:', email);
      
      // This is a development-only function
      // In a real app, you would need a secure server-side function
      // to update the user's email_confirmed_at field
      
      // For development, we'll just show a success message and
      // instruct the user to manually verify in the Supabase dashboard
      showSuccess('DEV: Please manually verify this email in the Supabase dashboard');
      
      // In a real implementation, you would call a secure server function:
      // const { error } = await supabase.functions.invoke('manually-verify-email', {
      //   body: { email }
      // });
      
      return true;
    } catch (error) {
      console.error('DEV: Failed to manually verify email:', error);
      showError('Failed to manually verify email');
      return false;
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const isVerified = checkEmailVerification(session?.user ?? null);
      setState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
        isLoading: false,
        isEmailVerified: isVerified,
      }));
      
      // Set the user ID in the BadgeContext
      setUserId(session?.user?.id || null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const isVerified = checkEmailVerification(session?.user ?? null);
      setState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
        isEmailVerified: isVerified,
      }));
      
      // Set the user ID in the BadgeContext
      setUserId(session?.user?.id || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      console.log('[AuthContext] Signing up with redirectTo:', redirectUrl);
      
      // For development, ensure we're using the correct redirect URL
      let emailRedirectTo = redirectUrl;
      
      // Log the redirect URL for debugging
      console.log('[AuthContext] Using redirect URL:', emailRedirectTo);
      
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo
        }
      });

      if (error) throw error;
      
      console.log('[AuthContext] Sign up successful, user data:', data.user);
      console.log('[AuthContext] Verification email sent to:', email);
      
      // Remove the attempt to award welcome badge during signup
      // Instead, just log that we'll award it after verification
      console.log('Welcome badge will be awarded when user signs in after email verification');
      
      showSuccess('Account created! Please check your email for verification. After verifying, come back and sign in.');
    } catch (error) {
      console.error('[AuthContext] Sign up error:', error);
      showError(error instanceof Error ? error.message : 'Failed to sign up');
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      console.log('🔍 DEBUG: Starting sign in process for:', email);

      // Attempt to sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('🔍 DEBUG: Sign in error:', error.message);
        showError(error.message);
        throw error;
      }

      // Update session state
      setState(prev => ({
        ...prev,
        session: data.session,
        user: data.user
      }));
      
      // Check if email is verified
      const isVerified = checkEmailVerification(data.user);
      setState(prev => ({
        ...prev,
        isEmailVerified: isVerified
      }));
      
      console.log('🔍 DEBUG: Sign in successful, user data:', JSON.stringify({
        id: data.user?.id,
        email: data.user?.email,
        created_at: data.user?.created_at,
        last_sign_in_at: data.user?.last_sign_in_at,
        email_confirmed_at: data.user?.email_confirmed_at
      }));
      console.log('🔍 DEBUG: Email verification status:', isVerified);
      
      // If email is verified, ensure proper onboarding
      if (isVerified) {
        console.log('🔍 DEBUG: User authenticated successfully, checking onboarding status');
        
        // Check if this is a new user (created within the last 5 minutes)
        const createdAt = new Date(data.user?.created_at || '').getTime();
        const lastSignIn = new Date(data.user?.last_sign_in_at || '').getTime();
        const emailConfirmedAt = new Date(data.user?.email_confirmed_at || '').getTime();
        const timeDifference = Math.abs(createdAt - lastSignIn);
        const isNewUser = timeDifference < 300000; // 5 minutes in milliseconds
        
        console.log('🔍 DEBUG: User newness check:', {
          created_at: new Date(createdAt).toISOString(),
          last_sign_in_at: new Date(lastSignIn).toISOString(),
          email_confirmed_at: data.user?.email_confirmed_at,
          timeDifference: `${timeDifference}ms`,
          isNewUser,
          isVerified
        });
        
        // Check if the user has completed onboarding
        const { data: profileData } = await supabase
          .from('profiles')
          .select('has_completed_onboarding')
          .eq('user_id', data.user?.id)
          .single();
          
        const hasCompletedOnboarding = profileData?.has_completed_onboarding || false;
        console.log('🔍 DEBUG: Onboarding completion status:', hasCompletedOnboarding);
        
        // For new users or users who haven't completed onboarding,
        // reset onboarding state and direct to onboarding flow
        if (isNewUser || !hasCompletedOnboarding) {
          console.log('🔍 DEBUG: User needs to complete onboarding');
          
          // Reset onboarding state by clearing the AsyncStorage key
          await AsyncStorage.removeItem(ONBOARDING_STATE_KEY);
          
          // Reset onboarding in database if it's a new user
          if (isNewUser) {
            console.log('🔍 DEBUG: New user, resetting onboarding status in database');
            await supabase
              .from('profiles')
              .update({ has_completed_onboarding: false })
              .eq('user_id', data.user?.id);
          }
          
          // Set a flag to force navigation to the welcome screen
          await AsyncStorage.setItem('ONBOARDING_PATH', '/onboarding/welcome');
          await AsyncStorage.setItem('FORCE_ONBOARDING_NAVIGATION', 'true');
          
          // Verify the flags were set
          const forceNav = await AsyncStorage.getItem('FORCE_ONBOARDING_NAVIGATION');
          const path = await AsyncStorage.getItem('ONBOARDING_PATH');
          console.log('🔍 DEBUG: Navigation flags set:', { forceNav, path });
          
          try {
            // Navigate to the onboarding welcome screen
            console.log('🔍 DEBUG: Navigating to onboarding welcome screen');
            router.replace('/onboarding/welcome');
          } catch (error) {
            console.error('🔍 DEBUG: Navigation error:', error);
            console.error('Failed to navigate to onboarding. Trying alternative approach...');
            
            // Use a timeout as a fallback
            setTimeout(() => {
              try {
                router.replace('/onboarding/welcome');
              } catch (secondError) {
                console.error('🔍 DEBUG: Second navigation attempt failed:', secondError);
                // As a last resort, show success and let the AuthMiddleware handle it
                showSuccess('Signed in successfully. Please restart the app if you are not redirected.');
              }
            }, 300);
          }
        } else {
          // User has already completed onboarding, go to main app
          console.log('🔍 DEBUG: User has completed onboarding, navigating to app');
          
          try {
            router.replace('/app');
          } catch (error) {
            console.error('🔍 DEBUG: Navigation error:', error);
            
            // Use a timeout as a fallback
            setTimeout(() => {
              try {
                router.replace('/app');
              } catch (secondError) {
                console.error('🔍 DEBUG: Second navigation attempt failed:', secondError);
              }
            }, 300);
          }
          
          showSuccess('Signed in successfully!');
        }
      } else {
        // Email not verified
        console.log('🔍 DEBUG: User needs to verify email');
        showError('Please verify your email before signing in.');
      }
    } catch (error) {
      console.error('🔍 DEBUG: Sign in process error:', error);
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const resendVerificationEmail = async (email: string) => {
    try {
      // Use the redirectUrl that's already imported at the top of the file
      console.log('[AuthContext] Resending verification email with redirectTo:', redirectUrl);
        
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: redirectUrl
        }
      });
      
      if (error) throw error;
      
      showSuccess('Verification email sent! Please check your inbox. After verifying, come back and sign in.');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to resend verification email');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to sign out');
      throw error;
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      console.log('[AuthContext] Sending password reset email with redirectTo:', redirectUrl);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });
      
      if (error) throw error;
      
      showSuccess('Password reset email sent! Please check your inbox.');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to send reset password email');
      throw error;
    }
  };

  const resetPassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to reset password');
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signUp,
        signIn,
        signOut,
        forgotPassword,
        resetPassword,
        resendVerificationEmail,
        refreshSession,
        devManuallyVerifyEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 