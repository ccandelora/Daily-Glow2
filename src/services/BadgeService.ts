import { supabase } from '@/lib/supabase';
import { CheckInStreak } from '@/contexts/CheckInStreakContext';

// Define badge categories
interface StreakBadges {
  [key: string]: string;
}

interface StreakCategories {
  MORNING: StreakBadges;
  AFTERNOON: StreakBadges;
  EVENING: StreakBadges;
  [key: string]: StreakBadges;
}

export const BADGE_IDS = {
  // Streak badges
  STREAKS: {
    MORNING: {
      '3': 'Morning Streak: 3 Days',
      '7': 'Morning Streak: 7 Days',
      '14': 'Morning Streak: 14 Days',
      '30': 'Morning Streak: 30 Days',
      '60': 'Morning Streak: 60 Days',
      '90': 'Morning Streak: 90 Days',
    } as StreakBadges,
    AFTERNOON: {
      '3': 'Afternoon Streak: 3 Days',
      '7': 'Afternoon Streak: 7 Days',
      '14': 'Afternoon Streak: 14 Days',
      '30': 'Afternoon Streak: 30 Days',
      '60': 'Afternoon Streak: 60 Days',
      '90': 'Afternoon Streak: 90 Days',
    } as StreakBadges,
    EVENING: {
      '3': 'Evening Streak: 3 Days',
      '7': 'Evening Streak: 7 Days',
      '14': 'Evening Streak: 14 Days',
      '30': 'Evening Streak: 30 Days',
      '60': 'Evening Streak: 60 Days',
      '90': 'Evening Streak: 90 Days',
    } as StreakBadges,
  } as StreakCategories,
  // Time period badges
  TIME_PERIODS: {
    'All Periods Completed': 'All Periods Completed',
  },
  // Completion badges
  COMPLETION: {
    'Welcome Badge': 'Welcome Badge',
    'First Check-in': 'First Check-in',
    'First Week Completed': 'First Week Completed',
    'First Month Completed': 'First Month Completed',
  },
  // Emotion badges
  EMOTIONS: {
    'Emotional Range': 'Emotional Range',
    'Positive Shift': 'Positive Shift',
    'Emotional Balance': 'Emotional Balance',
  },
};

export class BadgeService {
  // Check if a badge exists and create it if it doesn't
  private static async ensureBadgeExists(name: string, description: string, category: string, icon_name: string): Promise<void> {
    try {
      console.log(`Checking if badge exists: ${name}`);
      
      // Check if badge exists by name
      const { data, error } = await supabase
        .from('badges')
        .select('id')
        .eq('name', name)
        .maybeSingle();
      
      if (error) {
        console.error(`Error checking if badge exists: ${name}`, error);
        return;
      }
      
      if (!data) {
        // Badge doesn't exist, create it
        console.log(`Badge "${name}" doesn't exist, creating it now...`);
        
        const { data: insertData, error: insertError } = await supabase
          .from('badges')
          .insert([
            {
              name,
              description,
              category,
              icon_name,
            }
          ])
          .select('id')
          .single();
          
        if (insertError) {
          console.error(`Error creating badge: ${name}`, insertError);
          return;
        }
        
        console.log(`Successfully created badge: ${name} with ID: ${insertData?.id || 'unknown'}`);
      } else {
        console.log(`Badge already exists: ${name} with ID: ${data.id}`);
      }
    } catch (error) {
      console.error(`Error ensuring badge exists: ${name}`, error);
    }
  }

