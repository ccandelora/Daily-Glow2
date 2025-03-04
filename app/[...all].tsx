import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Redirect, router, usePathname, useLocalSearchParams } from 'expo-router';

/**
 * Universal catch-all handler that can handle any URL pattern
 * This is our final fallback for ALL routes that aren't matched
 */
export default function UniversalCatchAll() {
  const pathname = usePathname();
  const params = useLocalSearchParams();
  
  console.log('🔍 DEBUG: Universal catch-all handler triggered for path:', pathname);
  console.log('🔍 DEBUG: Universal catch-all params:', JSON.stringify(params));
  
  // Extract the clean path from development URLs
  let targetPath = pathname || '';
  
  // Handle expo development URLs with double dash (--) prefix
  if (targetPath.includes('/--/app')) {
    console.log('🔍 DEBUG: Detected development URL with /--/app pattern');
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Redirecting to app...</Text>
        <Redirect href="/app" />
      </View>
    );
  }
  
  // Handle any other development patterns
  if (targetPath.includes('/--/')) {
    // Extract the part after /--/
    const cleanPath = targetPath.split('/--/')[1];
    console.log('🔍 DEBUG: Extracted clean path from development URL:', cleanPath);
    
    if (cleanPath) {
      return (
        <View style={styles.container}>
          <Text style={styles.text}>Redirecting...</Text>
          <Redirect href={`/${cleanPath}`} />
        </View>
      );
    }
  }
  
  // Default fallback for truly unmatched routes
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Page Not Found</Text>
      <Text style={styles.subtitle}>The page you requested could not be found.</Text>
      <Text style={styles.path}>{pathname}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  text: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#ccc',
    marginBottom: 20,
    textAlign: 'center',
  },
  path: {
    fontSize: 16,
    color: '#aaa',
    marginTop: 10,
    padding: 10,
    backgroundColor: '#222',
    borderRadius: 5,
  },
}); 