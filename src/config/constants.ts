// Constants file with fallback values for environment variables
// This ensures the app will work even if environment variables are not set

export const SUPABASE_CONFIG = {
  // Use environment variables if available, otherwise use these fallback values
  URL: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://nlotqcqoedhpqkynfouh.supabase.co',
  ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sb3RxY3FvZWRocHFreW5mb3VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg4Nzk3MzEsImV4cCI6MjA1NDQ1NTczMX0.irRGxLS8KFG-F5zv-dEHPwp5xRpwZVLG7uT7r02P4OU',
};

// Add other configuration constants as needed
export const API_KEYS = {
  GEMINI: process.env.EXPO_PUBLIC_GEMINI_API_KEY || 'YOUR_API_KEY_PLACEHOLDER',
}; 