  // Initialize all badges in the database
  public static async initializeBadges(): Promise<void> {
    try {
      console.log('Initializing badges...');
      
      // First check if badges already exist
      const { data: existingBadges, error: checkError } = await supabase
        .from('badges')
        .select('id, name')
        .limit(1);
        
      if (checkError) {
        console.error('Error checking for existing badges:', checkError);
      } else if (existingBadges && existingBadges.length > 0) {
        console.log('Badges already exist, skipping initialization');
        
        // Count how many badges exist
        const { count, error: countError } = await supabase
          .from('badges')
          .select('*', { count: 'exact', head: true });
          
        if (countError) {
          console.error('Error counting badges:', countError);
        } else {
          console.log(`Found ${count} existing badges`);
        }
        
        return;
      }
      
      // Create badges table if it doesn't exist
      await this.createBadgesTables();
      
      // Create badges for each category
      console.log('Creating badges...');
      
      // Create completion badges first (including First Check-in)
      console.log('Creating completion badges...');
      for (const badgeId in BADGE_IDS.COMPLETION) {
        const badge = BADGE_IDS.COMPLETION[badgeId];
        console.log(`Creating badge: ${badge}`);
        const { error } = await supabase
          .from('badges')
          .insert([
            {
              name: badge,
              description: `Complete your ${badge.toLowerCase()}`,
              category: 'completion',
              icon_name: badgeId
            }
          ]);
          
        if (error) {
          console.error(`Error creating badge ${badge}:`, error);
        } else {
          console.log(`Successfully created badge: ${badge}`);
        }
      }
      
      // Create streak badges
      console.log('Creating streak badges...');
      for (const period in BADGE_IDS.STREAKS) {
        for (const days in BADGE_IDS.STREAKS[period]) {
          const badge = BADGE_IDS.STREAKS[period][days];
          console.log(`Creating badge: ${badge}`);
          const { error } = await supabase
            .from('badges')
            .insert([
              {
                name: badge,
                description: `Complete ${days} consecutive ${period.toLowerCase()} check-ins`,
                category: 'streak',
                icon_name: `streak-${period.toLowerCase()}-${days}`
              }
            ]);
            
          if (error) {
            console.error(`Error creating badge ${badge}:`, error);
          } else {
            console.log(`Successfully created badge: ${badge}`);
          }
        }
      }
      
      // Create emotion badges
      console.log('Creating emotion badges...');
      for (const badgeId in BADGE_IDS.EMOTIONS) {
        const badge = BADGE_IDS.EMOTIONS[badgeId];
        let description = '';
        
        switch (badgeId) {
          case 'emotional-range':
            description = 'Experience a wide range of emotions in your check-ins';
            break;
          case 'positive-shift':
            description = 'Experience a positive emotional shift in a check-in';
            break;
          case 'emotional-balance':
            description = 'Maintain emotional balance for a week';
            break;
          default:
            description = `Achieve ${badge}`;
        }
        
        console.log(`Creating badge: ${badge}`);
        const { error } = await supabase
          .from('badges')
          .insert([
            {
              name: badge,
              description,
              category: 'emotion',
              icon_name: badgeId
            }
          ]);
          
        if (error) {
          console.error(`Error creating badge ${badge}:`, error);
        } else {
          console.log(`Successfully created badge: ${badge}`);
        }
      }
      
      // Verify that badges were created
      const { data: verifyBadges, error: verifyError } = await supabase
        .from('badges')
        .select('*');
        
      if (verifyError) {
        console.error('Error verifying badges creation:', verifyError);
      } else {
        console.log(`Successfully created ${verifyBadges?.length || 0} badges`);
        
        // Check if First Check-in badge was created
        const firstCheckIn = verifyBadges?.find(b => b.name === 'First Check-in');
        if (firstCheckIn) {
          console.log('First Check-in badge was created successfully');
        } else {
          console.log('First Check-in badge was NOT created, attempting to create it directly');
          
          // Try to create it directly
          const { error: directError } = await supabase
            .from('badges')
            .insert([
              {
                name: 'First Check-in',
                description: 'Complete your first check-in',
                category: 'completion',
                icon_name: 'first-checkin'
              }
            ]);
            
          if (directError) {
            console.error('Error creating First Check-in badge directly:', directError);
          } else {
            console.log('Successfully created First Check-in badge directly');
          }
        }
      }
      
      console.log('Badge initialization complete');
    } catch (error: any) {
      console.error('Error initializing badges:', error.message);
    }
  }

  // Create badges tables if they don't exist
  public static async createBadgesTables(): Promise<void> {
    try {
      console.log('Creating badges tables...');
      
      // Check if badges table exists
      const { data: badgesExists, error: badgesCheckError } = await supabase
        .from('badges')
        .select('id')
        .limit(1);
        
      if (badgesCheckError && badgesCheckError.code !== 'PGRST116') {
        console.error('Error checking if badges table exists:', badgesCheckError);
      }
      
      if (!badgesExists || badgesExists.length === 0) {
        console.log('Badges table does not exist or is empty, creating it...');
        
        // Create badges table
        const { error: createError } = await supabase.rpc('create_badges_table');
        
        if (createError) {
          console.error('Error creating badges table:', createError);
        } else {
          console.log('Successfully created badges table');
        }
      } else {
        console.log('Badges table already exists');
      }
      
      // Check if user_badges table exists
      const { data: userBadgesExists, error: userBadgesCheckError } = await supabase
        .from('user_badges')
        .select('id')
        .limit(1);
        
      if (userBadgesCheckError && userBadgesCheckError.code !== 'PGRST116') {
        console.error('Error checking if user_badges table exists:', userBadgesCheckError);
      }
      
      if (!userBadgesExists || userBadgesExists.length === 0) {
        console.log('User badges table does not exist or is empty, creating it...');
        
        // Create user_badges table
        const { error: createUserBadgesError } = await supabase.rpc('create_user_badges_table');
        
        if (createUserBadgesError) {
          console.error('Error creating user_badges table:', createUserBadgesError);
        } else {
          console.log('Successfully created user_badges table');
        }
      } else {
        console.log('User badges table already exists');
      }
    } catch (error: any) {
      console.error('Error creating badges tables:', error.message);
    }
  }

