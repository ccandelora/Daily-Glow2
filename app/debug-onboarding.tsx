import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import theme from '@/constants/theme';

export default function DebugOnboarding() {
  const { hasCompletedOnboarding, loading, completeOnboarding, setHasCompletedOnboarding } = useOnboarding();
  const { session, user } = useAuth();
  const router = useRouter();
  const [asyncStorageValue, setAsyncStorageValue] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});

  // Check AsyncStorage on mount
  useEffect(() => {
    checkAsyncStorage();
    gatherDebugInfo();
  }, []);

  const checkAsyncStorage = async () => {
    try {
      const value = await AsyncStorage.getItem('hasCompletedOnboarding');
      setAsyncStorageValue(value);
    } catch (error) {
      console.error('Error reading AsyncStorage:', error);
    }
  };

  const gatherDebugInfo = async () => {
    const info: Record<string, any> = {
      hasUser: !!user,
      userId: user?.id,
      hasSession: !!session,
      onboardingContext: {
        hasCompletedOnboarding,
        loading,
      },
    };
    
    // Get all AsyncStorage keys
    try {
      const keys = await AsyncStorage.getAllKeys();
      const items = await AsyncStorage.multiGet(keys);
      info.asyncStorage = Object.fromEntries(items);
    } catch (error) {
      info.asyncStorageError = String(error);
    }
    
    setDebugInfo(info);
  };

  const resetOnboarding = async () => {
    try {
      await AsyncStorage.removeItem('hasCompletedOnboarding');
      await AsyncStorage.removeItem('userName');
      await AsyncStorage.removeItem('userGoals');
      await AsyncStorage.removeItem('notificationPreferences');
      setHasCompletedOnboarding(false);
      await checkAsyncStorage();
      await gatherDebugInfo();
    } catch (error) {
      console.error('Error resetting onboarding:', error);
    }
  };

  const completeOnboardingManually = async () => {
    try {
      await completeOnboarding();
      await checkAsyncStorage();
      await gatherDebugInfo();
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <Text style={styles.title}>Onboarding Debug</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>OnboardingContext State:</Text>
          <Text style={styles.status}>
            Has Completed Onboarding: {String(hasCompletedOnboarding)}
          </Text>
          <Text style={styles.status}>Loading: {String(loading)}</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AsyncStorage Value:</Text>
          <Text style={styles.status}>
            hasCompletedOnboarding: {asyncStorageValue === null ? 'null' : asyncStorageValue}
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Auth State:</Text>
          <Text style={styles.status}>User ID: {user?.id || 'No user'}</Text>
          <Text style={styles.status}>Has Session: {String(!!session)}</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Debug Info:</Text>
          <Text style={styles.status}>{JSON.stringify(debugInfo, null, 2)}</Text>
        </View>
      </ScrollView>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={resetOnboarding}>
          <Text style={styles.buttonText}>Reset Onboarding</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={completeOnboardingManually}>
          <Text style={styles.buttonText}>Complete Onboarding</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]} 
          onPress={() => router.push('/(onboarding)/welcome')}
        >
          <Text style={styles.secondaryButtonText}>Go to Welcome Screen</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]} 
          onPress={() => router.push('/')}
        >
          <Text style={styles.secondaryButtonText}>Go to Root</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  status: {
    fontSize: 14,
    marginBottom: 5,
  },
  buttonContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  button: {
    backgroundColor: theme.COLORS.primary.green,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  secondaryButtonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 16,
  },
}); 