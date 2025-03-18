/**
 * Debug utilities to help diagnose app startup issues
 */

/**
 * Logs environment variables and other critical configurations
 * to help diagnose startup issues
 */
export function logAppStartupInfo(): void {
  try {
    // Log environment variable status (without exposing actual values)
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log('=== APP STARTUP DEBUG INFO ===');
    console.log(`Supabase URL defined: ${!!supabaseUrl}`);
    console.log(`Supabase Key defined: ${!!supabaseKey}`);
    console.log(`Supabase URL length: ${supabaseUrl?.length || 0}`);
    console.log(`Supabase Key starts with: ${supabaseKey?.substring(0, 10)}...`);
    
    // Log platform info
    console.log(`Platform: ${Platform.OS}`);
    console.log(`OS Version: ${Platform.Version}`);
    console.log(`Is Dev: ${__DEV__ ? 'Yes' : 'No'}`);
    
    // Log memory info - only available in some environments
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      // @ts-ignore - memory exists in some JS environments but not in the standard type
      console.log(`Memory available: ${performance.memory?.jsHeapSizeLimit || 'Unknown'}`);
    } else {
      console.log('Memory info not available in this environment');
    }
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in startup diagnostics:', errorMessage);
  }
}

import { Platform } from 'react-native'; 