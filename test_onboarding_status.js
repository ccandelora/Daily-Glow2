// Test script to check onboarding status
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client (replace with your project URL and anon key)
const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOnboardingStatus() {
  try {
    // First check if the profiles table exists
    console.log('Checking if profiles table exists...');
    const { error: tableCheckError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
      .single();
    
    if (tableCheckError) {
      if (tableCheckError.message.includes('relation "profiles" does not exist')) {
        console.error('Profiles table does not exist!');
        return;
      }
      throw tableCheckError;
    }
    
    console.log('Profiles table exists, checking for has_completed_onboarding column...');
    
    // Check if the column exists by trying to select it
    const { data: columnData, error: columnError } = await supabase
      .rpc('check_column_exists', { 
        table_name: 'profiles', 
        column_name: 'has_completed_onboarding' 
      });
    
    if (columnError) {
      console.error('Error checking column:', columnError.message);
      
      // Alternative method if RPC is not available
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);
      
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError.message);
        return;
      }
      
      if (profiles && profiles.length > 0) {
        const hasColumn = 'has_completed_onboarding' in profiles[0];
        console.log(`Column check (alternative method): has_completed_onboarding exists: ${hasColumn}`);
      }
      
      return;
    }
    
    console.log(`Column check: has_completed_onboarding exists: ${columnData}`);
    
    // Fetch some sample profiles to check the values
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, user_id, display_name, has_completed_onboarding')
      .limit(5);
    
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError.message);
      return;
    }
    
    console.log('Sample profiles:');
    console.table(profiles);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the check
checkOnboardingStatus(); 