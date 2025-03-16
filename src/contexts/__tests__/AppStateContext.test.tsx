import React from 'react';
import { render, act, renderHook } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { AppStateProvider, useAppState } from '../AppStateContext';

// Mock Alert.alert
jest.mock('react-native', () => {
  const rn = jest.requireActual('react-native');
  
  return {
    ...rn,
    Alert: {
      ...rn.Alert,
      alert: jest.fn(),
    },
  };
});

// Properly mock Alert.alert
Alert.alert = jest.fn();

describe('AppStateContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('provides loading state and methods', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppStateProvider>{children}</AppStateProvider>
    );
    
    const { result } = renderHook(() => useAppState(), { wrapper });
    
    // Initial state should be not loading
    expect(result.current.isLoading).toBe(false);
    
    // Test setLoading function
    act(() => {
      result.current.setLoading(true);
    });
    
    expect(result.current.isLoading).toBe(true);
    
    act(() => {
      result.current.setLoading(false);
    });
    
    expect(result.current.isLoading).toBe(false);
  });
  
  test('showError displays an alert with error message', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppStateProvider>{children}</AppStateProvider>
    );
    
    const { result } = renderHook(() => useAppState(), { wrapper });
    
    act(() => {
      result.current.showError('Test error message');
    });
    
    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Test error message');
  });
  
  test('showSuccess displays an alert with success message', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppStateProvider>{children}</AppStateProvider>
    );
    
    const { result } = renderHook(() => useAppState(), { wrapper });
    
    act(() => {
      result.current.showSuccess('Test success message');
    });
    
    expect(Alert.alert).toHaveBeenCalledWith('Success', 'Test success message');
  });
  
  test('throws error when useAppState is used outside provider', () => {
    // Suppress console.error for this test as we expect an error
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    expect(() => {
      renderHook(() => useAppState());
    }).toThrow('useAppState must be used within an AppStateProvider');
    
    // Restore console.error
    console.error = originalConsoleError;
  });
}); 