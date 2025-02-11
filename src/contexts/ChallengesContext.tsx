import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAppState } from './AppStateContext';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'mood' | 'gratitude' | 'mindfulness' | 'creative';
  points: number;
  challenge_status?: 'not_started' | 'in_progress' | 'completed' | 'failed';
}

interface UserChallenge {
  id: string;
  challenge_id: string;
  status: 'in_progress' | 'completed' | 'failed';
  completed_at: string | null;
  created_at: string;
}

interface Achievement {
  id: string;
  type: 'streak' | 'challenge' | 'milestone';
  name: string;
  description: string;
  points: number;
  achieved_at: string;
  metadata: Record<string, any>;
}

interface UserStats {
  current_streak: number;
  longest_streak: number;
  total_points: number;
  total_entries: number;
  last_check_in: string | null;
  level: number;
}

interface ChallengesContextType {
  dailyChallenge: Challenge | null;
  userChallenges: UserChallenge[];
  achievements: Achievement[];
  userStats: UserStats | null;
  refreshDailyChallenge: () => Promise<void>;
  completeChallenge: (challengeId: string, response: string) => Promise<void>;
  getAvailableChallenges: () => Promise<Challenge[]>;
}

const ChallengesContext = createContext<ChallengesContextType | undefined>(undefined);

export function ChallengesProvider({ children }: { children: React.ReactNode }) {
  const [dailyChallenge, setDailyChallenge] = useState<Challenge | null>(null);
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const { setLoading, showError } = useAppState();
  const { session } = useAuth();

  useEffect(() => {
    if (session?.user) {
      console.log('Session found, initializing challenges...');
      initializeChallenges();
      loadUserData();
    }
  }, [session]);

  const initializeChallenges = async () => {
    try {
      setLoading(true);
      console.log('Initializing challenges for user:', session?.user?.id);
      
      // Get daily challenge using the function
      const { data: challengeData, error: challengeError } = await supabase.rpc('get_daily_challenge', {
        p_user_id: session?.user?.id
      });

      if (challengeError) {
        console.error('Error getting daily challenge:', challengeError);
        return;
      }

      console.log('Daily challenge response:', {
        hasData: !!challengeData,
        dataLength: challengeData?.length,
        firstChallenge: challengeData?.[0]
      });

      if (challengeData && challengeData.length > 0) {
        setDailyChallenge(challengeData[0]);
      } else {
        setDailyChallenge(null);
      }

    } catch (error) {
      console.error('Error in initializeChallenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      
      // Load achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', session.user.id)
        .order('achieved_at', { ascending: false });

      if (achievementsError) throw achievementsError;
      setAchievements(achievementsData || []);

      // Calculate total points from achievements
      const totalPoints = achievementsData 
        ? achievementsData.reduce((sum, achievement) => sum + achievement.points, 0)
        : 0;

      // Update user stats
      const { data: updateResult, error: updateError } = await supabase
        .from('user_stats')
        .upsert({
          user_id: session.user.id,
          total_points: totalPoints,
          level: Math.floor(totalPoints / 100) + 1
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (updateError) throw updateError;
      setUserStats(updateResult);

      // Load user challenges
      const { data: challengesData, error: challengesError } = await supabase
        .from('user_challenges')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (challengesError) throw challengesError;
      setUserChallenges(challengesData || []);

    } catch (error) {
      console.error('Error loading user data:', error);
      showError(error instanceof Error ? error.message : 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const refreshDailyChallenge = async () => {
    if (!session?.user?.id) return;
    
    try {
      // Get daily challenge using the function
      const { data: challengeData, error: challengeError } = await supabase.rpc('get_daily_challenge', {
        p_user_id: session.user.id
      });

      if (challengeError) throw challengeError;
      
      if (challengeData && challengeData.length > 0) {
        setDailyChallenge(challengeData[0]);
      } else {
        setDailyChallenge(null);
      }

      // Refresh user stats
      const { data: statsData, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (statsError) throw statsError;
      setUserStats(statsData);
      
    } catch (error) {
      console.error('Error in refreshDailyChallenge:', error);
      showError(error instanceof Error ? error.message : 'Failed to refresh daily challenge');
    }
  };

  const completeChallenge = async (challengeId: string, response: string) => {
    if (!session?.user?.id) {
      throw new Error('You must be logged in to complete challenges');
    }

    try {
      const oldPoints = userStats?.total_points || 0;
      console.log('Starting challenge completion. Current points:', oldPoints);

      const { data, error } = await supabase.rpc('complete_challenge', {
        p_user_id: session.user.id,
        p_challenge_id: challengeId,
        p_response: response,
      });

      if (error) throw error;
      console.log('Challenge completion response:', data);

      // Refresh data to get updated stats
      await loadUserData();
      
      const newPoints = userStats?.total_points || 0;
      console.log(`Points update: ${oldPoints} -> ${newPoints} (change: ${newPoints - oldPoints})`);
      
    } catch (error) {
      console.error('Error completing challenge:', error);
      throw error;
    }
  };

  const getAvailableChallenges = async () => {
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('active', true)
        .order('points', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to load available challenges');
      return [];
    }
  };

  const value = {
    dailyChallenge,
    userChallenges,
    achievements,
    userStats,
    refreshDailyChallenge,
    completeChallenge,
    getAvailableChallenges,
  };

  return (
    <ChallengesContext.Provider value={value}>
      {children}
    </ChallengesContext.Provider>
  );
}

export function useChallenges() {
  const context = useContext(ChallengesContext);
  if (context === undefined) {
    throw new Error('useChallenges must be used within a ChallengesProvider');
  }
  return context;
} 