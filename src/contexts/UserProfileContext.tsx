import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { useAppState } from './AppStateContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon_name: string;
  points: number;
  requires_streak: number | null;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  created_at: string;
  user_id: string;
  achievement_id: string;
  achievement?: Achievement;
}

export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  streak: number;
  last_check_in: string | null;
  points: number;
  user_goals: string[];
  notification_preferences: string[];
  created_at: string;
  updated_at: string;
}

interface UserProfileContextType {
  userProfile: UserProfile | null;
  isLoading: boolean;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  saveUserGoals: (goals: string[]) => Promise<void>;
  saveNotificationPreferences: (preferences: string[]) => Promise<void>;
  syncUserPoints: () => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export const useProfile = () => {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a UserProfileProvider');
  }
  return context;
};

export const UserProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { showError } = useAppState();

  // Special function to force load the name from AsyncStorage
  const forceLoadNameFromStorage = async () => {
    if (userProfile) {
      const storedName = await AsyncStorage.getItem('userName');
      if (storedName && storedName.trim() && storedName !== userProfile.display_name) {
        console.log('Forcing profile name update from AsyncStorage:', storedName);
        
        // Update profile in memory
        setUserProfile({
          ...userProfile,
          display_name: storedName
        });
        
        // Try to update in database too
        try {
          await supabase
            .from('profiles')
            .update({ display_name: storedName })
            .eq('user_id', user?.id);
        } catch (error) {
          console.error('Error updating display name in database:', error);
        }
      }
    }
  };

  const fetchProfile = async () => {
    if (!user) {
      setUserProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // First check if the profiles table exists
      const { error: tableCheckError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
        .single();
      
      if (tableCheckError && tableCheckError.message.includes('relation "profiles" does not exist')) {
        // Get locally stored preferences
        const storedGoals = await AsyncStorage.getItem('userGoals');
        const storedNotifications = await AsyncStorage.getItem('notificationPreferences');
        const storedName = await AsyncStorage.getItem('userName');
        
        const tempProfile: UserProfile = {
          id: 'temp-id',
          user_id: user.id,
          display_name: storedName || user.email || 'User',
          avatar_url: null,
          streak: 0,
          last_check_in: null,
          points: 0,
          user_goals: storedGoals ? JSON.parse(storedGoals) : [],
          notification_preferences: storedNotifications ? JSON.parse(storedNotifications) : [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setUserProfile(tempProfile);
        console.log('Using temporary profile until database is updated');
        return;
      }
      
      // If the table exists, proceed with the normal query
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If no profile exists, create one instead of throwing an error
        if (error.code === 'PGRST116') {
          console.log('No profile found for user, creating a new one');
          
          // Load data from AsyncStorage
          const storedGoals = await AsyncStorage.getItem('userGoals');
          const storedNotifications = await AsyncStorage.getItem('notificationPreferences');
          const storedName = await AsyncStorage.getItem('userName');
          
          console.log('UserProfileContext - creating profile with name:', {
            storedName,
            userEmail: user.email,
            finalName: storedName || user.email || 'User'
          });
          
          const newProfile: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'> = {
            user_id: user.id,
            display_name: storedName || user.email || 'User',
            avatar_url: null,
            streak: 0,
            last_check_in: null,
            points: 0,
            user_goals: storedGoals ? JSON.parse(storedGoals) : [],
            notification_preferences: storedNotifications ? JSON.parse(storedNotifications) : []
          };
          
          const { data: createdProfile, error: createError } = await supabase
            .from('profiles')
            .insert([newProfile])
            .select()
            .single();
            
          if (createError) {
            // If it's a duplicate key error, another process might have created the profile
            if (createError.code === '23505') {
              console.log('Profile already exists, fetching it instead');
              const { data: existingProfile, error: fetchError } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', user.id)
                .single();
                
              if (fetchError) throw fetchError;
              setUserProfile(existingProfile);
            } else {
              throw createError;
            }
          } else {
            setUserProfile(createdProfile);
          }
        } else {
          throw error;
        }
      } else {
        // We got data from the database, but check if we have any local data that should be synced
        // This handles the case where onboarding data was saved locally but not yet in the database
        try {
          let shouldUpdate = false;
          const updates: Partial<UserProfile> = {};
          
          // Check for stored name in AsyncStorage
          const storedName = await AsyncStorage.getItem('userName');
          
          console.log('UserProfileContext - checking stored name:', {
            storedName,
            dbDisplayName: data.display_name,
            userEmail: user.email
          });
          
          // Always prioritize stored name from onboarding over any database value
          if (storedName && storedName.trim()) {
            // Only update if it's different than what's already in the database
            if (storedName !== data.display_name) {
              updates.display_name = storedName;
              shouldUpdate = true;
            }
          }
          
          // Check if goals should be updated from local storage
          if (!data.user_goals || data.user_goals.length === 0) {
            const storedGoals = await AsyncStorage.getItem('userGoals');
            if (storedGoals) {
              updates.user_goals = JSON.parse(storedGoals);
              shouldUpdate = true;
            }
          }
          
          // Check if notification preferences should be updated from local storage
          if (!data.notification_preferences || data.notification_preferences.length === 0) {
            const storedNotifications = await AsyncStorage.getItem('notificationPreferences');
            if (storedNotifications) {
              updates.notification_preferences = JSON.parse(storedNotifications);
              shouldUpdate = true;
            }
          }
          
          if (shouldUpdate) {
            console.log('Syncing local data to database profile');
            // Update the profile with local data
            await supabase
              .from('profiles')
              .update(updates)
              .eq('user_id', user.id);
              
            // Merge the updates with the data
            setUserProfile({...data, ...updates});
          } else {
            setUserProfile(data);
          }
        } catch (syncError) {
          console.error('Error syncing local data to profile:', syncError);
          // Continue with the database data if sync fails
          setUserProfile(data);
        }
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error.message);
      showError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;

    try {
      // If we're updating display_name, also save to AsyncStorage
      if (updates.display_name) {
        await AsyncStorage.setItem('userName', updates.display_name);
        console.log('Saved display_name to AsyncStorage:', updates.display_name);
      }
      
      // First check if the profiles table exists
      const { error: tableCheckError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
        .single();
      
      if (tableCheckError && tableCheckError.message.includes('relation "profiles" does not exist')) {
        console.log('Cannot update profile: profiles table does not exist yet');
        // Just update the local state for now
        if (userProfile) {
          setUserProfile({
            ...userProfile,
            ...updates,
            updated_at: new Date().toISOString()
          });
        }
        return;
      }
      
      // If the table exists, proceed with the normal update
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;
      
      // Refresh profile after update
      await fetchProfile();
    } catch (error: any) {
      console.error('Error updating profile:', error.message);
      showError('Failed to update profile');
      throw error;
    }
  };

  const refreshProfile = async () => {
    await fetchProfile();
  };

  // New function to sync points from user_stats to profile
  const syncUserPoints = async () => {
    if (!user || !userProfile) return;
    
    try {
      console.log('Syncing user points from user_stats to profile');
      
      // Get the latest points from user_stats
      const { data: userStatsData, error: userStatsError } = await supabase
        .from('user_stats')
        .select('total_points')
        .eq('user_id', user.id)
        .single();
        
      if (userStatsError) {
        console.error('Error fetching user stats for points sync:', userStatsError);
        return;
      }
      
      if (userStatsData && userStatsData.total_points !== userProfile.points) {
        console.log(`Updating profile points from ${userProfile.points} to ${userStatsData.total_points}`);
        
        // Update the user's profile with the points from user_stats
        await updateProfile({ points: userStatsData.total_points });
      }
    } catch (error) {
      console.error('Error syncing user points:', error);
    }
  };

  // Add function to save user goals
  const saveUserGoals = async (goals: string[]) => {
    if (!user) return;
    
    try {
      // Save to AsyncStorage for offline availability
      await AsyncStorage.setItem('userGoals', JSON.stringify(goals));
      
      // Update in database if available
      try {
        await supabase
          .from('profiles')
          .update({ user_goals: goals })
          .eq('user_id', user.id);
          
        // Update local state
        if (userProfile) {
          setUserProfile({
            ...userProfile,
            user_goals: goals,
            updated_at: new Date().toISOString()
          });
        }
      } catch (dbError: any) {
        console.log('Database not available, goals saved locally only', dbError.message);
        // Still update local state
        if (userProfile) {
          setUserProfile({
            ...userProfile,
            user_goals: goals,
            updated_at: new Date().toISOString()
          });
        }
      }
    } catch (error: any) {
      console.error('Error saving user goals:', error.message);
      showError('Failed to save your goals');
      throw error;
    }
  };
  
  // Add function to save notification preferences
  const saveNotificationPreferences = async (preferences: string[]) => {
    if (!user) return;
    
    try {
      // Save to AsyncStorage for offline availability
      await AsyncStorage.setItem('notificationPreferences', JSON.stringify(preferences));
      
      // Update in database if available
      try {
        await supabase
          .from('profiles')
          .update({ notification_preferences: preferences })
          .eq('user_id', user.id);
          
        // Update local state
        if (userProfile) {
          setUserProfile({
            ...userProfile,
            notification_preferences: preferences,
            updated_at: new Date().toISOString()
          });
        }
      } catch (dbError: any) {
        console.log('Database not available, notification preferences saved locally only', dbError.message);
        // Still update local state
        if (userProfile) {
          setUserProfile({
            ...userProfile,
            notification_preferences: preferences,
            updated_at: new Date().toISOString()
          });
        }
      }
    } catch (error: any) {
      console.error('Error saving notification preferences:', error.message);
      showError('Failed to save your notification preferences');
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setUserProfile(null);
      setIsLoading(false);
    }
  }, [user]);

  // Force load the name from AsyncStorage once the profile is loaded
  useEffect(() => {
    if (userProfile && !isLoading) {
      forceLoadNameFromStorage();
    }
  }, [userProfile?.id, isLoading, user?.id]);

  return (
    <UserProfileContext.Provider value={{
      userProfile,
      isLoading,
      updateProfile,
      refreshProfile,
      saveUserGoals,
      saveNotificationPreferences,
      syncUserPoints
    }}>
      {children}
    </UserProfileContext.Provider>
  );
}; 