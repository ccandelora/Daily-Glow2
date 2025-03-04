import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link, usePathname, Redirect } from 'expo-router';

/**
 * Custom not-found handler for Expo Router
 * This will be used for all unmatched routes
 */
export default function NotFoundScreen() {
  const pathname = usePathname();
  
  console.log('🚨 NOT FOUND HANDLER: Triggered for path:', pathname);
  
  // Handle development URLs with exp:// pattern
  if (__DEV__ && pathname) {
    console.log('🚨 NOT FOUND HANDLER: Development URL detected:', pathname);
    
    // Handle the specific problematic URL pattern
    if (pathname.includes('/--/app')) {
      console.log('🚨 NOT FOUND HANDLER: Redirecting /--/app to /app');
      return <Redirect href="/app" />;
    }
    
    // Handle other development URL patterns
    if (pathname.includes('/--/')) {
      // Extract the part after /--/
      const cleanPath = pathname.split('/--/')[1];
      console.log('🚨 NOT FOUND HANDLER: Extracted path:', cleanPath);
      
      if (cleanPath) {
        console.log('🚨 NOT FOUND HANDLER: Redirecting to:', cleanPath);
        return <Redirect href={`/${cleanPath}`} />;
      }
    }
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Page Not Found</Text>
      <Text style={styles.subtitle}>The requested page could not be found.</Text>
      <Text style={styles.path}>{pathname}</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button}>
          <Link href="/app" style={styles.buttonText}>Go to Home</Link>
        </TouchableOpacity>
      </View>
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
  buttonContainer: {
    marginTop: 20,
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