  // Check streak counts and award appropriate badges
  public static async checkStreakBadges(streaks: CheckInStreak, addUserBadge: (badgeName: string) => Promise<void>): Promise<void> {
    console.log('Checking streak badges with streaks:', streaks);
    
    // Check morning streak
    if (streaks.morning >= 3) {
      console.log('User has morning streak of 3 or more, awarding Morning Person badge');
      await addUserBadge('Morning Person');
    }
    
    // Check afternoon streak
    if (streaks.afternoon >= 3) {
      console.log('User has afternoon streak of 3 or more, awarding Afternoon Delight badge');
      await addUserBadge('Afternoon Delight');
    }
    
    // Check evening streak
    if (streaks.evening >= 3) {
      console.log('User has evening streak of 3 or more, awarding Night Owl badge');
      await addUserBadge('Night Owl');
    }
    
    // Check overall streak
    const totalStreak = Math.max(
      streaks.morning,
      streaks.afternoon,
      streaks.evening
    );
    
    console.log(`User's highest streak is ${totalStreak}`);
    
    if (totalStreak >= 7) {
      console.log('User has streak of 7 or more, awarding Week Warrior badge');
      await addUserBadge('Week Warrior');
    }
    
    if (totalStreak >= 30) {
      console.log('User has streak of 30 or more, awarding Monthly Master badge');
      await addUserBadge('Monthly Master');
    }
  }

  // Check if all periods were completed in a day
  public static async checkAllPeriodsCompleted(addUserBadge: (badgeName: string) => Promise<void>): Promise<void> {
    try {
      const badgeName = BADGE_IDS.TIME_PERIODS['All Periods Completed'];
      await addUserBadge(badgeName).catch(e => {
        // Just log the error but don't show to user
        console.error(`Error awarding all periods badge "${badgeName}":`, e);
      });
    } catch (error) {
      console.error('Error checking all periods completed:', error);
    }
  }
  
  // Award welcome badge
  public static async awardWelcomeBadge(addUserBadge: (badgeName: string) => Promise<void>): Promise<void> {
    try {
      console.log('BadgeService: Attempting to award welcome badge');
      
      // Try to award using the provided function
      const badgeName = BADGE_IDS.COMPLETION['Welcome Badge'];
      
      // First, try to directly insert the badge using Supabase
      const { data: user } = await supabase.auth.getUser();
      if (user && user.user) {
        console.log('BadgeService: Found user ID:', user.user.id);
        
        // Get the welcome badge ID
        const { data: badgeData, error: badgeError } = await supabase
          .from('badges')
          .select('id')
          .eq('name', 'Welcome Badge')
          .single();
          
        if (badgeError) {
          console.error('BadgeService: Error finding welcome badge:', badgeError);
        } else if (badgeData) {
          console.log('BadgeService: Found welcome badge with ID:', badgeData.id);
          
          // Check if user already has this badge
          const { data: existingBadge, error: existingBadgeError } = await supabase
            .from('user_badges')
            .select('id')
            .eq('user_id', user.user.id)
            .eq('badge_id', badgeData.id)
            .maybeSingle();
            
          if (existingBadgeError && existingBadgeError.code !== 'PGRST116') {
            console.error('BadgeService: Error checking if user has welcome badge:', existingBadgeError);
          }
          
          if (existingBadge) {
            console.log('BadgeService: User already has welcome badge, skipping');
          } else {
            // Insert the user badge directly
            const { error: insertError } = await supabase
              .from('user_badges')
              .insert([
                { user_id: user.user.id, badge_id: badgeData.id }
              ]);
              
            if (insertError) {
              if (insertError.code === '23505') {
                console.log('BadgeService: User already has welcome badge (detected by error code)');
              } else {
                console.error('BadgeService: Error inserting welcome badge:', insertError);
              }
            } else {
              console.log('BadgeService: Successfully awarded welcome badge to user');
            }
          }
        }
      }
      
      // Also try using the provided function as a backup
      await addUserBadge(badgeName).catch(e => {
        // Just log the error but don't show to user
        console.error(`BadgeService: Error awarding welcome badge "${badgeName}" via addUserBadge:`, e);
      });
    } catch (error) {
      console.error('BadgeService: Error awarding welcome badge:', error);
    }
  }
  
