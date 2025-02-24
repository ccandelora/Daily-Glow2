import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  currentStep: number;
  totalSteps: number;
  hasCompletedOnboarding: boolean;
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
  const totalSteps = 4;

  // Load saved state on mount
  useEffect(() => {
    loadState();
  }, []);

  const loadState = async () => {
    try {
      const savedState = await AsyncStorage.getItem(ONBOARDING_STATE_KEY);
      if (savedState) {
        setState(JSON.parse(savedState));
      }
    } catch (error) {
      console.error('Error loading onboarding state:', error);
    }
  };

  const saveState = async (newState: OnboardingState) => {
    try {
      await AsyncStorage.setItem(ONBOARDING_STATE_KEY, JSON.stringify(newState));
      setState(newState);
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
    await saveState({ ...state, isComplete: true });
  };

  // Calculate current step based on state
  const getCurrentStep = (): number => {
    if (!state.purpose) return 1;
    if (!state.notifications && !state.reminderTime) return 2;
    if (!state.firstMood) return 3;
    if (!state.isComplete) return 4;
    return 4;
  };

  const value = {
    state,
    setPurpose,
    setNotificationPreferences,
    setFirstCheckIn,
    completeOnboarding,
    currentStep: getCurrentStep(),
    totalSteps,
    hasCompletedOnboarding: state.isComplete,
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