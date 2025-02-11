import React, { createContext, useContext, useState } from 'react';
import { Alert } from 'react-native';

interface AppStateContextType {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  showError: (message: string) => void;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);

  const setLoading = (loading: boolean) => {
    setIsLoading(loading);
  };

  const showError = (message: string) => {
    Alert.alert('Error', message);
  };

  const value = {
    isLoading,
    setLoading,
    showError,
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
} 