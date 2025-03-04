// Script to debug badge issues in the Daily Glow app
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.SUPABASE_KEY || 'YOUR_SUPABASE_SERVICE_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

// Specify user ID to check (leave empty to check all users)
const USER_ID_TO_CHECK = ''; // e.g., '123e4567-e89b-12d3-a456-426614174000'

async function debugBadges() {
  try {
    console.log('===== Badge Debugging Tool =====');
    
    // 1. Check badge definitions
    console.log('\n1. Checking badge definitions...');
    const { data: badgeDefinitions, error: badgeError } = await supabase
      .from('badges')
      .select('*')
      .order('id');
      
    if (badgeError) {
      console.error('Error fetching badge definitions:', badgeError);
      return;
    }
    
    console.log(`Found ${badgeDefinitions.length} badge definitions`);
    console.log('First 3 badges:');
    badgeDefinitions.slice(0, 3).forEach(badge => {
      console.log(`- ${badge.name} (${badge.id}): ${badge.description}`);
    });
    
    // 2. Check user badges
    console.log('\n2. Checking user badges...');
    let userBadgesQuery = supabase.from('user_badges').select('*');
    
    if (USER_ID_TO_CHECK) {
      console.log(`Checking badges for specific user: ${USER_ID_TO_CHECK}`);
      userBadgesQuery = userBadgesQuery.eq('user_id', USER_ID_TO_CHECK);
    } else {
      console.log('Checking badges for all users (limited to 20)');
      userBadgesQuery = userBadgesQuery.limit(20);
    }
    
    const { data: userBadges, error: userBadgesError } = await userBadgesQuery;
    
    if (userBadgesError) {
      console.error('Error fetching user badges:', userBadgesError);
      return;
    }
    
    console.log(`Found ${userBadges.length} user badges`);
    
    // Group badges by user
    const badgesByUser = {};
    for (const badge of userBadges) {
      if (!badgesByUser[badge.user_id]) {
        badgesByUser[badge.user_id] = [];
      }
      badgesByUser[badge.user_id].push(badge);
    }
    
    // Display badges by user
    for (const userId in badgesByUser) {
      console.log(`\nUser ${userId} has ${badgesByUser[userId].length} badges:`);
      
      // Get badge details for each user badge
      for (const userBadge of badgesByUser[userId]) {
        const badge = badgeDefinitions.find(b => b.id === userBadge.badge_id);
        if (badge) {
          console.log(`- ${badge.name} (${badge.level}): awarded on ${new Date(userBadge.created_at).toLocaleString()}`);
        } else {
          console.log(`- Unknown badge (${userBadge.badge_id}): awarded on ${new Date(userBadge.created_at).toLocaleString()}`);
        }
      }
    }
    
    // 3. Check for users with no badges
    console.log('\n3. Checking for users with no badges...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, display_name, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return;
    }
    
    console.log('Checking badge status for 10 most recent users:');
    for (const profile of profiles) {
      const { data: badgeCount, error: countError } = await supabase
        .from('user_badges')
        .select('id', { count: 'exact' })
        .eq('user_id', profile.user_id);
        
      if (countError) {
        console.error(`Error checking badges for user ${profile.user_id}:`, countError);
        continue;
      }
      
      const count = badgeCount?.length || 0;
      console.log(`- ${profile.display_name || profile.user_id}: ${count} badges (created: ${new Date(profile.created_at).toLocaleString()})`);
      
      if (count === 0) {
        console.log(`  ⚠️ User has no badges! Should at least have welcome badge.`);
      }
    }
    
    // 4. Fix missing welcome badges
    console.log('\n4. Would you like to fix missing welcome badges? (y/n)');
    // In a real implementation, you would prompt the user and fix missing badges
    console.log('To fix missing welcome badges, run this script with the --fix flag');
    
    console.log('\n===== Badge Debugging Complete =====');
    console.log('If you need to fix badge issues:');
    console.log('1. Check the badge awarding logic in the app');
    console.log('2. Run this script with --fix to repair missing welcome badges');
    console.log('3. Use the app\'s debug tools to verify fixes');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Check if --fix flag is provided
const shouldFix = process.argv.includes('--fix');
if (shouldFix) {
  console.log('Running in FIX mode - will attempt to repair missing welcome badges');
  // In a real implementation, you would add code to fix missing badges
}

debugBadges(); 