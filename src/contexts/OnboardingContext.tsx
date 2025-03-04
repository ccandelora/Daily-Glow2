import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useProfile } from './UserProfileContext';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';

interface OnboardingState {
  purpose: string | null;
  notifications: boolean;
  reminderTime: string;
  firstMood: string | null;
  firstGratitude: string;
  isComplete: boolean;
}

interface OnboardingContextType {
  state: OnboardingState;
  setPurpose: (purpose: string) => void;
  setNotificationPreferences: (enabled: boolean, time?: string) => void;
  setFirstCheckIn: (mood: string, gratitude: string) => void;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  currentStep: number;
  totalSteps: number;
  hasCompletedOnboarding: boolean;
  checkDatabaseOnboardingStatus: (userId: string) => Promise<boolean>;
  navigateToWelcomeScreen: () => void;
}

const ONBOARDING_STATE_KEY = '@onboarding_state';

const initialState: OnboardingState = {
  purpose: null,
  notifications: true,
  reminderTime: '20:00',
  firstMood: null,
  firstGratitude: '',
  isComplete: false,
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<OnboardingState>(initialState);
  const totalSteps = 5;
  const { userProfile, updateProfile } = useProfile();
  const { user } = useAuth();
  const router = useRouter();

  // Load saved state on mount
  useEffect(() => {
    loadState();
  }, [userProfile]);

  const loadState = async () => {
    try {
      console.log('Loading onboarding state');
      console.log('User ID:', user?.id);
      console.log('User profile available:', !!userProfile);
      
      // First check if we have a profile from the database with onboarding status
      if (userProfile) {
        console.log('User profile loaded:', userProfile);
        console.log('Has completed onboarding from DB:', userProfile.has_completed_onboarding);
        
        // If database says onboarding is complete, override local state
        if (userProfile.has_completed_onboarding) {
          console.log('Database indicates onboarding is complete, using that value');
          
          // Check if we have local onboarding details
          const savedState = await AsyncStorage.getItem(ONBOARDING_STATE_KEY);
          if (savedState) {
            // Merge saved state with completion status from DB
            const parsedState = JSON.parse(savedState);
            setState({
              ...parsedState,
              isComplete: true
            });
            console.log('Merged local state with DB completion status');
          } else {
            // If no local state, just mark as complete with defaults
            setState({
              ...initialState,
              isComplete: true
            });
            console.log('No local state found, using defaults with completion status from DB');
          }
          return;
        } else {
          console.log('Database indicates onboarding is NOT complete');
          
          // Double-check by querying the database directly
          if (user) {
            console.log('Double-checking onboarding status in database for user:', user.id);
            const { data, error } = await supabase
              .from('profiles')
              .select('has_completed_onboarding')
              .eq('user_id', user.id)
              .single();
              
            if (error) {
              console.error('Error verifying onboarding status:', error);
            } else {
              console.log('Direct database query for onboarding status:', data.has_completed_onboarding);
              
              // If there's a discrepancy, update our local userProfile reference
              if (data.has_completed_onboarding !== userProfile.has_completed_onboarding) {
                console.log('Discrepancy detected between cached profile and database!');
                console.log('Updating local reference to match database value');
                
                // Force update the profile
                await updateProfile({ has_completed_onboarding: data.has_completed_onboarding });
                
                if (data.has_completed_onboarding) {
                  // If DB says complete but our cache didn't, update state
                  setState(prev => ({ ...prev, isComplete: true }));
                  console.log('Updated local state to match database completion status');
                  return;
                }
              }
            }
          }
        }
      } else {
        console.log('No user profile loaded yet');
      }
      
      // If no database override, use local storage
      const savedState = await AsyncStorage.getItem(ONBOARDING_STATE_KEY);
      if (savedState) {
        console.log('Found saved onboarding state in AsyncStorage:', savedState);
        const parsedState = JSON.parse(savedState);
        setState(parsedState);
        
        // If local storage says complete but DB doesn't, sync to DB
        if (parsedState.isComplete && userProfile && !userProfile.has_completed_onboarding) {
          console.log('Syncing completed onboarding status to database');
          await updateProfile({ has_completed_onboarding: true });
        }
      } else {
        console.log('No saved onboarding state found, using initial state');
      }
    } catch (error) {
      console.error('Error loading onboarding state:', error);
    }
  };

  const saveState = async (newState: OnboardingState) => {
    try {
      await AsyncStorage.setItem(ONBOARDING_STATE_KEY, JSON.stringify(newState));
      setState(newState);
      
      // If onboarding is marked complete, update the database
      if (newState.isComplete && userProfile) {
        console.log('Updating onboarding completion status in database');
        console.log('Current userProfile:', userProfile);
        console.log('Current has_completed_onboarding value:', userProfile.has_completed_onboarding);
        
        const result = await updateProfile({ has_completed_onboarding: true });
        console.log('Database update result:', result);
        
        // Verify the update was successful
        if (user) {
          console.log('Verifying database update for user:', user.id);
          const { data, error } = await supabase
            .from('profiles')
            .select('has_completed_onboarding')
            .eq('user_id', user.id)
            .single();
            
          if (error) {
            console.error('Error verifying update:', error);
          } else {
            console.log('Database value after update:', data.has_completed_onboarding);
            if (!data.has_completed_onboarding) {
              console.warn('Database update verification failed! Retrying update...');
              // Try a direct update as a fallback
              const { error: updateError } = await supabase
                .from('profiles')
                .update({ has_completed_onboarding: true })
                .eq('user_id', user.id);
                
              if (updateError) {
                console.error('Direct update failed:', updateError);
              } else {
                console.log('Direct update succeeded');
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error saving onboarding state:', error);
    }
  };

  const setPurpose = (purpose: string) => {
    saveState({ ...state, purpose });
  };

  const setNotificationPreferences = (enabled: boolean, time?: string) => {
    saveState({
      ...state,
      notifications: enabled,
      reminderTime: time || state.reminderTime,
    });
  };

  const setFirstCheckIn = (mood: string, gratitude: string) => {
    saveState({
      ...state,
      firstMood: mood,
      firstGratitude: gratitude,
    });
  };

  const completeOnboarding = async () => {
    console.log('Completing onboarding and updating database');
    try {
      await saveState({ ...state, isComplete: true });
      console.log('Onboarding completed successfully');
      
      // Double-check that the database was updated
      if (userProfile && user) {
        console.log('Verifying database update for onboarding status');
        const { data, error } = await supabase
          .from('profiles')
          .select('has_completed_onboarding')
          .eq('user_id', user.id)
          .single();
          
        if (error) {
          console.error('Error verifying onboarding status:', error);
        } else {
          console.log('Database onboarding status after update:', data.has_completed_onboarding);
          
          // If the update didn't take, try a direct update
          if (!data.has_completed_onboarding) {
            console.warn('Database update failed! Trying direct update...');
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ has_completed_onboarding: true })
              .eq('user_id', user.id);
              
            if (updateError) {
              console.error('Direct update failed:', updateError);
            } else {
              console.log('Direct update succeeded');
            }
          }
        }
      } else {
        console.warn('No user profile available to verify onboarding status update');
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const resetOnboarding = async () => {
    console.log('Resetting onboarding status');
    try {
      // Reset local state
      await saveState({ ...initialState, isComplete: false });
      
      // Reset in database using our new RPC function
      if (user) {
        console.log('Resetting onboarding status in database for user:', user.id);
        const { error } = await supabase.rpc('reset_user_onboarding', {
          user_id_param: user.id
        });
        
        if (error) {
          console.error('Error resetting onboarding in database:', error);
          
          // Fallback to direct update if RPC fails
          console.log('Falling back to direct update');
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ has_completed_onboarding: false })
            .eq('user_id', user.id);
            
          if (updateError) {
            console.error('Direct update failed:', updateError);
            throw new Error('Failed to reset onboarding status');
          }
        } else {
          console.log('Successfully reset onboarding status in database');
        }
      }
      
      // Clear from AsyncStorage
      await AsyncStorage.removeItem(ONBOARDING_STATE_KEY);
      console.log('Onboarding status reset successfully');
    } catch (error) {
      console.error('Error resetting onboarding:', error);
      throw error;
    }
  };

  // Calculate current step based on state
  const getCurrentStep = (): number => {
    console.log('Determining current onboarding step with state:', {
      purpose: state.purpose,
      notifications: state.notifications,
      reminderTime: state.reminderTime,
      firstMood: state.firstMood,
      isComplete: state.isComplete,
    });
    
    if (!state.purpose) return 1;
    if (!state.firstMood) return 3;
    if (!state.isComplete) return 4;
    return 5;
  };

  // Determine if onboarding is complete based on both local state and database
  const determineOnboardingCompletion = (): boolean => {
    const localComplete = state.isComplete;
    const dbComplete = userProfile ? !!userProfile.has_completed_onboarding : false;
    
    console.log('🔍 DEBUG: CRITICAL FIX - Determining onboarding completion status:', {
      localComplete,
      dbComplete,
      finalDecision: localComplete && dbComplete, // Both must agree onboarding is complete
      userProfileId: userProfile?.id,
      userId: user?.id
    });
    
    // CRITICAL FIX: For new users, always return false to ensure they go through onboarding
    if (user) {
      const createdAt = new Date(user.created_at || '').getTime();
      const lastSignIn = new Date(user.last_sign_in_at || '').getTime();
      const timeDifference = Math.abs(createdAt - lastSignIn);
      const isNewUser = timeDifference < 300000; // Within 5 minutes
      
      if (isNewUser) {
        console.log('🔍 DEBUG: CRITICAL FIX - New user detected, forcing onboarding incomplete status');
        return false;
      }
    }
    
    // Only consider onboarding complete if both local state and database agree
    return localComplete && dbComplete;
  };

  // Add a function to check the database directly
  const checkDatabaseOnboardingStatus = async (userId: string) => {
    if (!userId) return false;
    
    try {
      console.log('🔍 DEBUG: Directly checking onboarding status in database for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('has_completed_onboarding, id')
        .eq('user_id', userId)
        .single();
        
      if (error) {
        console.error('🔍 DEBUG: Error checking onboarding status in database:', error);
        return false;
      }
      
      const dbStatus = data?.has_completed_onboarding || false;
      console.log('🔍 DEBUG: Database onboarding status:', {
        dbStatus,
        profileId: data?.id,
        userId
      });
      
      // If local state doesn't match database, update it
      if (state.isComplete !== dbStatus) {
        console.log('🔍 DEBUG: Local onboarding state differs from database, updating...');
        if (dbStatus) {
          setState(prev => ({
            ...prev,
            isComplete: true
          }));
        } else {
          resetOnboarding();
        }
      }
      
      return dbStatus;
    } catch (error) {
      console.error('🔍 DEBUG: Error in database onboarding check:', error);
      return false;
    }
  };

  // Add this new method to navigate directly to the welcome screen
  const navigateToWelcomeScreen = () => {
    console.log('Navigating to welcome screen...');
    try {
      router.replace('/welcome-direct');
    } catch (error) {
      console.error('Error navigating to welcome screen:', error);
    }
  };

  const value = {
    state,
    setPurpose,
    setNotificationPreferences,
    setFirstCheckIn,
    completeOnboarding,
    resetOnboarding,
    currentStep: getCurrentStep(),
    totalSteps,
    hasCompletedOnboarding: determineOnboardingCompletion(),
    checkDatabaseOnboardingStatus,
    navigateToWelcomeScreen,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
} 