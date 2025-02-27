import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppState } from './AppStateContext';
import { BadgeService, initializeBadges } from '@/services/BadgeService';
import { Alert } from 'react-native';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon_name: string;
  category: string;
  created_at: string;
}

export interface UserBadge {
  id: string;
  created_at: string;
  user_id: string;
  badge_id: string;
  badge?: Badge;
}

interface BadgeContextType {
  badges: Badge[];
  userBadges: UserBadge[];
  addUserBadge: (badgeName: string) => Promise<void>;
  getBadgeById: (id: string) => Badge | undefined;
  getBadgeByName: (name: string) => Badge | undefined;
  refreshBadges: () => Promise<void>;
  isLoading: boolean;
  setUserId: (userId: string | null) => void;
}

const BadgeContext = createContext<BadgeContextType | undefined>(undefined);

export const useBadges = () => {
  const context = useContext(BadgeContext);
  if (!context) {
    throw new Error('useBadges must be used within a BadgeProvider');
  }
  return context;
};

export const BadgeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const { showError, showSuccess } = useAppState();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initializationAttempts, setInitializationAttempts] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const errorShownRef = useRef(false);
  const firstBadgeCheckedRef = useRef(false);

  const initializeBadgesTables = async () => {
    if (isInitializing) return;
    
    try {
      setIsInitializing(true);
      setIsLoading(true);
      
      // Check if badges table exists by trying to fetch a single record
      const { data: tableCheck, error: tableError } = await supabase
        .from('badges')
        .select('id')
        .limit(1);
      
      if (tableError || !tableCheck || tableCheck.length === 0) {
        console.log('Badges table might not exist, attempting to create it...');
        
        // Use the BadgeService to create and initialize badges
        await initializeBadges();
        
        // Verify that badges were created by fetching a single record
        const { data: badgeData, error: verifyError } = await supabase
          .from('badges')
          .select('id')
          .limit(1);
          
        if (verifyError || !badgeData || badgeData.length === 0) {
          console.error('Failed to verify badges creation:', verifyError);
          
          // If we've tried less than 3 times, try again
          if (initializationAttempts < 2) {
            setInitializationAttempts(prev => prev + 1);
            setIsInitializing(false);
            return initializeBadgesTables();
          }
        } else {
          // Successfully created and verified badges
          setIsInitialized(true);
        }
      } else {
        // Badges table exists
        setIsInitialized(true);
      }
    } catch (error) {
      console.error('Error initializing badges tables:', error);
    } finally {
      setIsInitializing(false);
      setIsLoading(false);
    }
  };

  const fetchBadges = async () => {
    try {
      setIsLoading(true);
      
      if (!isInitialized && !isInitializing) {
        await initializeBadgesTables();
      }
      
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .order('category', { ascending: true });
        
      if (error) {
        console.error('Error fetching badges:', error);
        // Don't throw error, continue with empty badges array
        setBadges([]);
        return;
      }
      
      if (data && data.length > 0) {
        console.log(`Found ${data.length} badges in database`);
        setBadges(data);
        console.log(`Set ${data.length} badges in state`);
        errorShownRef.current = false; // Reset error flag when successful
      } else {
        console.log('No badges found in database');
        
        // We can't create badges due to RLS policies, so we'll just have to work with what we have
        console.log('Unable to create badges due to RLS policies, will use existing badges only');
        
        // Try fetching again with a different query to make sure we didn't miss anything
        const { data: allBadges, error: allBadgesError } = await supabase
          .from('badges')
          .select('*');
          
        if (allBadgesError) {
          console.error('Error fetching all badges:', allBadgesError);
          // Set empty badges array to prevent UI errors
          setBadges([]);
        } else if (allBadges && allBadges.length > 0) {
          console.log(`Found ${allBadges.length} badges with unfiltered query`);
          setBadges(allBadges);
          console.log(`Set ${allBadges.length} badges in state from unfiltered query`);
        } else {
          console.log('No badges found with unfiltered query either');
          // Set empty badges array to prevent UI errors
          setBadges([]);
        }
      }
    } catch (error: any) {
      console.error('Error fetching badges:', error.message);
      // Set empty badges array to prevent UI errors
      setBadges([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserBadges = async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      
      if (!isInitialized && !isInitializing) {
        await initializeBadgesTables();
      }
      
      const { data, error } = await supabase
        .from('user_badges')
        .select('*, badge:badges(*)')
        .eq('user_id', userId);
        
      if (error) {
        console.error('Error fetching user badges:', error);
        return;
      }
      
      setUserBadges(data || []);
      
      // Check if user has any badges, if not and they have check-ins, award first badge
      if (!firstBadgeCheckedRef.current && (!data || data.length === 0)) {
        firstBadgeCheckedRef.current = true;
        await checkAndAwardFirstBadge();
      }
    } catch (error: any) {
      console.error('Error fetching user badges:', error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Check if user has completed any journal entries and award first badge if needed
  const checkAndAwardFirstBadge = async () => {
    if (!userId) return;
    
    try {
      console.log('Checking if user should receive welcome badge or first check-in badge...');
      
      // First, check if user already has any badges
      const { data: existingUserBadges, error: userBadgesError } = await supabase
        .from('user_badges')
        .select('id, badge_id')
        .eq('user_id', userId);
        
      if (userBadgesError) {
        console.error('Error checking existing user badges:', userBadgesError);
      } else if (existingUserBadges && existingUserBadges.length > 0) {
        console.log(`User already has ${existingUserBadges.length} badges, skipping first badge check`);
        return;
      }
      
      // Fetch badges directly from database to ensure we have the latest data
      const { data: latestBadges, error: badgesError } = await supabase
        .from('badges')
        .select('*');
        
      if (badgesError) {
        console.error('Error fetching latest badges:', badgesError);
      } else if (latestBadges && latestBadges.length > 0) {
        console.log(`Fetched ${latestBadges.length} badges directly from database`);
        // Update our local state with the latest badges
        setBadges(latestBadges);
      }
      
      // Use the latest badges from state or the ones we just fetched
      const badgesToUse = badges.length > 0 ? badges : (latestBadges || []);
      
      // Log all available badges to help debug
      console.log(`Available badges (${badgesToUse.length}):`, badgesToUse.map(b => b.name).join(', '));
      
      // First try to find the Welcome Badge
      let badge = badgesToUse.find(b => 
        b.name.toLowerCase() === 'welcome badge' || 
        b.name.includes('Welcome') || 
        b.name.includes('welcome')
      );
      
      if (badge) {
        console.log(`Found Welcome Badge: ${badge.name}`);
      } else {
        // If Welcome Badge not found, try to find First Check-in badge
        const firstCheckInBadgeName = 'First Check-in';
        
        // Try to find the badge with a case-insensitive search
        badge = badgesToUse.find(b => 
          b.name.toLowerCase() === firstCheckInBadgeName.toLowerCase() || 
          b.name.includes(firstCheckInBadgeName) || 
          firstCheckInBadgeName.includes(b.name)
        );
        
        if (!badge) {
          console.log('Neither Welcome Badge nor First Check-in badge found with exact or partial match');
          
          // If we can't find it, look for any completion badge as a fallback
          badge = badgesToUse.find(b => b.category === 'completion');
          
          if (badge) {
            console.log(`Found alternative completion badge: ${badge.name}`);
          } else {
            console.log('No completion badges found, using first available badge as fallback');
            // Last resort: use any available badge
            badge = badgesToUse[0];
            
            if (badge) {
              console.log(`Using first available badge as fallback: ${badge.name}`);
            } else {
              console.log('No badges available at all, cannot award badge');
              return;
            }
          }
        } else {
          console.log(`Found First Check-in badge: ${badge.name}`);
        }
      }
      
      // Award the badge to the user since they don't have any badges yet
      console.log('User has no badges, awarding badge directly');
      try {
        // Use direct badge ID
        if (badge && badge.id) {
          console.log(`Adding badge directly with ID: ${badge.id}`);
          const { error } = await supabase
            .from('user_badges')
            .insert([
              { user_id: userId, badge_id: badge.id }
            ]);
            
          if (error) {
            if (error.code === '23505') {
              console.log(`User already has the "${badge.name}" badge`);
            } else {
              console.error('Error adding user badge directly:', error);
            }
          } else {
            console.log(`Successfully added "${badge.name}" badge to user`);
            showSuccess(`🏅 Badge Unlocked: ${badge.name}`);
            await fetchUserBadges();
          }
        }
      } catch (awardError) {
        console.error('Error awarding badge:', awardError);
      }
      
      // Also check for journal entries and streaks for the First Check-in badge
      // Check if user has any journal entries (which are check-ins)
      console.log('Checking for user journal entries...');
      const { data: journalEntries, error: journalError } = await supabase
        .from('journal_entries')
        .select('id')
        .eq('user_id', userId)
        .limit(1);
        
      if (journalError) {
        console.error('Error checking user journal entries:', journalError);
        // Don't throw error, just log it and continue
      }
      
      // If user has journal entries but no badges, award first check-in badge
      if (journalEntries && journalEntries.length > 0) {
        console.log('User has journal entries but no badges, already awarded badge above');
        return; // Exit early if we've awarded the badge
      } else {
        console.log('User has no journal entries yet');
      }
      
      // Also check user_streaks table
      console.log('Checking for user streaks...');
      const { data: streaks, error: streaksError } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (streaksError && streaksError.code !== 'PGRST116') {
        console.error('Error checking user streaks:', streaksError);
        // Don't throw error, just log it and continue
      }
      
      // If user has any streaks > 0, we've already awarded the badge above
      if (streaks && (streaks.morning_streak > 0 || streaks.afternoon_streak > 0 || streaks.evening_streak > 0)) {
        console.log('User has streaks but no badges, already awarded badge above');
      } else {
        console.log('User has no streaks yet');
      }
    } catch (error: any) {
      console.error('Error checking and awarding first badge:', error.message);
      // Don't let this error propagate to the UI
    }
  };

  const refreshBadges = async () => {
    setIsLoading(true);
    try {
      await fetchBadges();
      await fetchUserBadges();
    } catch (error) {
      console.error('Error refreshing badges:', error);
      // Don't show error to user, just log it
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      initializeBadgesTables().then(() => {
        refreshBadges().catch(error => {
          console.error('Error in badge initialization:', error);
          // Don't show error to user, just log it
        });
      }).catch(error => {
        console.error('Error initializing badge tables:', error);
        // Don't show error to user, just log it
      });
    }
  }, [userId]);

  const getBadgeById = (id: string) => {
    return badges.find(badge => badge.id === id);
  };
  
  const getBadgeByName = (name: string) => {
    return badges.find(badge => badge.name === name);
  };

  const addUserBadge = async (badgeName: string) => {
    if (!userId) return;
    
    try {
      console.log(`Attempting to award badge: "${badgeName}" to user: ${userId}`);
      
      // Find the badge by name
      const badge = getBadgeByName(badgeName);
      if (!badge) {
        console.error(`Badge with name "${badgeName}" not found in state`);
        
        // Try to fetch the badge directly from the database
        const { data: directBadge, error: directBadgeError } = await supabase
          .from('badges')
          .select('*')
          .ilike('name', `%${badgeName}%`)
          .limit(1)
          .single();
          
        if (directBadgeError) {
          console.error(`Error fetching badge "${badgeName}" directly:`, directBadgeError);
          return;
        }
        
        if (!directBadge) {
          console.error(`Badge with name "${badgeName}" not found in database`);
          return;
        }
        
        console.log(`Found badge directly from database: ${directBadge.name} (${directBadge.id})`);
        
        // Check if user already has this badge
        const { data: existingBadge, error: existingBadgeError } = await supabase
          .from('user_badges')
          .select('id')
          .eq('user_id', userId)
          .eq('badge_id', directBadge.id)
          .maybeSingle();
          
        if (existingBadgeError) {
          console.error(`Error checking if user has badge "${badgeName}":`, existingBadgeError);
        }
        
        if (existingBadge) {
          console.log(`User already has badge "${badgeName}", skipping`);
          return;
        }
        
        // Award the badge
        const { error: insertError } = await supabase
          .from('user_badges')
          .insert([
            { user_id: userId, badge_id: directBadge.id }
          ]);
            
        if (insertError) {
          if (insertError.code === '23505') {
            console.log(`User already has badge "${badgeName}" (detected by error code)`);
            return;
          }
          console.error(`Error adding user badge "${badgeName}":`, insertError);
          return;
        }
        
        // Show success message
        showSuccess(`🏅 Badge Unlocked: ${directBadge.name}`);
        
        // Refresh user badges
        await fetchUserBadges();
        return;
      }
      
      console.log(`Found badge in state: ${badge.name} (${badge.id})`);
      
      // Check if user already has this badge
      const exists = userBadges.some(ub => ub.badge_id === badge.id);
      if (exists) {
        console.log(`User already has badge "${badgeName}" in state, skipping`);
        return;
      }
      
      const { error } = await supabase
        .from('user_badges')
        .insert([
          { user_id: userId, badge_id: badge.id }
        ]);
          
      if (error) {
        if (error.code === '23505') {
          console.log(`User already has badge "${badgeName}" (detected by error code)`);
          return;
        }
        console.error(`Error adding user badge "${badgeName}":`, error);
        return;
      }
      
      // Show success message
      showSuccess(`🏅 Badge Unlocked: ${badge.name}`);
      
      // Refresh user badges
      await fetchUserBadges();
    } catch (error: any) {
      console.error(`Error adding user badge "${badgeName}":`, error.message);
    }
  };

  // Check and award streak badges
  const checkStreakBadges = async (streaks: any) => {
    if (!userId) return;
    await BadgeService.checkStreakBadges(streaks, addUserBadge);
  };

  return (
    <BadgeContext.Provider value={{
      badges,
      userBadges,
      addUserBadge,
      getBadgeById,
      getBadgeByName,
      refreshBadges,
      isLoading,
      setUserId,
    }}>
      {children}
    </BadgeContext.Provider>
  );
}; 