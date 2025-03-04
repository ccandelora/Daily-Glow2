import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router, usePathname, Redirect } from 'expo-router';
import { isDevelopment, cleanDevelopmentPath, isDevelopmentUrl, logDevInfo } from '@/utils/developmentUtils';

/**
 * Catch-all handler for any unmatched routes
 * This is a fallback for any route that isn't explicitly defined
 */
export default function UnmatchedRouteHandler() {
  const pathname = usePathname();
  const params = useLocalSearchParams();
  const unmatched = params.unmatched as string[] || [];
  
  // Log for debugging
  useEffect(() => {
    if (isDevelopment) {
      logDevInfo('Unmatched route handler triggered', {
        pathname,
        unmatched,
        params: JSON.stringify(params)
      });
    }
  }, [pathname, params, unmatched]);
  
  // Handle development URLs with exp:// or -- pattern
  if (isDevelopment && isDevelopmentUrl(pathname)) {
    logDevInfo('Development URL detected in unmatched handler', pathname);
    
    // Special case for /--/app pattern
    if (pathname.includes('/--/app') || pathname.endsWith('--/app')) {
      logDevInfo('Redirecting to /app from unmatched handler');
      return <Redirect href="/app" />;
    }
    
    // Special case for /--/onboarding or /--/welcome
    if (pathname.includes('/--/onboarding') || pathname.includes('/--/welcome')) {
      logDevInfo('Redirecting to /onboarding/welcome from unmatched handler');
      return <Redirect href="/onboarding/welcome" />;
    }
    
    // Try to clean the path and redirect
    const cleanedPath = cleanDevelopmentPath(pathname);
    if (cleanedPath && cleanedPath !== pathname) {
      logDevInfo('Redirecting to cleaned path', cleanedPath);
      return <Redirect href={`/${cleanedPath}`} />;
    }
  }
  
  // For non-development URLs or if no special handling applied
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