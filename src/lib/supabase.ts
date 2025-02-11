import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

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

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === 'web' ? localStorage : ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
}); 