import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

/**
 * Main app index using traditional folder structure
 * No parentheses-based route groups
 */
export default function AppHomeScreen() {
  console.log('🔍 DEBUG: Traditional app home screen loaded');
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Daily Glow</Text>
      <Text style={styles.subtitle}>Main app screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1c0e2e',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#cccccc',
    marginBottom: 40,
  },
}); 