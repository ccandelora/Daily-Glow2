import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { router, Redirect, usePathname } from 'expo-router';
import { cleanExpoDevUrl } from '@/utils/routeUtils';
import * as Linking from 'expo-linking';

/**
 * This is a special handler specifically for the development URL pattern:
 * exp://10.0.0.38:8081/--/app
 * 
 * It uses multiple strategies to ensure redirection happens:
 * 1. Declarative redirect with Expo Router
 * 2. Programmatic navigation after a delay
 * 3. Direct linking as a fallback
 * 4. Manual button for the user as a last resort
 */
export default function DevAppRedirect() {
  const pathname = usePathname();
  const [redirectAttempts, setRedirectAttempts] = useState(0);
  const [showManualButton, setShowManualButton] = useState(false);
  
  console.log('🔍 DEBUG: Development URL handler triggered for:', pathname);
  
  // Get the clean path using our new utility
  const cleanPath = pathname ? cleanExpoDevUrl(pathname) : '/app';
  console.log('🔍 DEBUG: Cleaned development path:', cleanPath);
  
  // Try multiple redirection methods with increasing delays
  useEffect(() => {
    // Try router.replace first
    const firstTimer = setTimeout(() => {
      console.log('🔍 DEBUG: Attempt 1 - Using router.replace:', cleanPath);
      try {
        router.replace(cleanPath);
        setRedirectAttempts(1);
      } catch (error) {
        console.error('Failed to navigate (attempt 1):', error);
      }
    }, 100);
    
    // Second attempt with router.navigate
    const secondTimer = setTimeout(() => {
      console.log('🔍 DEBUG: Attempt 2 - Using router.navigate:', cleanPath);
      try {
        router.navigate(cleanPath);
        setRedirectAttempts(2);
      } catch (error) {
        console.error('Failed to navigate (attempt 2):', error);
      }
    }, 500);
    
    // Third attempt with direct Linking
    const thirdTimer = setTimeout(() => {
      console.log('🔍 DEBUG: Attempt 3 - Using Linking.openURL');
      try {
        const url = Linking.createURL(cleanPath);
        Linking.openURL(url);
        setRedirectAttempts(3);
      } catch (error) {
        console.error('Failed to navigate (attempt 3):', error);
      }
      
      // Show manual button as last resort
      setShowManualButton(true);
    }, 1000);
    
    return () => {
      clearTimeout(firstTimer);
      clearTimeout(secondTimer);
      clearTimeout(thirdTimer);
    };
  }, [cleanPath]);
  
  // Manual navigation handler for button
  const handleManualNavigation = () => {
    try {
      router.replace('/app');
    } catch (e) {
      console.error('Manual navigation failed:', e);
      // Try one last approach
      const url = Linking.createURL('/app');
      Linking.openURL(url).catch(console.error);
    }
  };
  
  // Provide a UI with the redirect attempts and a manual button
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Redirecting...</Text>
      <Text style={styles.text}>Detected development URL pattern</Text>
      <Text style={styles.path}>{pathname}</Text>
      
      <ActivityIndicator size="large" color="#fff" style={styles.loader} />
      
      <Text style={styles.attempts}>
        Redirect attempts: {redirectAttempts}/3
      </Text>
      
      {showManualButton && (
        <TouchableOpacity style={styles.button} onPress={handleManualNavigation}>
          <Text style={styles.buttonText}>Tap to Navigate Manually</Text>
        </TouchableOpacity>
      )}
      
      {/* Also provide a declarative redirect as a fallback */}
      <Redirect href={cleanPath} />
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 5,
  },
  path: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 20,
  },
  loader: {
    marginVertical: 20,
  },
  attempts: {
    color: '#fff',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#8239e3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 