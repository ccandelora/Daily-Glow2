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
  // Consistency badges - awarded for maintaining streaks across multiple time periods
  CONSISTENCY: {
    'Consistency Champion: Bronze': 'Consistency Champion: Bronze',  // All periods with 3+ day streaks
    'Consistency Champion: Silver': 'Consistency Champion: Silver',  // All periods with 7+ day streaks
    'Consistency Champion: Gold': 'Consistency Champion: Gold',      // All periods with 14+ day streaks
    'Consistency Champion: Platinum': 'Consistency Champion: Platinum', // All periods with 30+ day streaks
  },
  // Mood pattern badges - NEW
  MOOD_PATTERNS: {
    'Gratitude Master': 'Gratitude Master',         // Write detailed gratitude entries for 7 days
    'Mood Improver': 'Mood Improver',               // Show positive emotional shift in 5 entries
    'Emotional Explorer': 'Emotional Explorer',     // Use 10 different emotion categories
    'Mood Insight': 'Mood Insight',                 // Record the same emotion 3 days in a row
    'Emotion Investigator': 'Emotion Investigator', // Add detailed notes to 5 emotional entries
  },
  // Journal frequency badges - NEW
  JOURNAL_FREQUENCY: {
    'Daily Journaler': 'Daily Journaler',           // Journal for 7 consecutive days
    'Weekly Reflection': 'Weekly Reflection',       // Complete at least one entry each day for a week
    'Afternoon Reflection': 'Afternoon Reflection', // Complete 5 afternoon reflections
    'Evening Reflection': 'Evening Reflection',     // Complete 5 evening reflections
    'Morning Reflection': 'Morning Reflection',     // Complete 5 morning reflections
    'Full Day Recorder': 'Full Day Recorder',       // Record entries for all periods in a day for 3 days
  }
};

// Badge icon mapping for all badge types
interface BadgeIconMap {
  [key: string]: string;
}

