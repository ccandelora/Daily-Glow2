import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AuthTestScreen() {
  const router = useRouter();
  const { session, user, signIn, signOut, refreshSession } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  
  useEffect(() => {
    // Check auth state on mount
    addDebugLog('Auth Test Screen Mounted');
    checkAuthState();
  }, []);
  
  const addDebugLog = (message: string) => {
    console.log(message);
    setDebugLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };
  
  const checkAuthState = async () => {
    addDebugLog(`Current auth state: ${session ? 'Logged in' : 'Logged out'}`);
    if (user) {
      addDebugLog(`User ID: ${user.id}`);
      addDebugLog(`Email: ${user.email}`);
      
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          addDebugLog(`Error getting session: ${error.message}`);
        } else {
          setSessionInfo(data.session);
          addDebugLog(`Session expires at: ${new Date(data.session?.expires_at! * 1000).toLocaleString()}`);
        }
      } catch (error) {
        addDebugLog(`Error checking session: ${error}`);
      }
    }
  };
  
  const handleSignIn = async () => {
    if (!email || !password) {
      addDebugLog('Email and password are required');
      return;
    }
    
    addDebugLog(`Attempting to sign in with email: ${email}`);
    try {
      await signIn(email, password);
      addDebugLog('Sign in successful');
      checkAuthState();
    } catch (error) {
      addDebugLog(`Sign in failed: ${error}`);
    }
  };
  
  const handleSignOut = async () => {
    addDebugLog('Attempting to sign out');
    try {
      await signOut();
      addDebugLog('Sign out successful');
      setSessionInfo(null);
      checkAuthState();
    } catch (error) {
      addDebugLog(`Sign out failed: ${error}`);
    }
  };
  
  const handleRefreshSession = async () => {
    addDebugLog('Refreshing session');
    try {
      const result = await refreshSession();
      addDebugLog(`Session refreshed. Email verified: ${result.isVerified}`);
      checkAuthState();
    } catch (error) {
      addDebugLog(`Session refresh failed: ${error}`);
    }
  };
  
  const handleClearStorage = async () => {
    addDebugLog('Clearing AsyncStorage');
    try {
      const keys = await AsyncStorage.getAllKeys();
      addDebugLog(`Found ${keys.length} keys in AsyncStorage`);
      
      // Only clear auth-related keys
      const authKeys = keys.filter(key => 
        key.includes('supabase') || 
        key.includes('auth') || 
        key.includes('session')
      );
      
      if (authKeys.length > 0) {
        await AsyncStorage.multiRemove(authKeys);
        addDebugLog(`Removed ${authKeys.length} auth-related keys`);
      } else {
        addDebugLog('No auth-related keys found');
      }
      
      checkAuthState();
    } catch (error) {
      addDebugLog(`Error clearing storage: ${error}`);
    }
  };
  
  const handleGoBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Authentication Testing</Text>
      
      <View style={styles.authStatus}>
        <Text style={styles.statusText}>
          Status: {session ? 'Authenticated' : 'Not Authenticated'}
        </Text>
      </View>
      
      <View style={styles.formContainer}>
        {!session ? (
          <>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor="#999"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor="#999"
              secureTextEntry
            />
            <TouchableOpacity 
              style={styles.authButton} 
              onPress={handleSignIn}
            >
              <Text style={styles.buttonText}>Sign In</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity 
              style={styles.authButton} 
              onPress={handleRefreshSession}
            >
              <Text style={styles.buttonText}>Refresh Session</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.authButton, styles.dangerButton]} 
              onPress={handleSignOut}
            >
              <Text style={styles.buttonText}>Sign Out</Text>
            </TouchableOpacity>
          </>
        )}
        
        <TouchableOpacity 
          style={[styles.authButton, styles.warningButton]} 
          onPress={handleClearStorage}
        >
          <Text style={styles.buttonText}>Clear Auth Storage</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.logContainer}>
        <Text style={styles.logTitle}>Debug Logs:</Text>
        {debugLogs.map((log, index) => (
          <Text key={index} style={styles.logText}>{log}</Text>
        ))}
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
  authStatus: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  statusText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  formContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 10,
    color: '#fff',
    marginBottom: 10,
  },
  authButton: {
    backgroundColor: '#5e35b1',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  dangerButton: {
    backgroundColor: '#f44336',
  },
  warningButton: {
    backgroundColor: '#ff9800',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  logContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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