  // Award first check-in badge
  public static async awardFirstCheckInBadge(addUserBadge: (badgeName: string) => Promise<void>): Promise<void> {
    try {
      const badgeName = BADGE_IDS.COMPLETION['First Check-in'];
      await addUserBadge(badgeName).catch(e => {
        // Just log the error but don't show to user
        console.error(`Error awarding first check-in badge "${badgeName}":`, e);
      });
    } catch (error) {
      console.error('Error awarding first check-in badge:', error);
    }
  }
}

export const initializeBadges = async () => {
  try {
    console.log('Initializing badges...');
    
    // Check if badges table exists
    const { data: tableExists, error: tableError } = await supabase
      .from('badges')
      .select('id')
      .limit(1);
      
    if (tableError) {
      console.error('Error checking badges table:', tableError);
      return;
    }
    
    // If badges already exist, don't recreate them
    if (tableExists && tableExists.length > 0) {
      console.log('Badges already exist, skipping initialization');
      return;
    }
    
    console.log('Creating badges...');
    
    // Define all badges
    const badges = [
      // Welcome badge
      {
        name: 'Welcome Badge',
        description: 'Welcome to Daily Glow! You\'ve taken the first step on your wellness journey.',
        icon_name: 'star',
        category: 'completion',
      },
      
      // Check-in badges
      {
        name: 'First Check-in',
        description: 'You completed your first check-in. Keep going!',
        icon_name: 'check',
        category: 'completion',
      },
      {
        name: 'Morning Person',
        description: 'Complete 3 morning check-ins in a row.',
        icon_name: 'sun',
        category: 'streak',
      },
      {
        name: 'Afternoon Delight',
        description: 'Complete 3 afternoon check-ins in a row.',
        icon_name: 'coffee',
        category: 'streak',
      },
      {
        name: 'Night Owl',
        description: 'Complete 3 evening check-ins in a row.',
        icon_name: 'moon',
        category: 'streak',
      },
      
      // Streak badges
      {
        name: 'Week Warrior',
        description: 'Maintain a 7-day streak in any time period.',
        icon_name: 'fire',
        category: 'streak',
      },
      {
        name: 'Monthly Master',
        description: 'Maintain a 30-day streak in any time period.',
        icon_name: 'crown',
        category: 'streak',
      },
      
      // Journal badges
      {
        name: 'Reflection Rookie',
        description: 'Write your first journal entry.',
        icon_name: 'book',
        category: 'beginner',
      },
      {
        name: 'Consistent Journaler',
        description: 'Write 5 journal entries.',
        icon_name: 'pen',
        category: 'intermediate',
      },
      {
        name: 'Journaling Pro',
        description: 'Write 20 journal entries.',
        icon_name: 'book-open',
        category: 'advanced',
      },
      
      // Mood tracking badges
      {
        name: 'Mood Tracker',
        description: 'Track your mood for 5 consecutive days.',
        icon_name: 'smile',
        category: 'beginner',
      },
      {
        name: 'Emotion Expert',
        description: 'Track your mood for 15 consecutive days.',
        icon_name: 'heart',
        category: 'intermediate',
      },
      
      // Achievement badges
      {
        name: 'Goal Setter',
        description: 'Set your first wellness goal.',
        icon_name: 'bullseye',
        category: 'beginner',
      },
      {
        name: 'Goal Achiever',
        description: 'Complete your first wellness goal.',
        icon_name: 'trophy',
        category: 'intermediate',
      },
    ];
    
    // Insert badges into database
    for (const badge of badges) {
      console.log(`Creating badge: ${badge.name}`);
      const { error } = await supabase
        .from('badges')
        .insert([badge]);
        
      if (error) {
        console.error(`Error creating badge ${badge.name}:`, error);
      }
    }
    
    console.log('Badge initialization complete');
  } catch (error) {
    console.error('Error initializing badges:', error);
  }
}; 