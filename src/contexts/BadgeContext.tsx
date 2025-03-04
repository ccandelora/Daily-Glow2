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
  getBadgeCount: () => Promise<number>;
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
      
      console.log(`Fetching badges for user: ${userId}`);
      
      // First, check if user has any badges directly
      const { data: directBadges, error: directError } = await supabase
        .from('user_badges')
        .select('id, badge_id, created_at, user_id')
        .eq('user_id', userId);
        
      if (directError) {
        console.error('Error fetching user badges directly:', directError);
      } else if (directBadges && directBadges.length > 0) {
        console.log(`Found ${directBadges.length} user badges directly`);
        
        // Now fetch the badge details for each badge
        const badgePromises = directBadges.map(async (userBadge) => {
          const { data: badgeData, error: badgeError } = await supabase
            .from('badges')
            .select('*')
            .eq('id', userBadge.badge_id)
            .single();
            
          if (badgeError) {
            console.error(`Error fetching badge details for badge_id ${userBadge.badge_id}:`, badgeError);
            return { ...userBadge, badge: null };
          }
          
          return { ...userBadge, badge: badgeData };
        });
        
        const userBadgesWithDetails = await Promise.all(badgePromises);
        console.log(`Fetched details for ${userBadgesWithDetails.filter(ub => ub.badge).length} badges`);
        
        // Update the state with the fetched badges - CRITICAL FIX HERE
        const validBadges = userBadgesWithDetails.filter(ub => ub.badge !== null);
        console.log(`Setting ${validBadges.length} valid badges to state`);
        
        if (validBadges.length > 0) {
          // Create proper UserBadge objects with all required fields
          const properUserBadges: UserBadge[] = validBadges.map(badge => ({
            id: badge.id,
            created_at: badge.created_at,
            user_id: badge.user_id,
            badge_id: badge.badge_id,
            badge: badge.badge as Badge
          }));
          
          setUserBadges(properUserBadges);
          console.log(`Successfully set ${properUserBadges.length} badges from direct query`);
        }
        
        // If we successfully found badges directly, don't continue with the join query
        if (validBadges.length > 0) {
          setIsLoading(false);
          return;
        }
      }
      
      // If no direct badges found or all badge details failed to load, try the join query
      console.log('Trying join query for badges');
      const { data, error } = await supabase
        .from('user_badges')
        .select('*, badge:badges(*)')
        .eq('user_id', userId);
        
      if (error) {
        console.error('Error fetching user badges with join:', error);
        
        // As a fallback, try to get just the user_badges without the join
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('user_badges')
          .select('*')
          .eq('user_id', userId);
          
        if (fallbackError) {
          console.error('Error fetching user badges fallback:', fallbackError);
          // If we've already set badges from the direct query, don't clear them
          if (userBadges.length === 0) {
            setUserBadges([]);
          }
        } else if (fallbackData && fallbackData.length > 0) {
          console.log(`Found ${fallbackData.length} user badges in fallback query`);
          
          // If we have fallback data but no badge details, try to fetch them
          if (fallbackData.length > 0 && userBadges.length === 0) {
            console.log('Fetching badge details for fallback data');
            const badgePromises = fallbackData.map(async (userBadge) => {
              const { data: badgeData, error: badgeError } = await supabase
                .from('badges')
                .select('*')
                .eq('id', userBadge.badge_id)
                .single();
                
              if (badgeError) {
                console.error(`Error fetching badge details for badge_id ${userBadge.badge_id}:`, badgeError);
                return { ...userBadge, badge: null };
              }
              
              return { ...userBadge, badge: badgeData };
            });
            
            const userBadgesWithDetails = await Promise.all(badgePromises);
            console.log(`Fetched details for ${userBadgesWithDetails.filter(ub => ub.badge).length} badges from fallback`);
            
            // Update the state with the fetched badges - CRITICAL FIX
            const validBadges = userBadgesWithDetails.filter(ub => ub.badge !== null);
            
            if (validBadges.length > 0) {
              // Create proper UserBadge objects with all required fields
              const properUserBadges: UserBadge[] = validBadges.map(badge => ({
                id: badge.id,
                created_at: badge.created_at || new Date().toISOString(),
                user_id: badge.user_id || userId,
                badge_id: badge.badge_id,
                badge: badge.badge as Badge
              }));
              
              console.log(`Setting ${properUserBadges.length} valid badges to state from fallback`);
              setUserBadges(properUserBadges);
            }
          } else {
            // CRITICAL FIX: Don't set badges without proper structure
            console.log('Not updating state with fallback data as it lacks badge details');
          }
        } else {
          console.log('No user badges found in fallback query');
          // If we've already set badges from the direct query, don't clear them
          if (userBadges.length === 0) {
            setUserBadges([]);
          }
        }
      } else if (data && data.length > 0) {
        console.log(`Found ${data.length} user badges with join query`);
        
        // CRITICAL FIX: Properly format the data from the join query
        const validBadges = data.filter(item => item.badge !== null);
        
        if (validBadges.length > 0) {
          // Create proper UserBadge objects with all required fields
          const properUserBadges: UserBadge[] = validBadges.map(badge => ({
            id: badge.id,
            created_at: badge.created_at,
            user_id: badge.user_id,
            badge_id: badge.badge_id,
            badge: badge.badge as Badge
          }));
          
          console.log(`Setting ${properUserBadges.length} valid badges to state from join query`);
          setUserBadges(properUserBadges);
        } else {
          console.log('Join query returned data but no valid badges with details');
          // Don't clear existing badges if we have them
          if (userBadges.length === 0) {
            setUserBadges([]);
          }
        }
      } else {
        console.log('No user badges found with join query');
        // Don't clear existing badges if we have them
        if (userBadges.length === 0) {
          setUserBadges([]);
        }
      }
      
      // Check if user has any badges, if not and they have check-ins, award first badge
      if (!firstBadgeCheckedRef.current && (!userBadges || userBadges.length === 0)) {
        firstBadgeCheckedRef.current = true;
        await checkAndAwardFirstBadge();
      }
    } catch (error: any) {
      console.error('Error fetching user badges:', error.message);
    } finally {
      setIsLoading(false);
      console.log(`After fetchUserBadges: Found ${userBadges.length} user badges in state`);
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
        console.log(`Found Welcome Badge: ${badge.name} (ID: ${badge.id})`);
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
            
            // Explicitly fetch user badges again to ensure the UI updates
            await fetchUserBadges();
            console.log(`After awarding badge: Found ${userBadges.length} user badges`);
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
      console.log('Starting badge refresh process...');
      await fetchBadges();
      await fetchUserBadges();
      
      // Force a re-fetch of user badges to ensure we have the latest data
      if (userId) {
        console.log('Performing direct badge check...');
        const { data: directCheck, error: directError } = await supabase
          .from('user_badges')
          .select('id, badge_id, created_at, user_id')
          .eq('user_id', userId);
          
        if (directError) {
          console.error('Error in direct badge check:', directError);
        } else {
          console.log(`Direct badge check found ${directCheck?.length || 0} badges`);
          
          // If we found badges directly but our state doesn't have them,
          // update our state with the direct badges
          if (directCheck && directCheck.length > 0) {
            if (userBadges.length === 0) {
              console.log('Discrepancy detected: Direct check found badges but state has none. Forcing refresh...');
              
              // Instead of just calling fetchUserBadges, let's directly update our state
              // with the badges we just found to avoid any race conditions
              const badgePromises = directCheck.map(async (userBadge) => {
                const { data: badgeData, error: badgeError } = await supabase
                  .from('badges')
                  .select('*')
                  .eq('id', userBadge.badge_id)
                  .single();
                  
                if (badgeError) {
                  console.error(`Error fetching badge details for badge_id ${userBadge.badge_id}:`, badgeError);
                  return { ...userBadge, badge: null };
                }
                
                return { ...userBadge, badge: badgeData };
              });
              
              const userBadgesWithDetails = await Promise.all(badgePromises);
              console.log(`Fetched details for ${userBadgesWithDetails.filter(ub => ub.badge).length} badges during discrepancy fix`);
              
              // CRITICAL FIX: Create proper UserBadge objects and update state
              const validBadges = userBadgesWithDetails.filter(ub => ub.badge !== null);
              
              if (validBadges.length > 0) {
                // Create proper UserBadge objects with all required fields
                const properUserBadges: UserBadge[] = validBadges.map(badge => ({
                  id: badge.id,
                  created_at: badge.created_at,
                  user_id: badge.user_id,
                  badge_id: badge.badge_id,
                  badge: badge.badge as Badge
                }));
                
                console.log(`Setting ${properUserBadges.length} valid badges to state during discrepancy fix`);
                setUserBadges(properUserBadges);
              }
            } else {
              // Check if we have any badges in directCheck that aren't in userBadges
              const missingBadges = directCheck.filter(
                directBadge => !userBadges.some(ub => ub.badge_id === directBadge.badge_id)
              );
              
              if (missingBadges.length > 0) {
                console.log(`Found ${missingBadges.length} badges in database that aren't in state, fetching details...`);
                
                // Fetch details for missing badges
                const badgePromises = missingBadges.map(async (userBadge) => {
                  const { data: badgeData, error: badgeError } = await supabase
                    .from('badges')
                    .select('*')
                    .eq('id', userBadge.badge_id)
                    .single();
                    
                  if (badgeError) {
                    console.error(`Error fetching badge details for badge_id ${userBadge.badge_id}:`, badgeError);
                    return { ...userBadge, badge: null };
                  }
                  
                  return { ...userBadge, badge: badgeData };
                });
                
                const missingBadgesWithDetails = await Promise.all(badgePromises);
                console.log(`Fetched details for ${missingBadgesWithDetails.filter(ub => ub.badge).length} missing badges`);
                
                // CRITICAL FIX: Properly format the missing badges before adding to state
                const validMissingBadges = missingBadgesWithDetails.filter(ub => ub.badge !== null);
                
                if (validMissingBadges.length > 0) {
                  // Create proper UserBadge objects with all required fields
                  const properMissingBadges: UserBadge[] = validMissingBadges.map(badge => ({
                    id: badge.id,
                    created_at: badge.created_at,
                    user_id: badge.user_id,
                    badge_id: badge.badge_id,
                    badge: badge.badge as Badge
                  }));
                  
                  console.log(`Adding ${properMissingBadges.length} missing badges to state`);
                  
                  // Update the state with the combined badges
                  setUserBadges([...userBadges, ...properMissingBadges]);
                }
              }
            }
          }
        }
      }
      
      console.log(`After refresh: Found ${userBadges.length} user badges in state`);
      
      // If user has no badges, try to award the welcome badge
      if (userBadges.length === 0) {
        console.log('No badges found after refresh, attempting to award welcome badge...');
        await checkAndAwardFirstBadge();
        // Fetch user badges again after attempting to award welcome badge
        await fetchUserBadges();
        console.log(`After welcome badge check: Found ${userBadges.length} user badges`);
        
        // If still no badges, try direct insertion
        if (userBadges.length === 0 && userId) {
          console.log('Still no badges after welcome badge check, attempting direct insertion...');
          
          // Try to use an RPC function first if available (this can bypass RLS)
          try {
            console.log('Attempting to award welcome badge via RPC function...');
            const { data: rpcResult, error: rpcError } = await supabase
              .rpc('award_welcome_badge', { user_id_param: userId });
              
            if (rpcError) {
              console.log('RPC function not available or failed:', rpcError);
              // Fall back to direct insertion
            } else if (rpcResult) {
              console.log('Successfully awarded welcome badge via RPC function:', rpcResult);
              
              // Fetch the badge details to update the state
              const { data: welcomeBadge, error: welcomeError } = await supabase
                .from('badges')
                .select('*')
                .eq('name', 'Welcome Badge')
                .single();
                
              if (welcomeError) {
                console.error('Error finding welcome badge:', welcomeError);
              } else if (welcomeBadge) {
                // Fetch the user badge record
                const { data: userBadgeRecord, error: recordError } = await supabase
                  .from('user_badges')
                  .select('*')
                  .eq('user_id', userId)
                  .eq('badge_id', welcomeBadge.id)
                  .single();
                  
                if (recordError) {
                  console.error('Error fetching user badge record:', recordError);
                } else if (userBadgeRecord) {
                  // Update the state with the welcome badge
                  setUserBadges([{
                    ...userBadgeRecord,
                    badge: welcomeBadge
                  } as UserBadge]);
                  
                  console.log('Updated state with welcome badge from RPC function');
                  return; // Exit early since we've successfully updated the state
                }
              }
            }
          } catch (rpcError) {
            console.error('Error calling RPC function:', rpcError);
            // Continue with fallback methods
          }
          
          // First check if the user already has the welcome badge to avoid duplicate key error
          const { data: existingWelcomeBadge, error: existingError } = await supabase
            .from('user_badges')
            .select('id')
            .eq('user_id', userId)
            .eq('badge_id', '3fb5c984-ff9f-4d13-a1fe-681da56b311d') // Known welcome badge ID
            .maybeSingle();
            
          if (existingError) {
            console.error('Error checking for existing welcome badge:', existingError);
          } else if (existingWelcomeBadge) {
            console.log('User already has welcome badge, updating state...');
            
            // Fetch the badge details
            const { data: welcomeBadgeDetails, error: detailsError } = await supabase
              .from('badges')
              .select('*')
              .eq('id', '3fb5c984-ff9f-4d13-a1fe-681da56b311d')
              .single();
              
            if (detailsError) {
              console.error('Error fetching welcome badge details:', detailsError);
            } else if (welcomeBadgeDetails) {
              // Update the state with the welcome badge
              setUserBadges([{
                id: existingWelcomeBadge.id,
                badge_id: '3fb5c984-ff9f-4d13-a1fe-681da56b311d',
                user_id: userId,
                created_at: new Date().toISOString(),
                badge: welcomeBadgeDetails
              } as UserBadge]);
              
              console.log('Updated state with existing welcome badge');
            }
          } else {
            // Find the welcome badge
            const { data: welcomeBadge, error: welcomeError } = await supabase
              .from('badges')
              .select('id')
              .eq('name', 'Welcome Badge')
              .single();
              
            if (welcomeError) {
              console.error('Error finding welcome badge:', welcomeError);
            } else if (welcomeBadge) {
              console.log(`Found welcome badge with ID: ${welcomeBadge.id}, inserting directly...`);
              
              // Insert the badge directly
              const { data: insertData, error: insertError } = await supabase
                .from('user_badges')
                .insert([
                  { user_id: userId, badge_id: welcomeBadge.id }
                ])
                .select();
                
              if (insertError) {
                if (insertError.code === '23505') {
                  console.log('User already has welcome badge (duplicate key error), fetching it directly...');
                  
                  // Fetch the existing badge
                  const { data: existingBadge, error: fetchError } = await supabase
                    .from('user_badges')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('badge_id', welcomeBadge.id)
                    .single();
                    
                  if (fetchError) {
                    console.error('Error fetching existing welcome badge:', fetchError);
                  } else if (existingBadge) {
                    // Fetch the badge details
                    const { data: badgeDetails, error: detailsError } = await supabase
                      .from('badges')
                      .select('*')
                      .eq('id', welcomeBadge.id)
                      .single();
                      
                    if (detailsError) {
                      console.error('Error fetching welcome badge details:', detailsError);
                    } else if (badgeDetails) {
                      // Update the state with the welcome badge
                      setUserBadges([{
                        ...existingBadge,
                        badge: badgeDetails
                      } as UserBadge]);
                      
                      console.log('Updated state with existing welcome badge after duplicate key error');
                    }
                  }
                } else {
                  console.error('Error inserting welcome badge directly:', insertError);
                }
              } else if (insertData && insertData.length > 0) {
                console.log('Successfully inserted welcome badge directly');
                
                // Fetch the badge details
                const { data: badgeDetails, error: detailsError } = await supabase
                  .from('badges')
                  .select('*')
                  .eq('id', welcomeBadge.id)
                  .single();
                  
                if (detailsError) {
                  console.error('Error fetching welcome badge details after insertion:', detailsError);
                } else if (badgeDetails) {
                  // Update the state with the welcome badge
                  setUserBadges([{
                    ...insertData[0],
                    badge: badgeDetails
                  } as UserBadge]);
                  
                  console.log('Updated state with newly inserted welcome badge');
                }
              }
            }
          }
        }
      } else {
        console.log('User has badges, no need to award welcome badge');
        // Log the badges the user has for debugging
        userBadges.forEach(badge => {
          console.log(`User has badge: ${badge.badge?.name || 'Unknown'} (ID: ${badge.badge_id})`);
        });
      }
    } catch (error) {
      console.error('Error refreshing badges:', error);
      // Don't show error to user, just log it
    } finally {
      setIsLoading(false);
      console.log(`Final badge count in state after refresh: ${userBadges.length}`);
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

  // Add a new method to directly get badge count from the database
  const getBadgeCount = async (): Promise<number> => {
    if (!userId) return 0;
    
    try {
      console.log(`Getting badge count for user: ${userId}`);
      
      const { data, error } = await supabase
        .from('user_badges')
        .select('id')
        .eq('user_id', userId);
        
      if (error) {
        console.error('Error getting badge count:', error);
        return 0;
      }
      
      console.log(`Direct badge count query found ${data?.length || 0} badges`);
      return data?.length || 0;
    } catch (error) {
      console.error('Error in getBadgeCount:', error);
      return 0;
    }
  };

  return (
    <BadgeContext.Provider
      value={{
        badges,
        userBadges,
        addUserBadge,
        getBadgeById,
        getBadgeByName,
        refreshBadges,
        isLoading,
        setUserId,
        getBadgeCount,
      }}
    >
      {children}
    </BadgeContext.Provider>
  );
}; 