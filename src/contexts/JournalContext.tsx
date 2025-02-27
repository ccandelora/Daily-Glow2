import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAppState } from './AppStateContext';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';
import { getAllEmotions, Emotion } from '@/constants/emotions';
import { TimePeriod, getCurrentTimePeriod, isSameDay } from '@/utils/dateTime';
import { useCheckInStreak } from './CheckInStreakContext';

interface JournalEntry {
  id: string;
  date: Date;
  time_period: TimePeriod;
  initial_emotion: string;
  secondary_emotion: string;
  emotional_shift: number;
  gratitude: string;
  note?: string;
  user_id?: string;
  created_at: string;
}

interface DatabaseEntry extends Omit<JournalEntry, 'date'> {
  created_at: string;
}

interface JournalContextType {
  entries: JournalEntry[];
  addEntry: (initialEmotion: string, secondaryEmotion: string, gratitude: string, note?: string) => Promise<void>;
  getRecentEntries: (count: number) => JournalEntry[];
  getTodayEntries: () => JournalEntry[];
  getLatestEntryForPeriod: (period: TimePeriod) => JournalEntry | null;
  deleteAllEntries: () => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  deleteEntries: (ids: string[]) => Promise<void>;
}

const JournalContext = createContext<JournalContextType | undefined>(undefined);

export function JournalProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const { setLoading, showError, showSuccess } = useAppState();
  const { session } = useAuth();
  const { incrementStreak, refreshStreaks } = useCheckInStreak();

  useEffect(() => {
    if (session?.user) {
      loadEntries();
    } else {
      setEntries([]);
    }
  }, [session]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      
      // First check if the journal_entries table exists
      const { error: tableCheckError } = await supabase
        .from('journal_entries')
        .select('count')
        .limit(1);
      
      if (tableCheckError && tableCheckError.message.includes('relation "journal_entries" does not exist')) {
        console.log('Journal entries table does not exist yet');
        setEntries([]);
        return;
      }
      
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', session?.user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading entries:', error);
        throw new Error('Failed to load journal entries');
      }

      // Convert created_at to local timezone date
      setEntries(data.map((entry: DatabaseEntry) => {
        const date = new Date(entry.created_at);
        // Create date in local timezone using UTC components
        const localDate = new Date(Date.UTC(
          date.getUTCFullYear(),
          date.getUTCMonth(),
          date.getUTCDate(),
          date.getUTCHours(),
          date.getUTCMinutes(),
          date.getUTCSeconds()
        ));
        
        return {
          ...entry,
          date: localDate,
        };
      }));
    } catch (error) {
      console.error('Error in loadEntries:', error);
      // Don't show error to user if it's just that the table doesn't exist yet
      if (error instanceof Error && !error.message.includes('does not exist')) {
        showError(error.message || 'Failed to load journal entries');
      } else {
        // Just set empty entries if there's an error
        setEntries([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate emotional shift between -1 and 1
  const calculateEmotionalShift = (initialEmotion: string, secondaryEmotion: string): number => {
    const emotions = getAllEmotions();
    const initialIndex = emotions.findIndex((e: Emotion) => e.id === initialEmotion);
    const secondaryIndex = emotions.findIndex((e: Emotion) => e.id === secondaryEmotion);
    
    if (initialIndex === -1 || secondaryIndex === -1) return 0;
    
    // Calculate shift based on position in emotions array
    const shift = (secondaryIndex - initialIndex) / emotions.length;
    return Math.max(-1, Math.min(1, shift)); // Clamp between -1 and 1
  };

  const addEntry = async (initialEmotion: string, secondaryEmotion: string, gratitude: string, note?: string) => {
    if (!session?.user) {
      showError('You must be logged in to add entries');
      return;
    }

    const emotionalShift = calculateEmotionalShift(initialEmotion, secondaryEmotion);
    const timePeriod = getCurrentTimePeriod();
    
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .insert([
          {
            user_id: session.user.id,
            created_at: new Date().toISOString(),
            time_period: timePeriod,
            initial_emotion: initialEmotion,
            secondary_emotion: secondaryEmotion,
            emotional_shift: emotionalShift,
            gratitude,
            note,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      const newEntry: JournalEntry = {
        id: data.id,
        date: new Date(data.created_at),
        time_period: data.time_period,
        initial_emotion: data.initial_emotion,
        secondary_emotion: data.secondary_emotion,
        emotional_shift: data.emotional_shift,
        gratitude: data.gratitude,
        note: data.note,
        user_id: data.user_id,
        created_at: data.created_at,
      };

      setEntries(prev => [newEntry, ...prev]);
      
      // Make sure streak data is loaded before incrementing
      try {
        // Refresh streaks first to ensure we have the latest data
        await refreshStreaks();
        // Then increment streak for this time period
        await incrementStreak(timePeriod.toLowerCase() as 'morning' | 'afternoon' | 'evening');
      } catch (streakError) {
        console.error('Error updating streak:', streakError);
        // Continue with success message even if streak update fails
      }
      
      // Show success message
      showSuccess(`Check-in complete! Your ${timePeriod.toLowerCase()} streak continues.`);
    } catch (error) {
      showError('Failed to save journal entry');
      console.error('Error adding entry:', error);
    }
  };

  const getRecentEntries = (count: number) => {
    return entries.slice(0, count);
  };

  const getTodayEntries = () => {
    const today = new Date();
    return entries.filter(entry => isSameDay(entry.date, today));
  };

  const getLatestEntryForPeriod = (period: TimePeriod) => {
    const today = new Date();
    return entries.find(entry => 
      isSameDay(entry.date, today) && 
      entry.time_period === period
    ) || null;
  };

  const deleteAllEntries = async () => {
    if (!session?.user?.id) {
      showError('You must be logged in to delete entries');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error deleting entries:', error);
        throw new Error('Failed to delete entries');
      }
      
      setEntries([]);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to delete entries');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteEntry = async (id: string) => {
    if (!session?.user?.id) {
      showError('You must be logged in to delete entries');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error deleting entry:', error);
        throw new Error('Failed to delete entry');
      }
      
      setEntries(prev => prev.filter(entry => entry.id !== id));
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to delete entry');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteEntries = async (ids: string[]) => {
    if (!session?.user?.id) {
      showError('You must be logged in to delete entries');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .in('id', ids)
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error deleting entries:', error);
        throw new Error('Failed to delete entries');
      }
      
      setEntries(prev => prev.filter(entry => !ids.includes(entry.id)));
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to delete entries');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    entries,
    addEntry,
    getRecentEntries,
    getTodayEntries,
    getLatestEntryForPeriod,
    deleteAllEntries,
    deleteEntry,
    deleteEntries,
  };

  return (
    <JournalContext.Provider value={value}>
      {children}
    </JournalContext.Provider>
  );
}

export function useJournal() {
  const context = useContext(JournalContext);
  if (context === undefined) {
    throw new Error('useJournal must be used within a JournalProvider');
  }
  return context;
} 