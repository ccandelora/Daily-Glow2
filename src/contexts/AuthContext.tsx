import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, redirectUrl } from '@/lib/supabase';
import { useAppState } from './AppStateContext';
import { Platform } from 'react-native';
import { BadgeService } from '@/services/BadgeService';
import { useBadges } from '@/contexts/BadgeContext';

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    isLoading: true,
    isEmailVerified: false,
  });

  const { showError, showSuccess } = useAppState();
  const { setUserId } = useBadges();

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
        
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) throw error;
      
      // Remove the attempt to award welcome badge during signup
      // Instead, just log that we'll award it after verification
      console.log('Welcome badge will be awarded when user signs in after email verification');
      
      showSuccess('Account created! Please check your email for verification. After verifying, come back and sign in.');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to sign up');
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // Check if email is verified after sign in
      const isVerified = checkEmailVerification(data.user);
      setState(prev => ({
        ...prev,
        isEmailVerified: isVerified,
      }));
      
      if (isVerified) {
        // Try to award welcome badge if this is the first sign-in after verification
        try {
          console.log('Email verified, checking if welcome badge should be awarded...');
          
          // Check if user has any badges
          const { data: userBadges, error: badgesError } = await supabase
            .from('user_badges')
            .select('id')
            .eq('user_id', data.user.id);
            
          if (badgesError) {
            console.error('Error checking user badges:', badgesError);
          } else {
            console.log(`User has ${userBadges?.length || 0} badges`);
            
            if (!userBadges || userBadges.length === 0) {
              console.log('User has no badges, attempting to award welcome badge');
              
              // Get the welcome badge ID
              const { data: badgeData, error: badgeError } = await supabase
                .from('badges')
                .select('id, name')
                .eq('name', 'Welcome Badge')
                .single();
                
              if (badgeError) {
                console.error('Error finding welcome badge:', badgeError);
              } else if (badgeData) {
                console.log(`Found welcome badge: ${badgeData.name} (${badgeData.id})`);
                
                // Insert the user badge
                const { error: insertError } = await supabase
                  .from('user_badges')
                  .insert([
                    { user_id: data.user.id, badge_id: badgeData.id }
                  ]);
                  
                if (insertError) {
                  if (insertError.code === '23505') {
                    console.log('User already has the welcome badge (constraint violation)');
                  } else {
                    console.error('Error inserting welcome badge:', insertError);
                  }
                } else {
                  console.log('Successfully awarded welcome badge to user after verification');
                  showSuccess('🏅 Welcome Badge Unlocked!');
                }
              } else {
                console.log('Welcome badge not found in database');
              }
            } else {
              console.log('User already has badges, skipping welcome badge award');
            }
          }
        } catch (badgeError) {
          console.error('Error awarding welcome badge after verification:', badgeError);
          // Don't let badge error affect sign-in flow
        }
      } else {
        showError('Please verify your email to access all features.');
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to sign in');
      throw error;
    }
  };

  const resendVerificationEmail = async (email: string) => {
    try {
      // For mobile, we'll use a custom redirect URL with our app scheme
      const redirectTo = Platform.OS === 'web' 
        ? window.location.origin + '/verify-email'
        : 'daily-glow://confirm-email';
        
      console.log('[AuthContext] Resending verification email with redirectTo:', redirectTo);
        
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: redirectTo
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
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
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