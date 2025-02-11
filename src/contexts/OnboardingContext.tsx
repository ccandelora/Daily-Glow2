import React, { createContext, useContext, useState } from 'react';

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
  completeOnboarding: () => void;
  currentStep: number;
  totalSteps: number;
}

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

  const setPurpose = (purpose: string) => {
    setState(prev => ({ ...prev, purpose }));
  };

  const setNotificationPreferences = (enabled: boolean, time?: string) => {
    setState(prev => ({
      ...prev,
      notifications: enabled,
      reminderTime: time || prev.reminderTime,
    }));
  };

  const setFirstCheckIn = (mood: string, gratitude: string) => {
    setState(prev => ({
      ...prev,
      firstMood: mood,
      firstGratitude: gratitude,
    }));
  };

  const completeOnboarding = () => {
    setState(prev => ({ ...prev, isComplete: true }));
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