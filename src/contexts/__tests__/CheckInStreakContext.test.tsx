import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { CheckInStreakProvider, useCheckInStreak, CheckInStreak } from '@/contexts/CheckInStreakContext';
import { supabase } from '@/lib/supabase';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppStateProvider } from '@/contexts/AppStateContext';

// Mock the supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      insert: jest.fn(() => ({
        eq: jest.fn(),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(),
      })),
    })),
  },
}));

// Mock the AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn().mockReturnValue({
    user: { id: 'test-user-id' },
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock the AppStateContext
jest.mock('@/contexts/AppStateContext', () => ({
  useAppState: jest.fn().mockReturnValue({
    showError: jest.fn(),
    showSuccess: jest.fn(),
  }),
  AppStateProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Test component that uses the CheckInStreakContext
const TestComponent = () => {
  const { streaks, incrementStreak, refreshStreaks } = useCheckInStreak();
  
  return (
    <>
      <Text testID="morning-streak">{streaks.morning}</Text>
      <Text testID="afternoon-streak">{streaks.afternoon}</Text>
      <Text testID="evening-streak">{streaks.evening}</Text>
      <Text testID="increment-morning" onPress={() => incrementStreak('morning')}>Increment Morning</Text>
      <Text testID="increment-afternoon" onPress={() => incrementStreak('afternoon')}>Increment Afternoon</Text>
      <Text testID="increment-evening" onPress={() => incrementStreak('evening')}>Increment Evening</Text>
      <Text testID="refresh-streaks" onPress={() => refreshStreaks()}>Refresh Streaks</Text>
    </>
  );
};

describe('CheckInStreakContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with default streak values', async () => {
    // Mock the supabase response for initial fetch
    const mockSingle = jest.fn().mockResolvedValue({
      data: null,
      error: { code: 'PGRST116' },
    });
    
    const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    
    // Mock the insert response for creating a new streak record
    const mockInsertEq = jest.fn().mockResolvedValue({
      data: null,
      error: null,
    });
    const mockInsert = jest.fn().mockReturnValue({ eq: mockInsertEq });
    
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === 'user_streaks') {
        return {
          select: mockSelect,
          insert: mockInsert,
        };
      }
      return { select: mockSelect };
    });

    const { getByTestId } = render(
      <AppStateProvider>
        <AuthProvider>
          <CheckInStreakProvider>
            <TestComponent />
          </CheckInStreakProvider>
        </AuthProvider>
      </AppStateProvider>
    );

    // Wait for the async operations to complete
    await waitFor(() => {
      expect(getByTestId('morning-streak').props.children).toBe(0);
      expect(getByTestId('afternoon-streak').props.children).toBe(0);
      expect(getByTestId('evening-streak').props.children).toBe(0);
    });
  });

  it('fetches existing streak data from supabase', async () => {
    // Mock the supabase response for existing data
    const mockSingle = jest.fn().mockResolvedValue({
      data: {
        morning_streak: 5,
        afternoon_streak: 3,
        evening_streak: 7,
        last_morning_check_in: '2023-01-01',
        last_afternoon_check_in: '2023-01-01',
        last_evening_check_in: '2023-01-01',
      },
      error: null,
    });
    
    const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    
    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: mockSelect,
    }));

    const { getByTestId } = render(
      <AppStateProvider>
        <AuthProvider>
          <CheckInStreakProvider>
            <TestComponent />
          </CheckInStreakProvider>
        </AuthProvider>
      </AppStateProvider>
    );

    // Wait for the async operations to complete
    await waitFor(() => {
      expect(getByTestId('morning-streak').props.children).toBe(5);
      expect(getByTestId('afternoon-streak').props.children).toBe(3);
      expect(getByTestId('evening-streak').props.children).toBe(7);
    });
  });

  it('increments streak when incrementStreak is called', async () => {
    // Mock the initial fetch
    const mockInitialSingle = jest.fn().mockResolvedValue({
      data: {
        morning_streak: 5,
        afternoon_streak: 3,
        evening_streak: 7,
        last_morning_check_in: '2023-01-01',
        last_afternoon_check_in: '2023-01-01',
        last_evening_check_in: '2023-01-01',
      },
      error: null,
    });
    
    const mockInitialEq = jest.fn().mockReturnValue({ single: mockInitialSingle });
    const mockInitialSelect = jest.fn().mockReturnValue({ eq: mockInitialEq });
    
    // Mock the streak increment fetch
    const mockIncrementSingle = jest.fn().mockResolvedValue({
      data: {
        morning_streak: 5,
        afternoon_streak: 3,
        evening_streak: 7,
        last_morning_check_in: '2023-01-01',
        last_afternoon_check_in: '2023-01-01',
        last_evening_check_in: '2023-01-01',
      },
      error: null,
    });
    
    const mockIncrementEq = jest.fn().mockReturnValue({ single: mockIncrementSingle });
    const mockIncrementSelect = jest.fn().mockReturnValue({ eq: mockIncrementEq });
    
    // Mock the update response
    const mockUpdateEq = jest.fn().mockResolvedValue({
      data: null,
      error: null,
    });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockUpdateEq });
    
    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: mockInitialSelect,
      update: mockUpdate
    }));

    const { getByTestId } = render(
      <AppStateProvider>
        <AuthProvider>
          <CheckInStreakProvider>
            <TestComponent />
          </CheckInStreakProvider>
        </AuthProvider>
      </AppStateProvider>
    );

    // Wait for initial render
    await waitFor(() => {
      expect(getByTestId('morning-streak').props.children).toBe(5);
    });

    // Reset mocks for the next call
    (supabase.from as jest.Mock).mockClear();
    
    // Mock for the increment call
    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: mockIncrementSelect,
      update: mockUpdate
    }));

    // Increment morning streak
    await act(async () => {
      getByTestId('increment-morning').props.onPress();
    });

    // Verify that the supabase update was called correctly
    expect(supabase.from).toHaveBeenCalledWith('user_streaks');
    expect(mockUpdate).toHaveBeenCalled();
  });

  it('calls onStreakUpdated callback when provided', async () => {
    const mockOnStreakUpdated = jest.fn();

    // Mock the initial fetch
    const mockSingle = jest.fn().mockResolvedValue({
      data: {
        morning_streak: 5,
        afternoon_streak: 3,
        evening_streak: 7,
        last_morning_check_in: '2023-01-01',
        last_afternoon_check_in: '2023-01-01',
        last_evening_check_in: '2023-01-01',
      },
      error: null,
    });
    
    const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    
    // Mock the update response
    const mockUpdateEq = jest.fn().mockResolvedValue({
      data: null,
      error: null,
    });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockUpdateEq });
    
    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: mockSelect,
      update: mockUpdate
    }));

    const { getByTestId } = render(
      <AppStateProvider>
        <AuthProvider>
          <CheckInStreakProvider onStreakUpdated={mockOnStreakUpdated}>
            <TestComponent />
          </CheckInStreakProvider>
        </AuthProvider>
      </AppStateProvider>
    );

    // Wait for initial render
    await waitFor(() => {
      expect(getByTestId('morning-streak')).toBeTruthy();
    });

    // Increment morning streak
    await act(async () => {
      getByTestId('increment-morning').props.onPress();
    });

    // Verify that the callback was called
    expect(mockOnStreakUpdated).toHaveBeenCalled();
  });

  it('refreshes streaks when refreshStreaks is called', async () => {
    // Mock the initial fetch
    const mockInitialSingle = jest.fn().mockResolvedValue({
      data: {
        morning_streak: 5,
        afternoon_streak: 3,
        evening_streak: 7,
        last_morning_check_in: '2023-01-01',
        last_afternoon_check_in: '2023-01-01',
        last_evening_check_in: '2023-01-01',
      },
      error: null,
    });
    
    const mockInitialEq = jest.fn().mockReturnValue({ single: mockInitialSingle });
    const mockInitialSelect = jest.fn().mockReturnValue({ eq: mockInitialEq });
    
    // Mock the refresh fetch with updated values
    const mockRefreshSingle = jest.fn().mockResolvedValue({
      data: {
        morning_streak: 6,
        afternoon_streak: 4,
        evening_streak: 8,
        last_morning_check_in: '2023-01-02',
        last_afternoon_check_in: '2023-01-02',
        last_evening_check_in: '2023-01-02',
      },
      error: null,
    });
    
    const mockRefreshEq = jest.fn().mockReturnValue({ single: mockRefreshSingle });
    const mockRefreshSelect = jest.fn().mockReturnValue({ eq: mockRefreshEq });
    
    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: mockInitialSelect
    }));

    const { getByTestId } = render(
      <AppStateProvider>
        <AuthProvider>
          <CheckInStreakProvider>
            <TestComponent />
          </CheckInStreakProvider>
        </AuthProvider>
      </AppStateProvider>
    );

    // Wait for initial render
    await waitFor(() => {
      expect(getByTestId('morning-streak').props.children).toBe(5);
    });

    // Reset the mock to track new calls
    (supabase.from as jest.Mock).mockClear();
    
    // Mock for the refresh call
    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: mockRefreshSelect
    }));
    
    // Refresh streaks
    await act(async () => {
      getByTestId('refresh-streaks').props.onPress();
    });

    // Verify that supabase was called again
    expect(supabase.from).toHaveBeenCalledWith('user_streaks');
  });

  it('handles errors when fetching streaks', async () => {
    // Mock the supabase response with an error
    const mockSingle = jest.fn().mockResolvedValue({
      data: null,
      error: { code: 'SOME_ERROR', message: 'Database error' },
    });
    
    const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    
    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: mockSelect
    }));

    console.error = jest.fn(); // Mock console.error to prevent test output noise

    render(
      <AppStateProvider>
        <AuthProvider>
          <CheckInStreakProvider>
            <TestComponent />
          </CheckInStreakProvider>
        </AuthProvider>
      </AppStateProvider>
    );

    // Wait for the error to be logged
    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
    });
  });
  
  it('creates streak record when no record exists and handles duplicate key error', async () => {
    // First return no record exists error, then on second call return duplicate key error
    const mockSingleNoRecord = jest.fn().mockResolvedValue({
      data: null,
      error: { code: 'PGRST116' }, // No record found error
    });
    
    const mockInsertDuplicateError = jest.fn().mockResolvedValue({
      data: null,
      error: { code: '23505' }, // Duplicate key error
    });
    
    const mockEq = jest.fn().mockReturnValue({ single: mockSingleNoRecord });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    const mockInsert = jest.fn().mockReturnValue(mockInsertDuplicateError);
    
    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: mockSelect,
      insert: mockInsert
    }));

    console.log = jest.fn(); // Mock console.log to track messages

    render(
      <AppStateProvider>
        <AuthProvider>
          <CheckInStreakProvider>
            <TestComponent />
          </CheckInStreakProvider>
        </AuthProvider>
      </AppStateProvider>
    );

    // Verify that the correct console message was logged
    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith('Streak record already exists, fetching it instead');
    });
  });
  
  it('handles errors when creating streak record', async () => {
    // First return no record exists error
    const mockSingleNoRecord = jest.fn().mockResolvedValue({
      data: null,
      error: { code: 'PGRST116' }, // No record found error
    });
    
    // Then return a non-duplicate error when inserting
    const mockInsertError = jest.fn().mockResolvedValue({
      data: null,
      error: { code: 'OTHER_ERROR', message: 'Insert failed' },
    });
    
    const mockEq = jest.fn().mockReturnValue({ single: mockSingleNoRecord });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    const mockInsert = jest.fn().mockReturnValue(mockInsertError);
    
    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: mockSelect,
      insert: mockInsert
    }));

    console.error = jest.fn(); // Mock console.error to track error messages

    render(
      <AppStateProvider>
        <AuthProvider>
          <CheckInStreakProvider>
            <TestComponent />
          </CheckInStreakProvider>
        </AuthProvider>
      </AppStateProvider>
    );

    // Verify that the error was properly logged
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Error creating streak record:', expect.any(Object));
    });
  });
  
  it('handles incrementStreak with no existing streak record', async () => {
    // Mock initial fetch to return no record error
    const mockSingleNoRecord = jest.fn().mockResolvedValue({
      data: null,
      error: { code: 'PGRST116' },
    });
    
    // Mock insert response for creating a new streak record with initial values
    const mockInsertSuccess = jest.fn().mockResolvedValue({
      data: null,
      error: null,
    });
    
    const mockEq = jest.fn().mockReturnValue({ single: mockSingleNoRecord });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    const mockInsert = jest.fn().mockReturnValue(mockInsertSuccess);
    
    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: mockSelect,
      insert: mockInsert
    }));

    const { getByTestId } = render(
      <AppStateProvider>
        <AuthProvider>
          <CheckInStreakProvider>
            <TestComponent />
          </CheckInStreakProvider>
        </AuthProvider>
      </AppStateProvider>
    );

    // Reset mocks for the next call
    (supabase.from as jest.Mock).mockClear();
    mockSelect.mockClear();
    mockInsert.mockClear();
    
    // Increment streak - should try to create a new record when none exists
    await act(async () => {
      getByTestId('increment-morning').props.onPress();
    });

    // Verify that insert was called after select found no record
    await waitFor(() => {
      expect(mockSelect).toHaveBeenCalled();
      expect(mockInsert).toHaveBeenCalled();
    });
  });

  it('shows success message for milestone streak values', async () => {
    // Mock the useAppState hook to track showSuccess calls
    const mockShowSuccess = jest.fn();
    require('@/contexts/AppStateContext').useAppState.mockReturnValue({
      showError: jest.fn(),
      showSuccess: mockShowSuccess,
    });
    
    // Mock streak data with a value that will become a milestone (7)
    const mockSingle = jest.fn().mockResolvedValue({
      data: {
        morning_streak: 6, // One less than milestone 7
        afternoon_streak: 3,
        evening_streak: 7,
        last_morning_check_in: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        last_afternoon_check_in: '2023-01-01',
        last_evening_check_in: '2023-01-01',
      },
      error: null,
    });
    
    const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    
    // Mock the update response
    const mockUpdateEq = jest.fn().mockResolvedValue({
      data: null,
      error: null,
    });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockUpdateEq });
    
    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: mockSelect,
      update: mockUpdate
    }));

    const { getByTestId } = render(
      <AppStateProvider>
        <AuthProvider>
          <CheckInStreakProvider>
            <TestComponent />
          </CheckInStreakProvider>
        </AuthProvider>
      </AppStateProvider>
    );

    // Increment morning streak (should become 7, a milestone)
    await act(async () => {
      getByTestId('increment-morning').props.onPress();
    });

    // Verify that showSuccess was called with a milestone message
    expect(mockShowSuccess).toHaveBeenCalledWith('🔥 7 day morning streak achieved!');
  });

  it('handles user being null', async () => {
    // Mock user as null
    require('@/contexts/AuthContext').useAuth.mockReturnValueOnce({
      user: null,
    });
    
    const mockSelect = jest.fn();
    const mockInsert = jest.fn();
    
    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: mockSelect,
      insert: mockInsert
    }));

    render(
      <AppStateProvider>
        <AuthProvider>
          <CheckInStreakProvider>
            <TestComponent />
          </CheckInStreakProvider>
        </AuthProvider>
      </AppStateProvider>
    );

    // Verify that supabase was not called because user is null
    expect(mockSelect).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('keeps the current streak when checking in on the same day', async () => {
    // Current date for the test
    const today = new Date();
    const todayISOString = today.toISOString();
    
    // Mock streak data with today as the last check-in
    const mockSingle = jest.fn().mockResolvedValue({
      data: {
        morning_streak: 3,
        afternoon_streak: 2,
        evening_streak: 1,
        last_morning_check_in: todayISOString, // Today
        last_afternoon_check_in: todayISOString,
        last_evening_check_in: '2023-01-01',
      },
      error: null,
    });
    
    const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    
    // Mock the update response
    const mockUpdateEq = jest.fn().mockResolvedValue({
      data: null,
      error: null,
    });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockUpdateEq });
    
    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: mockSelect,
      update: mockUpdate
    }));

    const { getByTestId } = render(
      <AppStateProvider>
        <AuthProvider>
          <CheckInStreakProvider>
            <TestComponent />
          </CheckInStreakProvider>
        </AuthProvider>
      </AppStateProvider>
    );

    // Increment morning streak again on the same day
    await act(async () => {
      getByTestId('increment-morning').props.onPress();
    });

    // Verify that update was called with the same streak value (not incremented)
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      morning_streak: 3, // Same value, not incremented
      last_morning_check_in: expect.any(String)
    }));
  });

  it('handles errors during incrementStreak', async () => {
    // Mock streak data
    const mockSingle = jest.fn().mockResolvedValue({
      data: {
        morning_streak: 5,
        afternoon_streak: 3,
        evening_streak: 7,
        last_morning_check_in: '2023-01-01',
        last_afternoon_check_in: '2023-01-01',
        last_evening_check_in: '2023-01-01',
      },
      error: null,
    });
    
    const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    
    // Mock the update response with an error
    const mockUpdateEq = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Update failed' },
    });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockUpdateEq });
    
    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: mockSelect,
      update: mockUpdate
    }));

    console.error = jest.fn(); // Mock console.error to check if errors are logged

    const { getByTestId } = render(
      <AppStateProvider>
        <AuthProvider>
          <CheckInStreakProvider>
            <TestComponent />
          </CheckInStreakProvider>
        </AuthProvider>
      </AppStateProvider>
    );

    // Attempt to increment streak
    await act(async () => {
      getByTestId('increment-morning').props.onPress();
    });

    // Verify that the error was logged
    expect(console.error).toHaveBeenCalledWith('Error updating streak:', expect.any(Object));
  });
}); 