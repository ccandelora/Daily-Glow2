import React from 'react';

// Mock data
const mockJournalEntries = [
  {
    id: '1',
    date: new Date('2023-06-01T08:00:00Z'),
    time_period: 'MORNING',
    initial_emotion: 'happy',
    secondary_emotion: 'neutral',
    emotional_shift: -0.33,
    gratitude: 'I am grateful for the sunshine',
    note: 'It was a good morning',
    user_id: 'test-user-id',
    created_at: '2023-06-01T08:00:00Z',
  },
  {
    id: '2',
    date: new Date('2023-05-31T20:00:00Z'),
    time_period: 'EVENING',
    initial_emotion: 'sad',
    secondary_emotion: 'happy',
    emotional_shift: 0.67,
    gratitude: 'I am grateful for my family',
    note: 'End of a challenging day',
    user_id: 'test-user-id',
    created_at: '2023-05-31T20:00:00Z',
  },
];

// Mock implementations
export const mockAddEntry = jest.fn().mockResolvedValue(undefined);
export const mockGetRecentEntries = jest.fn().mockImplementation((count) => mockJournalEntries.slice(0, count));
export const mockGetTodayEntries = jest.fn().mockReturnValue(mockJournalEntries);
export const mockGetLatestEntryForPeriod = jest.fn().mockImplementation((period) => 
  mockJournalEntries.find(entry => entry.time_period === period) || null
);
export const mockDeleteAllEntries = jest.fn().mockResolvedValue(undefined);
export const mockDeleteEntry = jest.fn().mockResolvedValue(undefined);
export const mockDeleteEntries = jest.fn().mockResolvedValue(undefined);

// Mock useJournal hook
export const useJournal = jest.fn().mockReturnValue({
  entries: mockJournalEntries,
  addEntry: mockAddEntry,
  getRecentEntries: mockGetRecentEntries,
  getTodayEntries: mockGetTodayEntries,
  getLatestEntryForPeriod: mockGetLatestEntryForPeriod,
  deleteAllEntries: mockDeleteAllEntries,
  deleteEntry: mockDeleteEntry,
  deleteEntries: mockDeleteEntries,
  isLoading: false,
});

// Mock JournalProvider component
export const JournalProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>; 