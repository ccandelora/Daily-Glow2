import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { testDeepLinking, simulateDeepLink } from '@/utils/debugUtils';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';

export default function DeepLinkTestScreen() {
  const router = useRouter();
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [customPath, setCustomPath] = useState('/auth/callback?token=test-token-123');
  
  useEffect(() => {
    // Test deep linking on component mount
    addDebugLog('Deep Link Test Screen Mounted');
    addDebugLog(`App Scheme: ${Constants.expoConfig?.scheme || 'daily-glow'}`);
    
    testDeepLinking().then(success => {
      addDebugLog(`Initial deep linking test completed: ${success ? 'SUCCESS' : 'FAILED'}`);
    });
    
    // Set up a listener for incoming links
    const subscription = Linking.addEventListener('url', ({ url }) => {
      addDebugLog(`Received URL event: ${url}`);
    });
    
    return () => {
      subscription.remove();
    };
  }, []);

  const addDebugLog = (message: string) => {
    console.log(message);
    setDebugLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const handleTestDeepLink = () => {
    addDebugLog(`Testing deep link with path: ${customPath}`);
    
    // Simulate a deep link with the custom path
    simulateDeepLink(customPath).then(success => {
      addDebugLog(`Deep link simulation ${success ? 'succeeded' : 'failed'}`);
    });
  };
  
  const handleTestLinkingSetup = () => {
    addDebugLog('Testing Linking setup...');
    testDeepLinking().then(success => {
      addDebugLog(`Linking setup test completed: ${success ? 'SUCCESS' : 'FAILED'}`);
    });
  };
  
  const handleClearLogs = () => {
    setDebugLogs([]);
  };
  
  const handleGoBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Deep Link Testing</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Test Path:</Text>
        <TextInput
          style={styles.input}
          value={customPath}
          onChangeText={setCustomPath}
          placeholder="Enter path to test"
          placeholderTextColor="#999"
        />
      </View>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={styles.debugButton} 
          onPress={handleTestDeepLink}
        >
          <Text style={styles.debugButtonText}>Test Deep Link</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.debugButton} 
          onPress={handleTestLinkingSetup}
        >
          <Text style={styles.debugButtonText}>Test Linking Setup</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={[styles.debugButton, styles.secondaryButton]} 
          onPress={handleClearLogs}
        >
          <Text style={styles.debugButtonText}>Clear Logs</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.debugButton, styles.secondaryButton]} 
          onPress={handleGoBack}
        >
          <Text style={styles.debugButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.logContainer}>
        <Text style={styles.logTitle}>Debug Logs:</Text>
        {debugLogs.map((log, index) => (
          <Text key={index} style={styles.logText}>{log}</Text>
        ))}
        {debugLogs.length === 0 && (
          <Text style={styles.emptyLogText}>No logs yet. Try testing deep linking.</Text>
        )}
      </ScrollView>
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
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    color: '#fff',
    marginBottom: 5,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 10,
    color: '#fff',
    fontFamily: 'monospace',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  debugButton: {
    backgroundColor: '#5e35b1',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#444',
  },
  debugButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  logContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
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
}); 