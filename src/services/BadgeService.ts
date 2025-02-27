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
    try {
      if (!streaks) {
        console.log('No streaks data provided, skipping badge check');
        return;
      }
      
      // Helper function to award badge and handle errors
      const awardBadge = async (badgeName: string) => {
        try {
          await addUserBadge(badgeName);
        } catch (e) {
          // Just log the error but don't show to user
          console.error('Error awarding badge:', e);
        }
      };
      
      // Check morning streaks
      const morningStreak = streaks.morning || 0;
      if (morningStreak >= 3) await awardBadge(BADGE_IDS.STREAKS.MORNING['3']);
      if (morningStreak >= 7) await awardBadge(BADGE_IDS.STREAKS.MORNING['7']);
      if (morningStreak >= 14) await awardBadge(BADGE_IDS.STREAKS.MORNING['14']);
      if (morningStreak >= 30) await awardBadge(BADGE_IDS.STREAKS.MORNING['30']);
      if (morningStreak >= 60) await awardBadge(BADGE_IDS.STREAKS.MORNING['60']);
      if (morningStreak >= 90) await awardBadge(BADGE_IDS.STREAKS.MORNING['90']);
      
      // Check afternoon streaks
      const afternoonStreak = streaks.afternoon || 0;
      if (afternoonStreak >= 3) await awardBadge(BADGE_IDS.STREAKS.AFTERNOON['3']);
      if (afternoonStreak >= 7) await awardBadge(BADGE_IDS.STREAKS.AFTERNOON['7']);
      if (afternoonStreak >= 14) await awardBadge(BADGE_IDS.STREAKS.AFTERNOON['14']);
      if (afternoonStreak >= 30) await awardBadge(BADGE_IDS.STREAKS.AFTERNOON['30']);
      if (afternoonStreak >= 60) await awardBadge(BADGE_IDS.STREAKS.AFTERNOON['60']);
      if (afternoonStreak >= 90) await awardBadge(BADGE_IDS.STREAKS.AFTERNOON['90']);
      
      // Check evening streaks
      const eveningStreak = streaks.evening || 0;
      if (eveningStreak >= 3) await awardBadge(BADGE_IDS.STREAKS.EVENING['3']);
      if (eveningStreak >= 7) await awardBadge(BADGE_IDS.STREAKS.EVENING['7']);
      if (eveningStreak >= 14) await awardBadge(BADGE_IDS.STREAKS.EVENING['14']);
      if (eveningStreak >= 30) await awardBadge(BADGE_IDS.STREAKS.EVENING['30']);
      if (eveningStreak >= 60) await awardBadge(BADGE_IDS.STREAKS.EVENING['60']);
      if (eveningStreak >= 90) await awardBadge(BADGE_IDS.STREAKS.EVENING['90']);
    } catch (error) {
      console.error('Error checking streak badges:', error);
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
  await BadgeService.initializeBadges();
}; 