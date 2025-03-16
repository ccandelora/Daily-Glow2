import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { Stack } from 'expo-router';

export default function TestScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Test Screen' }} />
      <Text style={styles.title}>Test Screen</Text>
      <Text style={styles.description}>
        This is a simple test screen to verify if the app can load without crashing.
      </Text>
      <View style={styles.buttonContainer}>
        <Button 
          title="Press Me" 
          onPress={() => alert('Button pressed!')} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 200,
  },
}); 