export const BADGE_ICONS: BadgeIconMap = {
  // Streak badge icons
  'streak-morning-3': 'sun',
  'streak-morning-7': 'sun',
  'streak-morning-14': 'sun',
  'streak-morning-30': 'sun',
  'streak-morning-60': 'sun',
  'streak-morning-90': 'sun',
  'streak-afternoon-3': 'cloud-sun',
  'streak-afternoon-7': 'cloud-sun',
  'streak-afternoon-14': 'cloud-sun',
  'streak-afternoon-30': 'cloud-sun',
  'streak-afternoon-60': 'cloud-sun',
  'streak-afternoon-90': 'cloud-sun',
  'streak-evening-3': 'moon',
  'streak-evening-7': 'moon',
  'streak-evening-14': 'moon',
  'streak-evening-30': 'moon',
  'streak-evening-60': 'moon',
  'streak-evening-90': 'moon',
  
  // Time period badge icons
  'All Periods Completed': 'clock',
  
  // Completion badge icons
  'Welcome Badge': 'hand-wave',
  'First Check-in': 'check-circle',
  'First Week Completed': 'calendar',
  'First Month Completed': 'calendar-check',
  
  // Emotion badge icons
  'Emotional Range': 'rainbow',
  'Positive Shift': 'trending-up',
  'Emotional Balance': 'balance-scale',
  
  // Consistency badge icons
  'Consistency Champion: Bronze': 'medal',
  'Consistency Champion: Silver': 'medal',
  'Consistency Champion: Gold': 'medal',
  'Consistency Champion: Platinum': 'medal',
  
  // Mood pattern badge icons - NEW
  'Gratitude Master': 'heart-circle',
  'Mood Improver': 'trending-up',
  'Emotional Explorer': 'compass',
  'Mood Insight': 'lightbulb',
  'Emotion Investigator': 'search',
  
  // Journal frequency badge icons - NEW
  'Daily Journaler': 'book',
  'Weekly Reflection': 'bookmark',
  'Afternoon Reflection': 'cloud-sun',
  'Evening Reflection': 'moon',
  'Morning Reflection': 'sun',
  'Full Day Recorder': 'calendar-day',
  
  // Default icon
  'default': 'star'
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
        const badge = BADGE_IDS.COMPLETION[badgeId as keyof typeof BADGE_IDS.COMPLETION];
        console.log(`Creating badge: ${badge}`);
        const { error } = await supabase
          .from('badges')
          .insert([
            {
              name: badge,
              description: `Complete your ${badge.toLowerCase()}`,
              category: 'completion',
              icon_name: BADGE_ICONS[badge] || BADGE_ICONS['default']
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
          const iconKey = `streak-${period.toLowerCase()}-${days}`;
          const { error } = await supabase
            .from('badges')
            .insert([
              {
                name: badge,
                description: `Complete ${days} consecutive ${period.toLowerCase()} check-ins`,
                category: 'streak',
                icon_name: BADGE_ICONS[iconKey] || BADGE_ICONS['default']
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
        const badge = BADGE_IDS.EMOTIONS[badgeId as keyof typeof BADGE_IDS.EMOTIONS];
        let description = '';
        
        switch (badgeId) {
          case 'Emotional Range':
            description = 'Experience a wide range of emotions in your check-ins';
            break;
          case 'Positive Shift':
            description = 'Experience a positive emotional shift in a check-in';
            break;
          case 'Emotional Balance':
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
              icon_name: BADGE_ICONS[badge] || BADGE_ICONS['default']
            }
          ]);
          
        if (error) {
          console.error(`Error creating badge ${badge}:`, error);
        } else {
          console.log(`Successfully created badge: ${badge}`);
        }
      }
      
      // Create consistency badges
      console.log('Creating consistency badges...');
      for (const badgeId in BADGE_IDS.CONSISTENCY) {
        const badge = BADGE_IDS.CONSISTENCY[badgeId as keyof typeof BADGE_IDS.CONSISTENCY];
        let description = '';
        
        switch (badgeId) {
          case 'Consistency Champion: Bronze':
            description = 'Maintain at least a 3-day streak in all time periods';
            break;
          case 'Consistency Champion: Silver':
            description = 'Maintain at least a 7-day streak in all time periods';
            break;
          case 'Consistency Champion: Gold':
            description = 'Maintain at least a 14-day streak in all time periods';
            break;
          case 'Consistency Champion: Platinum':
            description = 'Maintain at least a 30-day streak in all time periods';
            break;
          default:
            description = `Earn ${badge}`;
        }
        
        console.log(`Creating badge: ${badge}`);
        const { error } = await supabase
          .from('badges')
          .insert([
            {
              name: badge,
              description,
              category: 'consistency',
              icon_name: BADGE_ICONS[badge] || BADGE_ICONS['default']
            }
          ]);
          
        if (error) {
          console.error(`Error creating badge ${badge}:`, error);
        } else {
          console.log(`Successfully created badge: ${badge}`);
        }
      }
      
      // Create mood pattern badges
      console.log('Creating mood pattern badges...');
      for (const badgeId in BADGE_IDS.MOOD_PATTERNS) {
        const badge = BADGE_IDS.MOOD_PATTERNS[badgeId as keyof typeof BADGE_IDS.MOOD_PATTERNS];
        let description = '';
        
        switch (badgeId) {
          case 'Gratitude Master':
            description = 'Write detailed gratitude entries for 7 days';
            break;
          case 'Mood Improver':
            description = 'Show positive emotional shift in 5 check-in entries';
            break;
          case 'Emotional Explorer':
            description = 'Use 10 different emotion categories in your check-ins';
            break;
          case 'Mood Insight':
            description = 'Record the same primary emotion 3 days in a row';
            break;
          case 'Emotion Investigator':
            description = 'Add detailed notes to 5 emotional entries';
            break;
          default:
            description = `Earn ${badge}`;
        }
        
        console.log(`Creating badge: ${badge}`);
        const { error } = await supabase
          .from('badges')
          .insert([
            {
              name: badge,
              description,
              category: 'mood_pattern',
              icon_name: BADGE_ICONS[badge] || BADGE_ICONS['default']
            }
          ]);
          
        if (error) {
          console.error(`Error creating badge ${badge}:`, error);
        } else {
          console.log(`Successfully created badge: ${badge}`);
        }
      }
      
      // Create journal frequency badges
      console.log('Creating journal frequency badges...');
      for (const badgeId in BADGE_IDS.JOURNAL_FREQUENCY) {
        const badge = BADGE_IDS.JOURNAL_FREQUENCY[badgeId as keyof typeof BADGE_IDS.JOURNAL_FREQUENCY];
        let description = '';
        
        switch (badgeId) {
          case 'Daily Journaler':
            description = 'Complete at least one check-in for 7 consecutive days';
            break;
          case 'Weekly Reflection':
            description = 'Complete at least one check-in each day for a week';
            break;
          case 'Afternoon Reflection':
            description = 'Complete 5 afternoon check-ins';
            break;
          case 'Evening Reflection':
            description = 'Complete 5 evening check-ins';
            break;
          case 'Morning Reflection':
            description = 'Complete 5 morning check-ins';
            break;
          case 'Full Day Recorder':
            description = 'Record check-ins for all time periods in a day for 3 different days';
            break;
          default:
            description = `Earn ${badge}`;
        }
        
        console.log(`Creating badge: ${badge}`);
        const { error } = await supabase
          .from('badges')
          .insert([
            {
              name: badge,
              description,
              category: 'journal_frequency',
              icon_name: BADGE_ICONS[badge] || BADGE_ICONS['default']
            }
          ]);
          
        if (error) {
          console.error(`Error creating badge ${badge}:`, error);
        } else {
          console.log(`Successfully created badge: ${badge}`);
        }
      }
      
      console.log('All badges created successfully');
    } catch (error) {
      console.error('Error initializing badges:', error);
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
      
      // Check for consistency champions (all time periods have streaks)
      const allPeriodsActive = morningStreak > 0 && afternoonStreak > 0 && eveningStreak > 0;
      
      if (allPeriodsActive) {
        // Bronze - all periods at least 3 days
        if (morningStreak >= 3 && afternoonStreak >= 3 && eveningStreak >= 3) {
          await awardBadge(BADGE_IDS.CONSISTENCY['Consistency Champion: Bronze']);
        }
        
        // Silver - all periods at least 7 days
        if (morningStreak >= 7 && afternoonStreak >= 7 && eveningStreak >= 7) {
          await awardBadge(BADGE_IDS.CONSISTENCY['Consistency Champion: Silver']);
        }
        
        // Gold - all periods at least 14 days
        if (morningStreak >= 14 && afternoonStreak >= 14 && eveningStreak >= 14) {
          await awardBadge(BADGE_IDS.CONSISTENCY['Consistency Champion: Gold']);
        }
        
        // Platinum - all periods at least 30 days
        if (morningStreak >= 30 && afternoonStreak >= 30 && eveningStreak >= 30) {
          await awardBadge(BADGE_IDS.CONSISTENCY['Consistency Champion: Platinum']);
        }
      }
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

  /**
   * Check for mood pattern achievements based on journal entries
   * @param entries The user's journal entries
   * @param addUserBadge Callback to add a badge to a user
   */
  public static async checkMoodPatternBadges(
    entries: any[], 
    addUserBadge: (badgeName: string) => Promise<void>
  ): Promise<void> {
    try {
      if (!entries || entries.length === 0) {
        return;
      }

      // Check for Gratitude Master - detailed gratitude entries for 7 days
      // We'll determine "detailed" as entries with gratitude text longer than 20 characters
      const detailedGratitudeEntries = entries.filter(entry => 
        entry.gratitude && entry.gratitude.length > 20
      );
      
      if (detailedGratitudeEntries.length >= 7) {
        const badgeName = BADGE_IDS.MOOD_PATTERNS['Gratitude Master'];
        await addUserBadge(badgeName).catch(e => {
          console.error(`BadgeService: Error awarding ${badgeName} badge:`, e);
        });
      }

      // Check for Mood Improver - positive emotional shift in 5 entries
      const positiveShiftEntries = entries.filter(entry => 
        entry.emotional_shift && entry.emotional_shift > 0
      );
      
      if (positiveShiftEntries.length >= 5) {
        const badgeName = BADGE_IDS.MOOD_PATTERNS['Mood Improver'];
        await addUserBadge(badgeName).catch(e => {
          console.error(`BadgeService: Error awarding ${badgeName} badge:`, e);
        });
      }

      // Check for Emotional Explorer - use 10 different emotion categories
      const uniqueEmotions = new Set(
        entries.map(entry => entry.initial_emotion)
          .filter(emotion => emotion) // Remove null/undefined
      );
      
      if (uniqueEmotions.size >= 10) {
        const badgeName = BADGE_IDS.MOOD_PATTERNS['Emotional Explorer'];
        await addUserBadge(badgeName).catch(e => {
          console.error(`BadgeService: Error awarding ${badgeName} badge:`, e);
        });
      }

      // Check for Mood Insight - same emotion 3 days in a row
      // Sort entries by date
      const sortedEntries = [...entries].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      let sameEmotionCount = 1;
      let prevEmotion = sortedEntries[0]?.initial_emotion;
      
      for (let i = 1; i < sortedEntries.length; i++) {
        const currentEmotion = sortedEntries[i].initial_emotion;
        
        if (currentEmotion === prevEmotion) {
          sameEmotionCount++;
          if (sameEmotionCount >= 3) {
            const badgeName = BADGE_IDS.MOOD_PATTERNS['Mood Insight'];
            await addUserBadge(badgeName).catch(e => {
              console.error(`BadgeService: Error awarding ${badgeName} badge:`, e);
            });
            break;
          }
        } else {
          sameEmotionCount = 1;
          prevEmotion = currentEmotion;
        }
      }

      // Check for Emotion Investigator - detailed notes in 5 entries
      // We'll determine "detailed" as entries with note text longer than 30 characters
      const detailedNoteEntries = entries.filter(entry => 
        entry.note && entry.note.length > 30
      );
      
      if (detailedNoteEntries.length >= 5) {
        const badgeName = BADGE_IDS.MOOD_PATTERNS['Emotion Investigator'];
        await addUserBadge(badgeName).catch(e => {
          console.error(`BadgeService: Error awarding ${badgeName} badge:`, e);
        });
      }
    } catch (error) {
      console.error('Error checking mood pattern badges:', error);
    }
  }

  /**
   * Check for journal frequency achievements based on journal entries
   * @param entries The user's journal entries
   * @param addUserBadge Callback to add a badge to a user
   */
  public static async checkJournalFrequencyBadges(
    entries: any[], 
    addUserBadge: (badgeName: string) => Promise<void>
  ): Promise<void> {
    try {
      if (!entries || entries.length === 0) {
        return;
      }

      // Sort entries by date
      const sortedEntries = [...entries].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      // Group entries by date (YYYY-MM-DD)
      const entriesByDate = sortedEntries.reduce((acc, entry) => {
        const date = new Date(entry.created_at).toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(entry);
        return acc;
      }, {} as Record<string, any[]>);

      // Check for Daily Journaler - one check-in for 7 consecutive days
      const dateKeys = Object.keys(entriesByDate).sort();
      let maxConsecutiveDays = 1;
      let currentStreak = 1;
      
      for (let i = 1; i < dateKeys.length; i++) {
        const currentDate = new Date(dateKeys[i]);
        const prevDate = new Date(dateKeys[i - 1]);
        
        // Check if dates are consecutive
        const dayDiff = Math.round((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (dayDiff === 1) {
          currentStreak++;
          maxConsecutiveDays = Math.max(maxConsecutiveDays, currentStreak);
        } else {
          currentStreak = 1;
        }
      }
      
      if (maxConsecutiveDays >= 7) {
        const badgeName = BADGE_IDS.JOURNAL_FREQUENCY['Daily Journaler'];
        await addUserBadge(badgeName).catch(e => {
          console.error(`BadgeService: Error awarding ${badgeName} badge:`, e);
        });
      }

      // Check for Weekly Reflection - 7 consecutive days with entries
      if (maxConsecutiveDays >= 7) {
        const badgeName = BADGE_IDS.JOURNAL_FREQUENCY['Weekly Reflection'];
        await addUserBadge(badgeName).catch(e => {
          console.error(`BadgeService: Error awarding ${badgeName} badge:`, e);
        });
      }

      // Check for period-specific reflection badges
      const morningEntries = entries.filter(entry => entry.time_period === 'morning');
      const afternoonEntries = entries.filter(entry => entry.time_period === 'afternoon');
      const eveningEntries = entries.filter(entry => entry.time_period === 'evening');
      
      if (morningEntries.length >= 5) {
        const badgeName = BADGE_IDS.JOURNAL_FREQUENCY['Morning Reflection'];
        await addUserBadge(badgeName).catch(e => {
          console.error(`BadgeService: Error awarding ${badgeName} badge:`, e);
        });
      }
      
      if (afternoonEntries.length >= 5) {
        const badgeName = BADGE_IDS.JOURNAL_FREQUENCY['Afternoon Reflection'];
        await addUserBadge(badgeName).catch(e => {
          console.error(`BadgeService: Error awarding ${badgeName} badge:`, e);
        });
      }
      
      if (eveningEntries.length >= 5) {
        const badgeName = BADGE_IDS.JOURNAL_FREQUENCY['Evening Reflection'];
        await addUserBadge(badgeName).catch(e => {
          console.error(`BadgeService: Error awarding ${badgeName} badge:`, e);
        });
      }

      // Check for Full Day Recorder - all periods in a day for 3 different days
      let fullDayCount = 0;
      
      for (const date in entriesByDate) {
        const dayEntries = entriesByDate[date];
        const periods = new Set(dayEntries.map((entry: any) => entry.time_period));
        
        if (periods.size >= 3) { // All three periods recorded
          fullDayCount++;
          
          if (fullDayCount >= 3) {
            const badgeName = BADGE_IDS.JOURNAL_FREQUENCY['Full Day Recorder'];
            await addUserBadge(badgeName).catch(e => {
              console.error(`BadgeService: Error awarding ${badgeName} badge:`, e);
            });
            break;
          }
        }
      }
    } catch (error) {
      console.error('Error checking journal frequency badges:', error);
    }
  }
}

export const initializeBadges = async () => {
  await BadgeService.initializeBadges();
}; 