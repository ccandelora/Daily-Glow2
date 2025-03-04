import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform, AppState } from 'react-native';
import * as Linking from 'expo-linking';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    try {
      const value = await SecureStore.getItemAsync(key);
      if (!value) return null;

      // If this is a session item, parse it and reconstruct the full session object
      if (key.includes('supabase.auth.token')) {
        const minimalSession = JSON.parse(value);
        return JSON.stringify({
          ...minimalSession,
          user: {
            ...minimalSession.user,
            app_metadata: {},
            user_metadata: {},
            identities: [],
            factors: [],
          },
        });
      }
      return value;
    } catch (error) {
      console.warn('Error reading from SecureStore:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      // Only store essential session data
      if (key.includes('supabase.auth.token')) {
        const data = JSON.parse(value);
        // Store only the minimum required session data
        const minimalSession = {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: data.expires_at,
          expires_in: data.expires_in,
          token_type: data.token_type,
          user: {
            id: data.user.id,
            email: data.user.email,
            role: data.user.role,
          },
        };
        await SecureStore.setItemAsync(key, JSON.stringify(minimalSession));
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.warn('Error writing to SecureStore:', error);
    }
  },
  removeItem: (key: string) => {
    return SecureStore.deleteItemAsync(key);
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Get the URL scheme from Expo
let scheme = 'daily-glow://';
try {
  // Try to get the scheme from Expo Constants
  const expoScheme = Constants.expoConfig?.scheme;
  if (expoScheme) {
    scheme = `${expoScheme}://`;
    console.log('Using Expo scheme:', scheme);
  }
} catch (error) {
  console.log('Error getting scheme from Constants, using default:', error);
}

// Create a redirect URL that works for both platforms
const getRedirectUrl = () => {
  // For development (Expo Go or development build)
  if (__DEV__) {
    try {
      // First try to use Linking.createURL if available
      if (Linking && typeof Linking.createURL === 'function') {
        // Use auth/callback instead of confirm-email for consistency
        const redirectUrl = Linking.createURL('auth/callback');
        console.log('DEV Redirect URL (Linking.createURL):', redirectUrl);
        return redirectUrl;
      }
    } catch (error) {
      console.log('Error using Linking.createURL:', error);
    }
    
    // Fallback to manual construction
    const redirectUrl = `${scheme}auth/callback`;
    console.log('DEV Redirect URL (manual fallback):', redirectUrl);
    return redirectUrl;
  }
  
  // For production builds
  const prodUrl = Platform.OS === 'web'
    ? window.location.origin + '/auth/callback'
    : `${scheme}auth/callback`;
  
  console.log('PROD Redirect URL:', prodUrl);
  return prodUrl;
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === 'web' ? localStorage : ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
    flowType: 'pkce',
  },
});

// Set up auth state change listener
supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
  console.log(`Supabase auth event: ${event}`, session ? 'User session available' : 'No user session');
});

// Export the redirect URL for use in other parts of the app
export const redirectUrl = getRedirectUrl();

// Tells Supabase Auth to continuously refresh the session automatically
// if the app is in the foreground. When this is added, you will continue
// to receive `onAuthStateChange` events with the `TOKEN_REFRESHED` or
// `SIGNED_OUT` event if the user's session is terminated.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
}); 