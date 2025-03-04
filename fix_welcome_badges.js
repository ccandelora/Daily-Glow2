// Script to fix missing welcome badges for users
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.SUPABASE_KEY || 'YOUR_SUPABASE_SERVICE_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

// Welcome badge ID - update this with your actual welcome badge ID
const WELCOME_BADGE_ID = '3fb5c984-ff9f-4d13-a1fe-681da56b311d'; // Based on logs

async function fixWelcomeBadges() {
  try {
    console.log('===== Welcome Badge Fix Tool =====');
    
    // 1. Find the welcome badge to confirm it exists
    console.log('\n1. Verifying welcome badge...');
    const { data: welcomeBadge, error: badgeError } = await supabase
      .from('badges')
      .select('*')
      .eq('id', WELCOME_BADGE_ID)
      .single();
      
    if (badgeError) {
      console.error('Error fetching welcome badge:', badgeError);
      console.log('Please check the WELCOME_BADGE_ID in the script.');
      return;
    }
    
    console.log(`Found welcome badge: ${welcomeBadge.name} (${welcomeBadge.id})`);
    
    // 2. Find users without welcome badge
    console.log('\n2. Finding users without welcome badge...');
    
    // Get all users
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, display_name, created_at')
      .order('created_at', { ascending: false });
      
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return;
    }
    
    console.log(`Found ${profiles.length} user profiles`);
    
    // Check which users don't have the welcome badge
    const usersWithoutWelcomeBadge = [];
    
    for (const profile of profiles) {
      const { data: badgeCheck, error: checkError } = await supabase
        .from('user_badges')
        .select('id')
        .eq('user_id', profile.user_id)
        .eq('badge_id', WELCOME_BADGE_ID);
        
      if (checkError) {
        console.error(`Error checking welcome badge for user ${profile.user_id}:`, checkError);
        continue;
      }
      
      if (!badgeCheck || badgeCheck.length === 0) {
        usersWithoutWelcomeBadge.push(profile);
      }
      
      // Show progress every 10 users
      if (usersWithoutWelcomeBadge.length % 10 === 0 || usersWithoutWelcomeBadge.length === 1) {
        process.stdout.write(`Processed ${usersWithoutWelcomeBadge.length} users without welcome badge\r`);
      }
    }
    
    console.log(`\nFound ${usersWithoutWelcomeBadge.length} users without welcome badge`);
    
    // 3. Fix missing welcome badges
    if (usersWithoutWelcomeBadge.length === 0) {
      console.log('All users have welcome badges! Nothing to fix.');
      return;
    }
    
    console.log('\n3. Fixing missing welcome badges...');
    
    // Ask for confirmation
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question(`Do you want to award welcome badges to ${usersWithoutWelcomeBadge.length} users? (y/n) `, async (answer) => {
      if (answer.toLowerCase() === 'y') {
        console.log('Awarding welcome badges...');
        
        let successCount = 0;
        let errorCount = 0;
        
        for (const profile of usersWithoutWelcomeBadge) {
          // Award welcome badge
          const { error: insertError } = await supabase
            .from('user_badges')
            .insert({
              user_id: profile.user_id,
              badge_id: WELCOME_BADGE_ID,
              awarded_at: new Date().toISOString()
            });
            
          if (insertError) {
            console.error(`Error awarding welcome badge to user ${profile.user_id}:`, insertError);
            errorCount++;
          } else {
            successCount++;
          }
          
          // Show progress every 10 users
          if ((successCount + errorCount) % 10 === 0 || (successCount + errorCount) === 1) {
            process.stdout.write(`Progress: ${successCount + errorCount}/${usersWithoutWelcomeBadge.length} (${successCount} successful, ${errorCount} failed)\r`);
          }
        }
        
        console.log(`\nCompleted! Awarded welcome badges to ${successCount} users (${errorCount} failed)`);
      } else {
        console.log('Operation cancelled.');
      }
      
      readline.close();
    });
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

fixWelcomeBadges(); 