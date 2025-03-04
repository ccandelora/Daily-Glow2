import { Redirect, useLocalSearchParams, usePathname } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { testDeepLinking, simulateDeepLink } from '@/utils/debugUtils';
import { getCorrectRoutePath } from '@/utils/urlUtils';
import { isDevelopment } from '@/utils/developmentUtils';
import { cleanExpoDevUrl, RouteHandler } from '@/utils/routeUtils';

// Set this to false to disable the debug UI
const FORCE_DEBUG_MODE = false;

console.log('🔍 DEBUG: Root index.tsx loaded, checking navigation conditions');
console.log('🔍 DEBUG: CRITICAL FIX - Root index.tsx module loaded');

/**
 * Root index redirects to the appropriate route based on authentication state
 * and any query parameters
 */
export default function Root() {
  const router = useRouter();
  const { session } = useAuth();
  const { hasCompletedOnboarding } = useOnboarding();
  const params = useLocalSearchParams();
  const pathname = usePathname();
  const [showDebug, setShowDebug] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  
  console.log('🔍 DEBUG: Root index loaded with params:', params);
  console.log('🔍 DEBUG: Current pathname:', pathname);
  
  // Handle development URL patterns first
  if (isDevelopment && pathname && pathname.includes('--')) {
    const cleanPath = cleanExpoDevUrl(pathname);
    console.log('🔍 DEBUG: Detected development URL pattern, cleaning:', pathname, '→', cleanPath);
    if (cleanPath && cleanPath !== pathname) {
      return <Redirect href={cleanPath} />;
    }
  }
  
  // Handle redirects based on search params
  if (params.redirect) {
    const redirect = String(params.redirect);
    console.log('🔍 DEBUG: Redirect parameter found:', redirect);
    
    // Clean the redirect path if it contains development URL patterns
    let redirectPath = redirect;
    if (redirect.includes('--')) {
      redirectPath = cleanExpoDevUrl(redirect);
      console.log('🔍 DEBUG: Cleaned redirect parameter:', redirectPath);
    }
    
    // Handle specific redirects
    if (redirectPath === 'welcome' || redirectPath.includes('welcome')) {
      return <Redirect href="/onboarding/welcome" />;
    }
    
    // Handle other redirects - ensure they start with a slash
    const path = redirectPath.startsWith('/') ? redirectPath : `/${redirectPath}`;
    return <Redirect href={path} />;
  }
  
  // Default redirect based on authentication state
  if (session) {
    return <Redirect href="/app" />;
  }
  
  return <Redirect href="/auth/sign-in" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1c0e2d',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  debugButton: {
    backgroundColor: '#5e35b1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 20,
    minWidth: 200,
    alignItems: 'center',
  },
  debugButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  logContainer: {
    flex: 1,
    width: '100%',
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
}); 