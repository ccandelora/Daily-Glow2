import { supabase } from '@/lib/supabase';

/**
 * Extracts token from a Supabase verification URL
 * @param url The full verification URL from Supabase
 * @returns The extracted token or null if not found
 */
export const extractTokenFromUrl = (url: string): string | null => {
  try {
    // Parse the URL to extract the token parameter
    const urlObj = new URL(url);
    return urlObj.searchParams.get('token');
  } catch (error) {
    console.error('Error extracting token from URL:', error);
    return null;
  }
};

/**
 * Verifies an email using the token directly
 * @param token The verification token from the URL
 * @returns A promise that resolves to a boolean indicating success
 */
export const verifyEmailWithToken = async (token: string): Promise<boolean> => {
  try {
    console.log('[authUtils] Verifying email with token:', token);
    
    // First, try to directly verify the token with Supabase
    try {
      console.log('[authUtils] Attempting to verify token directly with Supabase...');
      
      // For signup verification, we need to use exchangeCodeForSession
      console.log('[authUtils] Attempting exchangeCodeForSession...');
      const { data, error } = await supabase.auth.exchangeCodeForSession(token);
      
      if (!error && data.session) {
        console.log('[authUtils] Email verification successful with exchangeCodeForSession');
        console.log('[authUtils] Session user:', data.session.user.email);
        
        // Set the session in Supabase
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        
        return true;
      } else if (error) {
        console.log('[authUtils] exchangeCodeForSession failed:', error.message);
      }
    } catch (exchangeError) {
      console.log('[authUtils] exchangeCodeForSession error:', exchangeError);
    }
    
    // If that fails, try verifyOtp
    try {
      console.log('[authUtils] Attempting verifyOtp...');
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'email',
      });
      
      if (!verifyError && verifyData.session) {
        console.log('[authUtils] Email verification successful with verifyOtp');
        console.log('[authUtils] Session user:', verifyData.session.user.email);
        return true;
      } else if (verifyError) {
        console.log('[authUtils] verifyOtp failed:', verifyError.message);
      }
    } catch (verifyError) {
      console.log('[authUtils] verifyOtp error:', verifyError);
    }
    
    // If both methods fail, try to get the current session and check if it's verified
    try {
      console.log('[authUtils] Checking current session...');
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (sessionData.session) {
        const user = sessionData.session.user;
        const isVerified = user.email_confirmed_at !== null;
        
        console.log('[authUtils] Current session user:', user.email);
        console.log('[authUtils] Email verified:', isVerified);
        
        if (isVerified) {
          console.log('[authUtils] Email is already verified');
          return true;
        }
      } else {
        console.log('[authUtils] No current session found');
      }
    } catch (sessionError) {
      console.log('[authUtils] Error checking session:', sessionError);
    }
    
    // As a last resort, try to manually verify the email by signing in
    try {
      console.log('[authUtils] Attempting to refresh the session...');
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (!refreshError && refreshData.session) {
        const user = refreshData.session.user;
        const isVerified = user.email_confirmed_at !== null;
        
        console.log('[authUtils] Refreshed session user:', user.email);
        console.log('[authUtils] Email verified after refresh:', isVerified);
        
        if (isVerified) {
          console.log('[authUtils] Email is verified after refresh');
          return true;
        }
      } else if (refreshError) {
        console.log('[authUtils] Session refresh failed:', refreshError.message);
      }
    } catch (refreshError) {
      console.log('[authUtils] Error refreshing session:', refreshError);
    }
    
    console.log('[authUtils] All verification methods failed');
    return false;
  } catch (error) {
    console.error('[authUtils] Error in verifyEmailWithToken:', error);
    return false;
  }
}; 