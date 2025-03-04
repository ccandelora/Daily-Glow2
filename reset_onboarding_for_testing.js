// Script to reset onboarding status for testing
const { createClient } = require('@supabase/supabase-js');
const AsyncStorage = require('@react-native-async-storage/async-storage').default;

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.SUPABASE_KEY || 'YOUR_SUPABASE_SERVICE_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

// Specify user ID to reset (leave empty to reset all users)
const USER_ID_TO_RESET = ''; // e.g., '123e4567-e89b-12d3-a456-426614174000'

async function resetOnboardingStatus() {
  try {
    console.log('Resetting onboarding status...');
    
    // Reset in database
    if (USER_ID_TO_RESET) {
      console.log(`Resetting onboarding status for user: ${USER_ID_TO_RESET}`);
      const { error } = await supabase.rpc('reset_user_onboarding', { user_id_param: USER_ID_TO_RESET });
        
      if (error) {
        console.error('Error resetting onboarding status:', error);
        return;
      }
    } else {
      console.log('Resetting onboarding status for ALL users');
      const { error } = await supabase.rpc('reset_all_onboarding');
        
      if (error) {
        console.error('Error resetting onboarding status for all users:', error);
        return;
      }
    }
    
    console.log('Database onboarding status reset successfully');
    
    // Check the results
    const query = supabase
      .from('profiles')
      .select('id, user_id, display_name, has_completed_onboarding')
      .order('updated_at', { ascending: false });
      
    if (USER_ID_TO_RESET) {
      query.eq('user_id', USER_ID_TO_RESET);
    } else {
      query.limit(10);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching profiles:', error);
      return;
    }
    
    console.log('Updated profiles:');
    data.forEach(profile => {
      console.log(`- ${profile.display_name || profile.user_id}: onboarding=${profile.has_completed_onboarding}`);
    });
    
    console.log('\nDone!');
    console.log('\nIMPORTANT: You will need to clear AsyncStorage on your device as well.');
    console.log('To do this, you can:');
    console.log('1. Uninstall and reinstall the app, or');
    console.log('2. Add code to clear AsyncStorage on app start for testing');
    console.log('3. Use the Debug Tools in the app (tap on version number in Settings)');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

resetOnboardingStatus(); 