import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';
import { useAppState } from './AppStateContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// Define the context type
type OnboardingContextType = {
  hasCompletedOnboarding: boolean;
  loading: boolean;
  completeOnboarding: () => Promise<void>;
  setHasCompletedOnboarding: (value: boolean) => void;
  dbError: boolean;
  errorType: 'schema' | 'connection' | 'other' | null;
};

// Create the context with default values
const OnboardingContext = createContext<OnboardingContextType>({
  hasCompletedOnboarding: false,
  loading: true,
  completeOnboarding: async () => {},
  setHasCompletedOnboarding: () => {},
  dbError: false,
  errorType: null,
});

// Provider component
export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const { session, user } = useAuth();
  const { setLoading, showError } = useAppState();
  // Start with clear false to ensure onboarding shows
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);
  const [loading, setLocalLoading] = useState<boolean>(true);
  const [dbError, setDbError] = useState<boolean>(false);
  const [errorType, setErrorType] = useState<'schema' | 'connection' | 'other' | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [skipDatabaseOperations, setSkipDatabaseOperations] = useState<boolean>(false);

  console.log('🔍 OnboardingProvider initialized with user:', user?.id);

  // Check the user's onboarding status - first from AsyncStorage, then from database if needed
  const checkOnboardingStatus = async () => {
    setLocalLoading(true);
    console.log('🔍 Checking onboarding status for user ID:', user?.id);

    try {
      // First check AsyncStorage as it's faster and more reliable
      const storedStatus = await AsyncStorage.getItem('hasCompletedOnboarding');
      console.log('🔍 Retrieved from AsyncStorage:', storedStatus);
      
      if (storedStatus === 'true') {
        console.log('✅ Onboarding completed according to AsyncStorage');
        setHasCompletedOnboarding(true);
        setLocalLoading(false);
        return;
      }
      
      // If no user, default to not completed
      if (!user) {
        console.log('⚠️ No user found, assuming onboarding not completed');
        setHasCompletedOnboarding(false);
        setLocalLoading(false);
        return;
      }

      // Skip database operations if we already know there's a schema problem
      if (skipDatabaseOperations) {
        console.log('⚠️ Skipping database operations due to previous schema error');
        setDbError(true);
        setErrorType('schema');
        setHasCompletedOnboarding(false);
        setLocalLoading(false);
        return;
      }

      // If we have a user but no AsyncStorage value, check database
      try {
        // Try to find user in profiles table
        const { data, error } = await supabase
          .from('profiles')  // Using 'profiles' instead of 'user_profiles'
          .select('has_completed_onboarding, id, user_id')
          .eq('user_id', user.id)
          .single();

        if (error) {
          // Check if column doesn't exist
          if (error.message && error.message.includes('column') && error.message.includes('does not exist')) {
            console.error('🔴 Database schema error - column missing:', error.message);
            setDbError(true);
            setErrorType('schema');
            setSkipDatabaseOperations(true);
            
            // Try to find if the profiles table exists but lacks the onboarding column
            try {
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('id, user_id')
                .eq('user_id', user.id)
                .single();
                
              if (!profileError && profileData) {
                console.log('✅ Found profile record but no onboarding column');
                // We found the user in profiles, but the column is missing
                setHasCompletedOnboarding(false);
              } else {
                // Either profiles table doesn't exist or user doesn't have a profile
                console.error('🔴 Could not find user profile:', profileError?.message);
                setHasCompletedOnboarding(false);
              }
            } catch (err) {
              console.error('🔴 Error checking profiles table:', err);
              setHasCompletedOnboarding(false);
            }
          } else if (error.message && error.message.includes('relation') && error.message.includes('does not exist')) {
            // Table doesn't exist
            console.error('🔴 Database schema error - table missing:', error.message);
            setDbError(true);
            setErrorType('schema');
            setSkipDatabaseOperations(true);
            
            // Show one-time alert about schema issue
            Alert.alert(
              "Database Setup Issue",
              "The app couldn't find the required database tables. Continuing in local mode.",
              [{ text: "Continue" }]
            );
            setHasCompletedOnboarding(false);
          } else {
            console.error('🔴 Error fetching onboarding status:', error.message);
            setDbError(true);
            setErrorType('connection');
            setHasCompletedOnboarding(false);
          }
        } else if (data && data.has_completed_onboarding) {
          console.log('✅ Retrieved onboarding status from DB:', data.has_completed_onboarding);
          // Sync to AsyncStorage
          await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
          setHasCompletedOnboarding(true);
        } else {
          console.log('⚠️ Onboarding not completed or no profile found');
          setHasCompletedOnboarding(false);
        }
      } catch (dbError) {
        console.error('🔴 Database connection error:', dbError);
        setDbError(true);
        setErrorType('connection');
        // Continue with onboarding anyway
        setHasCompletedOnboarding(false);
      }
    } catch (error) {
      console.error('🔴 Unexpected error checking onboarding status:', error);
      setHasCompletedOnboarding(false);
      setDbError(true);
      setErrorType('other');
    } finally {
      setLocalLoading(false);
    }
  };

  // Complete the onboarding process
  const completeOnboarding = async () => {
    if (!user) {
      console.log('⚠️ No user found, cannot complete onboarding in DB but will mark as completed locally');
      // Still mark as completed in AsyncStorage even without a user
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      setHasCompletedOnboarding(true);
      return;
    }

    setLoading(true);
    try {
      // Update in AsyncStorage first for faster future checks
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      
      // Skip database operations if we know there's a schema issue
      if (skipDatabaseOperations) {
        console.log('⚠️ Skipping database update due to schema issues, completing locally only');
        setHasCompletedOnboarding(true);
        setLoading(false);
        return;
      }
      
      // Then update in database 
      try {
        // First check if user has a profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, user_id')
          .eq('user_id', user.id)
          .single();
          
        if (profileError) {
          // No profile exists, try to create one
          if (profileError.message && profileError.message.includes('No rows found')) {
            try {
              console.log('Creating new profile for user:', user.id);
              const { error: insertError } = await supabase
                .from('profiles')
                .insert({ 
                  user_id: user.id,
                  has_completed_onboarding: true,
                  display_name: user.email?.split('@')[0] || 'User' // Default display name
                });
                
              if (insertError) {
                if (insertError.message && (insertError.message.includes('column') || insertError.message.includes('relation'))) {
                  console.error('🔴 Database schema error:', insertError.message);
                  setDbError(true);
                  setErrorType('schema');
                  setSkipDatabaseOperations(true);
                } else {
                  console.error('🔴 Error creating profile:', insertError.message);
                  setDbError(true);
                  setErrorType('other');
                }
              } else {
                console.log('✅ Successfully created profile with onboarding completed');
              }
            } catch (err) {
              console.error('🔴 Error creating profile:', err);
              setDbError(true);
              setErrorType('other');
            }
          } else if (profileError.message && (profileError.message.includes('column') || profileError.message.includes('relation'))) {
            console.error('🔴 Database schema error:', profileError.message);
            setDbError(true);
            setErrorType('schema');
            setSkipDatabaseOperations(true);
          } else {
            console.error('🔴 Error checking profile:', profileError.message);
            setDbError(true);
            setErrorType('connection');
          }
        } else {
          // Profile exists, update it
          const { error } = await supabase
            .from('profiles')
            .update({ has_completed_onboarding: true })
            .eq('user_id', user.id);

          if (error) {
            // Check if this is a schema error
            if (error.message && error.message.includes('column') && error.message.includes('does not exist')) {
              console.error('🔴 Database schema error - missing column:', error.message);
              setDbError(true);
              setErrorType('schema');
              setSkipDatabaseOperations(true);
            } else {
              console.error('🔴 Error completing onboarding in database:', error.message);
              setDbError(true);
              setErrorType('connection');
            }
          } else {
            console.log('✅ Successfully updated onboarding status in profile');
          }
        }
      } catch (dbError) {
        console.error('🔴 Database connection error during completion:', dbError);
        setDbError(true);
        setErrorType('connection');
      }
      
      // Update local state regardless of database success
      setHasCompletedOnboarding(true);
    } catch (error) {
      console.error('🔴 Unexpected error in completeOnboarding:', error);
      // Still try to update local state
      setHasCompletedOnboarding(true);
    } finally {
      setLoading(false);
    }
  };

  // Retry database connection if there was an error - but only for connection errors, not schema errors
  useEffect(() => {
    if (dbError && errorType !== 'schema' && retryCount < 2 && user) {
      console.log(`🔄 Retrying database connection (attempt ${retryCount + 1}/2)...`);
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        checkOnboardingStatus();
      }, 2000 * (retryCount + 1)); // Exponential backoff
      
      return () => clearTimeout(timer);
    }
  }, [dbError, errorType, retryCount, user]);

  // Check onboarding status when user changes
  useEffect(() => {
    console.log('🔍 OnboardingProvider user effect triggered:', user?.id);
    setRetryCount(0); // Reset retry count
    checkOnboardingStatus();
  }, [user]);

  // Log state changes for debugging
  useEffect(() => {
    console.log('🔍 OnboardingContext state:', { 
      hasCompletedOnboarding, 
      loading, 
      dbError,
      errorType,
      skipDatabaseOperations,
      retryCount 
    });
  }, [hasCompletedOnboarding, loading, dbError, errorType, skipDatabaseOperations, retryCount]);

  return (
    <OnboardingContext.Provider
      value={{
        hasCompletedOnboarding,
        loading,
        completeOnboarding,
        setHasCompletedOnboarding,
        dbError,
        errorType,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

// Custom hook to use the onboarding context
export const useOnboarding = () => useContext(OnboardingContext); 