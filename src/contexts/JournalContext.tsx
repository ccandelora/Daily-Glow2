import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAppState } from './AppStateContext';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';

interface JournalEntry {
  id: string;
  date: Date;
  mood: 'great' | 'good' | 'okay' | 'bad';
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
  addEntry: (mood: JournalEntry['mood'], gratitude: string, note?: string) => Promise<JournalEntry>;
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

  const addEntry = async (mood: JournalEntry['mood'], gratitude: string, note?: string) => {
    if (!session?.user?.id) {
      throw new Error('You must be logged in to add entries');
    }

    try {
      setLoading(true);
      const newEntry = {
        mood,
        gratitude,
        note,
        user_id: session.user.id,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('journal_entries')
        .insert(newEntry)
        .select('id, created_at, user_id, mood, gratitude, note')
        .single();

      if (error) {
        console.error('Error adding entry:', error);
        throw new Error('Failed to add journal entry');
      }

      if (!data) {
        throw new Error('No data returned after inserting entry');
      }

      const formattedEntry: JournalEntry = {
        ...data,
        date: new Date(data.created_at),
      };

      setEntries(prev => [formattedEntry, ...prev]);
      return formattedEntry;
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to add journal entry');
      throw error;
    } finally {
      setLoading(false);
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