import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAppState } from './AppStateContext';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';
import { getAllEmotions, Emotion } from '@/constants/emotions';

interface JournalEntry {
  id: string;
  date: Date;
  initialEmotion: string;
  postGratitudeEmotion: string;
  emotionalShift: number; // -1 to 1, representing negative to positive shift
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
  addEntry: (initialEmotion: string, postEmotion: string, gratitude: string, note?: string) => Promise<void>;
  getRecentEntries: (count: number) => JournalEntry[];
  getTodayEntry: () => JournalEntry | null;
  deleteAllEntries: () => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  deleteEntries: (ids: string[]) => Promise<void>;
}

const JournalContext = createContext<JournalContextType | undefined>(undefined);

export function JournalProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const { setLoading, showError } = useAppState();
  const { session } = useAuth();

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
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', session?.user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading entries:', error);
        throw new Error('Failed to load journal entries');
      }

      setEntries(data.map((entry: DatabaseEntry) => ({
        ...entry,
        date: new Date(entry.created_at),
      })));
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to load journal entries');
    } finally {
      setLoading(false);
    }
  };

  // Calculate emotional shift between -1 and 1
  const calculateEmotionalShift = (initialEmotion: string, postEmotion: string): number => {
    const emotions = getAllEmotions();
    const initialIndex = emotions.findIndex((e: Emotion) => e.id === initialEmotion);
    const postIndex = emotions.findIndex((e: Emotion) => e.id === postEmotion);
    
    if (initialIndex === -1 || postIndex === -1) return 0;
    
    // Calculate shift based on position in emotions array
    const shift = (postIndex - initialIndex) / emotions.length;
    return Math.max(-1, Math.min(1, shift)); // Clamp between -1 and 1
  };

  const addEntry = async (initialEmotion: string, postEmotion: string, gratitude: string, note?: string) => {
    if (!session?.user) {
      showError('You must be logged in to add entries');
      return;
    }

    const emotionalShift = calculateEmotionalShift(initialEmotion, postEmotion);
    
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .insert([
          {
            user_id: session.user.id,
            created_at: new Date().toISOString(),
            initial_emotion: initialEmotion,
            post_gratitude_emotion: postEmotion,
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
        initialEmotion: data.initial_emotion,
        postGratitudeEmotion: data.post_gratitude_emotion,
        emotionalShift: data.emotional_shift,
        gratitude: data.gratitude,
        note: data.note,
        user_id: data.user_id,
        created_at: data.created_at,
      };

      setEntries(prev => [newEntry, ...prev]);
    } catch (error) {
      showError('Failed to save journal entry');
      console.error('Error adding entry:', error);
    }
  };

  const getRecentEntries = (count: number) => {
    return entries.slice(0, count);
  };

  const getTodayEntry = () => {
    const today = new Date();
    return entries.find(entry => 
      entry.date.toDateString() === today.toDateString()
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
    getTodayEntry,
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