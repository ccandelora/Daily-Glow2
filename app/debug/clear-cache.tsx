import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

interface CacheOption {
  title: string;
  description: string;
  action: () => Promise<void>;
  color?: string;
  dangerous?: boolean;
}

export default function ClearCacheScreen() {
  const router = useRouter();
  const [logs, setLogs] = useState<string[]>([]);
  
  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };
  
  const clearAuthCache = async () => {
    addLog('Clearing auth cache...');
    try {
      const keys = await AsyncStorage.getAllKeys();
      const authKeys = keys.filter(key => 
        key.includes('supabase') || 
        key.includes('auth') || 
        key.includes('session')
      );
      
      if (authKeys.length > 0) {
        await AsyncStorage.multiRemove(authKeys);
        addLog(`Removed ${authKeys.length} auth-related keys`);
      } else {
        addLog('No auth-related keys found');
      }
      
      // Also sign out from Supabase
      await supabase.auth.signOut();
      addLog('Signed out from Supabase');
    } catch (error) {
      addLog(`Error: ${error}`);
    }
  };
  
  const clearOnboardingCache = async () => {
    addLog('Clearing onboarding cache...');
    try {
      const keys = await AsyncStorage.getAllKeys();
      const onboardingKeys = keys.filter(key => 
        key.includes('onboarding') || 
        key.includes('ONBOARDING')
      );
      
      if (onboardingKeys.length > 0) {
        await AsyncStorage.multiRemove(onboardingKeys);
        addLog(`Removed ${onboardingKeys.length} onboarding-related keys`);
      } else {
        addLog('No onboarding-related keys found');
      }
      
      // Reset onboarding flag in database if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { error } = await supabase
          .from('profiles')
          .update({ has_completed_onboarding: false })
          .eq('user_id', session.user.id);
          
        if (error) {
          addLog(`Error updating profile: ${error.message}`);
        } else {
          addLog('Reset onboarding status in database');
        }
      }
    } catch (error) {
      addLog(`Error: ${error}`);
    }
  };
  
  const clearAllCache = async () => {
    addLog('Clearing all app cache...');
    try {
      const keys = await AsyncStorage.getAllKeys();
      
      if (keys.length > 0) {
        await AsyncStorage.multiRemove(keys);
        addLog(`Removed all ${keys.length} keys from AsyncStorage`);
      } else {
        addLog('No keys found in AsyncStorage');
      }
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      addLog('Signed out from Supabase');
    } catch (error) {
      addLog(`Error: ${error}`);
    }
  };
  
  const cacheOptions: CacheOption[] = [
    {
      title: 'Clear Auth Cache',
      description: 'Clear authentication data and sign out',
      action: clearAuthCache,
      color: '#2196f3',
    },
    {
      title: 'Reset Onboarding',
      description: 'Clear onboarding progress and reset to initial state',
      action: clearOnboardingCache,
      color: '#ff9800',
    },
    {
      title: 'Clear All Cache',
      description: 'Clear all app data and reset to initial state (WARNING: This will log you out)',
      action: clearAllCache,
      color: '#f44336',
      dangerous: true,
    },
  ];
  
  const handleClearCache = (option: CacheOption) => {
    if (option.dangerous) {
      Alert.alert(
        'Warning',
        'This will clear all app data and log you out. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Clear All', 
            style: 'destructive',
            onPress: async () => {
              await option.action();
            }
          }
        ]
      );
    } else {
      option.action();
    }
  };
  
  const handleGoBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Clear Cache</Text>
      
      <ScrollView style={styles.optionsContainer}>
        {cacheOptions.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.optionCard, { backgroundColor: option.color || '#333' }]}
            onPress={() => handleClearCache(option)}
          >
            <Text style={styles.optionTitle}>{option.title}</Text>
            <Text style={styles.optionDescription}>{option.description}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <ScrollView style={styles.logContainer}>
        <Text style={styles.logTitle}>Logs:</Text>
        {logs.map((log, index) => (
          <Text key={index} style={styles.logText}>{log}</Text>
        ))}
        {logs.length === 0 && (
          <Text style={styles.emptyLogText}>No actions performed yet.</Text>
        )}
      </ScrollView>
      
      <TouchableOpacity 
        style={styles.backButton}
        onPress={handleGoBack}
      >
        <Text style={styles.backButtonText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#1c0e2d',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
    marginTop: 40,
  },
  optionsContainer: {
    maxHeight: '40%',
    marginBottom: 10,
  },
  optionCard: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  optionDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  logContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    padding: 10,
  },
  logTitle: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  logText: {
    color: '#ddd',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 5,
  },
  emptyLogText: {
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  backButton: {
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
}); 