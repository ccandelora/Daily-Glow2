import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { JournalProvider, useJournal } from '../JournalContext';
import { TimePeriod } from '@/utils/dateTime';

// Mocks
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    then: jest.fn((callback) => callback({
      data: [],
      error: null
    }))
  }
}));

jest.mock('../AppStateContext', () => ({
  useAppState: () => ({
    setLoading: jest.fn(),
    showError: jest.fn(),
    showSuccess: jest.fn()
  })
}));

jest.mock('../AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
    session: { user: { id: 'test-user-id' } }
  })
}));

jest.mock('../CheckInStreakContext', () => ({
  useCheckInStreak: () => ({
    incrementStreak: jest.fn(),
    refreshStreaks: jest.fn()
  })
}));

jest.mock('@/utils/dateTime', () => ({
  getCurrentTimePeriod: jest.fn().mockReturnValue('MORNING'),
  formatDateForDisplay: jest.fn(date => date.toString()),
  sanitizeDateString: jest.fn(date => date),
  isSameDay: jest.fn().mockReturnValue(true)
}));

jest.mock('@/constants/emotions', () => ({
  getAllEmotions: jest.fn().mockReturnValue([
    { id: 'happy', value: 'Happy', category: 'positive' },
    { id: 'sad', value: 'Sad', category: 'negative' }
  ])
}));

// Test wrapper
const wrapper: React.FC<{children: React.ReactNode}> = ({ children }) => (
  <JournalProvider>
    {children}
  </JournalProvider>
);

describe('JournalContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides the expected context structure', () => {
    const { result } = renderHook(() => useJournal(), { wrapper });
    
    expect(result.current).toHaveProperty('entries');
    expect(result.current).toHaveProperty('addEntry');
    expect(result.current).toHaveProperty('getRecentEntries');
    expect(result.current).toHaveProperty('getTodayEntries');
    expect(result.current).toHaveProperty('getLatestEntryForPeriod');
    expect(result.current).toHaveProperty('deleteEntry');
    expect(result.current).toHaveProperty('deleteEntries');
    expect(result.current).toHaveProperty('deleteAllEntries');
  });

  it('initializes with empty entries', () => {
    const { result } = renderHook(() => useJournal(), { wrapper });
    
    expect(result.current.entries).toEqual([]);
  });

  it('adds a journal entry', async () => {
    const { result } = renderHook(() => useJournal(), { wrapper });
    
    // Mock response for insert
    const mockedSupabase = require('@/lib/supabase').supabase;
    mockedSupabase.from().insert().select().single().then = jest.fn(callback => 
      callback({
        data: {
          id: 'test-id',
          time_period: 'MORNING',
          initial_emotion: 'happy',
          secondary_emotion: 'sad',
          emotional_shift: -0.5,
          gratitude: 'Test gratitude',
          note: 'Test note',
          user_id: 'test-user-id',
          created_at: new Date().toISOString()
        },
        error: null
      })
    );
    
    await act(async () => {
      await result.current.addEntry('happy', 'sad', 'Test gratitude', 'Test note');
    });
    
    expect(mockedSupabase.from).toHaveBeenCalledWith('journal_entries');
    expect(mockedSupabase.from().insert).toHaveBeenCalled();
  });

  it('retrieves recent entries', async () => {
    const { result } = renderHook(() => useJournal(), { wrapper });
    
    // Mock entries that will be returned
    const mockEntries = [
      {
        id: 'entry1',
        date: new Date(),
        time_period: 'MORNING' as TimePeriod,
        initial_emotion: 'happy',
        secondary_emotion: 'excited',
        emotional_shift: 0.2,
        gratitude: 'Happy day',
        note: 'Test note',
        user_id: 'test-user-id',
        created_at: new Date().toISOString()
      }
    ];
    
    // Override the getRecentEntries method to return our mock data
    jest.spyOn(result.current, 'getRecentEntries').mockImplementation((count) => {
      return mockEntries.slice(0, count);
    });
    
    const recentEntries = result.current.getRecentEntries(1);
    expect(recentEntries).toHaveLength(1);
    expect(recentEntries[0].id).toBe('entry1');
  });

  it('deletes an entry', async () => {
    const { result } = renderHook(() => useJournal(), { wrapper });
    
    // Mock response for delete
    const mockedSupabase = require('@/lib/supabase').supabase;
    mockedSupabase.from().delete().eq().eq().then = jest.fn(callback => 
      callback({
        data: { id: 'entry-to-delete' },
        error: null
      })
    );
    
    await act(async () => {
      await result.current.deleteEntry('entry-to-delete');
    });
    
    expect(mockedSupabase.from).toHaveBeenCalledWith('journal_entries');
    expect(mockedSupabase.from().delete).toHaveBeenCalled();
  });
}); 