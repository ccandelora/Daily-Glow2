// Script to check and fix onboarding status in the database
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.SUPABASE_KEY || 'YOUR_SUPABASE_SERVICE_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Checking profiles table...');
  
  try {
    // Check if profiles table structure
    console.log('Checking profiles table structure...');
    const { data: structure, error: structureError } = await supabase.rpc('check_profiles_structure');
    
    if (structureError) {
      console.error('Error checking profiles structure:', structureError);
      return;
    }
    
    console.log('Profiles table structure:');
    structure.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type}, ${col.is_nullable === 'YES' ? 'nullable' : 'not nullable'})`);
    });
    
    // Check for has_completed_onboarding column
    const hasOnboardingColumn = structure.some(col => col.column_name === 'has_completed_onboarding');
    console.log('Has onboarding column:', hasOnboardingColumn);
    
    if (!hasOnboardingColumn) {
      console.log('Adding has_completed_onboarding column to profiles table...');
      // Add the column if it doesn't exist
      const { error: alterError } = await supabase.rpc('add_onboarding_column');
      if (alterError) {
        console.error('Error adding column:', alterError);
        return;
      }
      console.log('Column added successfully');
    }
    
    // Check for NULL values in has_completed_onboarding
    const { data: nullCount, error: nullError } = await supabase.rpc('check_null_onboarding');
    
    if (nullError) {
      console.error('Error checking for NULL values:', nullError);
      return;
    }
    
    console.log(`Found ${nullCount} profiles with NULL onboarding status`);
    
    // Fix NULL values by setting them to false
    if (nullCount > 0) {
      console.log('Fixing NULL values...');
      const { error: fixError } = await supabase.rpc('fix_null_onboarding');
      
      if (fixError) {
        console.error('Error fixing NULL values:', fixError);
        return;
      }
      console.log('NULL values fixed successfully');
    }
    
    // List all profiles with their onboarding status
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, user_id, display_name, has_completed_onboarding')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return;
    }
    
    console.log('Recent profiles:');
    profiles.forEach(profile => {
      console.log(`- ${profile.display_name || profile.user_id}: onboarding=${profile.has_completed_onboarding}`);
    });
    
    console.log('\nDone!');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

main(); 