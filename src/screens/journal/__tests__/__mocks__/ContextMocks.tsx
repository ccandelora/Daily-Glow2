/**
 * Mock implementations for various context providers used in tests
 * These are centralized here to allow for consistent mocking across test files
 */

// Mock JournalContext
export const mockAddEntry = jest.fn();
export const mockGetLatestEntryForPeriod = jest.fn();
export const mockGetTodayEntries = jest.fn();
export const mockJournalEntries = [
  {
    id: 'test-entry-id',
    date: new Date('2023-05-15T10:00:00'),
    time_period: 'MORNING',
    initial_emotion: 'happy',
    secondary_emotion: 'excited',
    emotional_shift: 0.2,
    gratitude: 'I am grateful for my health',
    note: 'Today is a good day',
    user_id: 'user1',
    created_at: '2023-05-15T10:00:00',
  },
  {
    id: 'test-entry-id-2',
    date: new Date('2023-05-16T16:00:00'),
    time_period: 'AFTERNOON',
    initial_emotion: 'calm',
    secondary_emotion: 'sad',
    emotional_shift: -0.1,
    gratitude: 'I am grateful for this test',
    note: 'Another test',
    user_id: 'user1',
    created_at: '2023-05-16T16:00:00',
  },
  {
    id: 'test-entry-id-3',
    date: new Date('2023-05-17T20:00:00'),
    time_period: 'EVENING',
    initial_emotion: 'relaxed',
    secondary_emotion: 'content',
    emotional_shift: 0.5,
    gratitude: 'I am grateful for sleep',
    note: '',
    user_id: 'user1',
    created_at: '2023-05-17T20:00:00',
  }
];

export const mockJournalContext = {
  entries: mockJournalEntries,
  addEntry: mockAddEntry,
  getLatestEntryForPeriod: mockGetLatestEntryForPeriod,
  getTodayEntries: mockGetTodayEntries,
  loading: false,
  error: null,
  fetchEntries: jest.fn(),
  deleteEntry: jest.fn(),
  filterEntries: jest.fn(entries => entries), // Default implementation returns unfiltered
  searchEntries: jest.fn(entries => entries), // Default implementation returns unfiltered
};

// Mock AppStateContext
export const mockShowError = jest.fn();
export const mockShowSuccess = jest.fn();

export const mockAppStateContext = {
  showError: mockShowError,
  showSuccess: mockShowSuccess,
  isDarkMode: false,
  setDarkMode: jest.fn(),
  isLoading: false,
  setIsLoading: jest.fn(),
};

// Mock useRouter from expo-router
export const mockRouterBack = jest.fn();
export const mockNavigate = jest.fn();

export const mockRouter = {
  back: mockRouterBack,
  navigate: mockNavigate,
  push: jest.fn(),
  replace: jest.fn(),
  setParams: jest.fn(),
};

// Mock useLocalSearchParams from expo-router
export const mockSearchParams = {
  id: 'test-entry-id',
};

// Export convenience setup functions
export const setupJournalContextMock = (overrides = {}) => {
  return {
    ...mockJournalContext,
    ...overrides,
  };
};

export const setupAppStateContextMock = (overrides = {}) => {
  return {
    ...mockAppStateContext,
    ...overrides,
  };
};

export const setupRouterMock = (overrides = {}) => {
  return {
    ...mockRouter,
    ...overrides,
  };
};

export const setupSearchParamsMock = (overrides = {}) => {
  return {
    ...mockSearchParams,
    ...overrides,
  };
}; 