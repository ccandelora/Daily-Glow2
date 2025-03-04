import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

interface DebugOption {
  title: string;
  description: string;
  route: string;
  color?: string;
}

export default function DebugMenuScreen() {
  const router = useRouter();
  
  const debugOptions: DebugOption[] = [
    {
      title: 'Deep Link Testing',
      description: 'Test deep linking functionality and URL handling',
      route: '/debug/deep-link-test',
      color: '#5e35b1',
    },
    {
      title: 'Authentication',
      description: 'Test authentication flows and session management',
      route: '/debug/auth-test',
      color: '#2196f3',
    },
    {
      title: 'App Info',
      description: 'View app configuration and environment details',
      route: '/debug/app-info',
      color: '#4caf50',
    },
    {
      title: 'Clear Cache',
      description: 'Clear app cache and stored data',
      route: '/debug/clear-cache',
      color: '#f44336',
    },
  ];
  
  const handleOptionPress = (route: string) => {
    router.push(route);
  };
  
  const handleGoBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.title}>Debug Menu</Text>
      <Text style={styles.subtitle}>Development Tools</Text>
      
      <ScrollView style={styles.optionsContainer}>
        {debugOptions.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.optionCard, { backgroundColor: option.color || '#333' }]}
            onPress={() => handleOptionPress(option.route)}
          >
            <Text style={styles.optionTitle}>{option.title}</Text>
            <Text style={styles.optionDescription}>{option.description}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <TouchableOpacity 
        style={styles.backButton}
        onPress={handleGoBack}
      >
        <Text style={styles.backButtonText}>Return to App</Text>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 40,
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 20,
    textAlign: 'center',
  },
  optionsContainer: {
    flex: 1,
  },
  optionCard: {
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
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
  backButton: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
}); 