import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router, usePathname, Redirect } from 'expo-router';
import { cleanExpoDevUrl } from '@/utils/devRouteUtils';

/**
 * Catch-all handler for any unmatched routes
 * This is a fallback for any route that isn't explicitly defined
 */
export default function NotFoundScreen() {
  const pathname = usePathname();
  const params = useLocalSearchParams();
  
  // Handle development URLs with -- pattern
  if (__DEV__ && pathname.includes('--')) {
    console.log('🔍 404 HANDLER: Development URL detected:', pathname);
    
    const cleanedPath = cleanExpoDevUrl(pathname);
    console.log('🔍 404 HANDLER: Cleaned path:', cleanedPath);
    
    if (cleanedPath !== pathname) {
      console.log('🔍 404 HANDLER: Redirecting to:', cleanedPath);
      return <Redirect href={`/${cleanedPath}`} />;
    }
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Unmatched Route</Text>
      <Text style={styles.subtitle}>Page could not be found.</Text>
      <Text style={styles.path}>{pathname}</Text>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={() => router.replace('/app')}
      >
        <Text style={styles.buttonText}>Go to Home</Text>
      </TouchableOpacity>
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
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#8e8e93',
    marginBottom: 20,
  },
  path: {
    fontSize: 16,
    color: '#8e8e93',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#8239e3',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 