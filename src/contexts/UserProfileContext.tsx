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
        
        const tempProfile: UserProfile = {
          id: 'temp-id',
          user_id: user.id,
          display_name: user.email || 'User',
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
          
          const newProfile: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'> = {
            user_id: user.id,
            display_name: user.email || 'User',
            avatar_url: null,
            streak: 0,
            last_check_in: null,
            points: 0,
            user_goals: [],
            notification_preferences: []
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
        setUserProfile(data);
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
    fetchProfile();
  }, [user?.id]);

  return (
    <UserProfileContext.Provider value={{
      userProfile,
      isLoading,
      updateProfile,
      refreshProfile,
      saveUserGoals,
      saveNotificationPreferences
    }}>
      {children}
    </UserProfileContext.Provider>
  );
}; 