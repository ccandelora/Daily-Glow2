import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';
import { useAppState } from './AppStateContext';

// Define the context type
type OnboardingContextType = {
  hasCompletedOnboarding: boolean | null;
  loading: boolean;
  completeOnboarding: () => Promise<void>;
};

// Create the context with default values
const OnboardingContext = createContext<OnboardingContextType>({
  hasCompletedOnboarding: null,
  loading: true,
  completeOnboarding: async () => {},
});

// Provider component
export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const { session, user } = useAuth();
  const { setLoading, showError } = useAppState();
  // TEMPORARY: Set default to false to force onboarding to show for testing
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(false);
  const [loading, setLocalLoading] = useState<boolean>(false);

  console.log('🔍 OnboardingProvider initialized with user:', user?.id);

  // Check the user's onboarding status
  const checkOnboardingStatus = async () => {
    setLocalLoading(true);
    console.log('🔍 Checking onboarding status for user ID:', user?.id);

    if (!user) {
      console.log('⚠️ No user found, cannot check onboarding status');
      setHasCompletedOnboarding(false);
      setLocalLoading(false);
      return;
    }

    try {
      // Try to use the RPC function first
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('check_user_onboarding', { user_id_param: user.id });

      if (rpcError) {
        console.error('🔴 Error using RPC function:', rpcError.message);
        
        // Fall back to direct query
        const { data, error } = await supabase
          .from('user_profiles')
          .select('has_completed_onboarding')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('🔴 Error fetching onboarding status:', error.message);
          // TEMPORARY: Force to false for testing
          setHasCompletedOnboarding(false);
        } else if (data) {
          console.log('✅ Retrieved onboarding status:', data.has_completed_onboarding);
          // TEMPORARY: Force to false for testing
          setHasCompletedOnboarding(false);
        } else {
          console.log('⚠️ No user profile found, creating one with default onboarding status');
          // Create a user profile record with default onboarding status
          const { error: insertError } = await supabase
            .from('user_profiles')
            .insert({ 
              user_id: user.id, 
              has_completed_onboarding: false 
            });

          if (insertError) {
            console.error('🔴 Error creating user profile:', insertError.message);
          }
          setHasCompletedOnboarding(false);
        }
      } else {
        console.log('✅ Retrieved onboarding status via RPC:', rpcData);
        // TEMPORARY: Force to false for testing
        setHasCompletedOnboarding(false);
      }
    } catch (error) {
      console.error('🔴 Unexpected error checking onboarding status:', error);
      setHasCompletedOnboarding(false);
    } finally {
      setLocalLoading(false);
    }
  };

  // Complete the onboarding process
  const completeOnboarding = async () => {
    if (!user) {
      console.log('⚠️ No user found, cannot complete onboarding');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ has_completed_onboarding: true })
        .eq('user_id', user.id);

      if (error) {
        showError('Failed to update onboarding status');
        console.error('🔴 Error completing onboarding:', error.message);
      } else {
        console.log('✅ Successfully completed onboarding');
        setHasCompletedOnboarding(true);
      }
    } catch (error) {
      showError('An unexpected error occurred');
      console.error('🔴 Unexpected error in completeOnboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check onboarding status when user changes
  useEffect(() => {
    console.log('🔍 OnboardingProvider user effect triggered:', user?.id);
    if (user) {
      console.log('🔍 User found, checking onboarding status');
      checkOnboardingStatus();
    } else {
      console.log('⚠️ No user, resetting onboarding status');
      setHasCompletedOnboarding(null);
      setLocalLoading(false);
    }
  }, [user]);

  // Log state changes for debugging
  useEffect(() => {
    console.log('🔍 OnboardingContext state:', { hasCompletedOnboarding, loading });
  }, [hasCompletedOnboarding, loading]);

  return (
    <OnboardingContext.Provider
      value={{
        hasCompletedOnboarding,
        loading,
        completeOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

// Custom hook to use the onboarding context
export const useOnboarding = () => useContext(OnboardingContext); 