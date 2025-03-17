import React from 'react';
import { render, act, waitFor, renderHook } from '@testing-library/react-native';
import { Text } from 'react-native';
import { CheckInStreakProvider, useCheckInStreak, CheckInStreak } from '@/contexts/CheckInStreakContext';
import { supabase } from '@/lib/supabase';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppStateProvider } from '@/contexts/AppStateContext';

// Mock the supabase client
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();
const mockInsert = jest.fn();
const mockUpdate = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: mockEq.mockReturnValue({
          single: mockSingle
        })
      })),
      insert: mockInsert.mockReturnValue({
        eq: mockEq
      }),
      update: mockUpdate.mockReturnValue({
        eq: mockEq
      })
    }))
  }
}));

// Mock AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: { id: 'test-user-id' }
  })),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

// Mock AppStateContext
jest.mock('@/contexts/AppStateContext', () => ({
  useAppState: jest.fn(() => ({
    showError: jest.fn(),
    showSuccess: jest.fn()
  })),
  AppStateProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

// Define the context type interface since it's not exported from the context file
interface CheckInStreakContextType {
  streaks: CheckInStreak;
  incrementStreak: (period: 'morning' | 'afternoon' | 'evening') => Promise<void>;
  refreshStreaks: () => Promise<void>;
  onStreakUpdated?: (streaks: CheckInStreak, isFirstCheckIn: boolean, allPeriodsCompleted: boolean) => void;
}

// Test component that uses the streak context
interface TestComponentProps {
  onContextUpdate?: (context: CheckInStreakContextType) => void;
}

const TestComponent = ({ onContextUpdate }: TestComponentProps) => {
  const streakContext = useCheckInStreak();
  
  // Pass the context to the parent for direct access
  React.useEffect(() => {
    if (onContextUpdate) {
      onContextUpdate(streakContext);
    }
  }, [streakContext, onContextUpdate]);
  
  return (
    <Text testID="test-component">
      {JSON.stringify({
        streaks: streakContext.streaks
      })}
    </Text>
  );
};

describe('CheckInStreakContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides initial streak values', async () => {
    mockSingle.mockResolvedValueOnce({
      data: {
        morning_streak: 5,
        afternoon_streak: 3,
        evening_streak: 2,
        last_morning_check_in: '2024-01-01',
        last_afternoon_check_in: '2024-01-01',
        last_evening_check_in: '2024-01-01'
      },
      error: null
    });

    const { getByTestId } = render(
      <CheckInStreakProvider>
        <TestComponent />
      </CheckInStreakProvider>
    );

    await waitFor(() => {
      const component = getByTestId('test-component');
      const data = JSON.parse(component.props.children);
      expect(data.streaks.morning).toBe(5);
      expect(data.streaks.afternoon).toBe(3);
      expect(data.streaks.evening).toBe(2);
    });
  });

  it('creates new streak record if none exists', async () => {
    // First call returns no record
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116' }
    });

    // Second call for insert succeeds
    mockInsert.mockResolvedValueOnce({
      error: null
    });

    const { getByTestId } = render(
      <CheckInStreakProvider>
        <TestComponent />
      </CheckInStreakProvider>
    );

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith([{
        user_id: 'test-user-id',
        morning_streak: 0,
        afternoon_streak: 0,
        evening_streak: 0
      }]);
    });
  });

  it('handles duplicate key error when creating streak record', async () => {
    // First call returns no record
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116' }
    });

    // Insert fails with duplicate key
    mockInsert.mockResolvedValueOnce({
      error: { code: '23505' }
    });

    // Subsequent fetch succeeds
    mockSingle.mockResolvedValueOnce({
      data: {
        morning_streak: 1,
        afternoon_streak: 1,
        evening_streak: 1
      },
      error: null
    });

    const { getByTestId } = render(
      <CheckInStreakProvider>
        <TestComponent />
      </CheckInStreakProvider>
    );

    await waitFor(() => {
      const component = getByTestId('test-component');
      const data = JSON.parse(component.props.children);
      expect(data.streaks.morning).toBe(1);
    });
  });

  describe('incrementStreak', () => {
    it('increments streak when last check-in was yesterday', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Mock current streaks fetch
      mockSingle.mockResolvedValueOnce({
        data: {
          morning_streak: 3,
          last_morning_check_in: yesterday.toISOString()
        },
        error: null
      });

      // Mock streak update
      mockUpdate.mockResolvedValueOnce({
        error: null
      });

      let contextValue: CheckInStreakContextType | null = null;
      
      render(
        <CheckInStreakProvider>
          <TestComponent onContextUpdate={(context: CheckInStreakContextType) => { contextValue = context; }} />
        </CheckInStreakProvider>
      );

      // Wait for context to be passed
      await waitFor(() => expect(contextValue).not.toBeNull());

      // Call incrementStreak
      await act(async () => {
        await contextValue!.incrementStreak('morning');
      });

      // Verify streak was incremented
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          morning_streak: 4
        })
      );
    });

    it('maintains streak when checking in same day', async () => {
      const today = new Date().toISOString();
      
      // Mock current streaks fetch
      mockSingle.mockResolvedValueOnce({
        data: {
          morning_streak: 3,
          last_morning_check_in: today
        },
        error: null
      });

      // Mock streak update
      mockUpdate.mockResolvedValueOnce({
        error: null
      });

      let contextValue: CheckInStreakContextType | null = null;
      
      render(
        <CheckInStreakProvider>
          <TestComponent onContextUpdate={(context: CheckInStreakContextType) => { contextValue = context; }} />
        </CheckInStreakProvider>
      );

      // Wait for context to be passed
      await waitFor(() => expect(contextValue).not.toBeNull());

      await act(async () => {
        await contextValue!.incrementStreak('morning');
      });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          morning_streak: 3
        })
      );
    });

    it('resets streak when there is a gap', async () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      // Mock current streaks fetch
      mockSingle.mockResolvedValueOnce({
        data: {
          morning_streak: 5,
          last_morning_check_in: threeDaysAgo.toISOString()
        },
        error: null
      });

      // Mock streak update
      mockUpdate.mockResolvedValueOnce({
        error: null
      });

      let contextValue: CheckInStreakContextType | null = null;
      
      render(
        <CheckInStreakProvider>
          <TestComponent onContextUpdate={(context: CheckInStreakContextType) => { contextValue = context; }} />
        </CheckInStreakProvider>
      );

      // Wait for context to be passed
      await waitFor(() => expect(contextValue).not.toBeNull());

      await act(async () => {
        await contextValue!.incrementStreak('morning');
      });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          morning_streak: 1
        })
      );
    });

    it('handles milestone streaks', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Mock current streaks fetch
      mockSingle.mockResolvedValueOnce({
        data: {
          morning_streak: 6,
          last_morning_check_in: yesterday.toISOString()
        },
        error: null
      });

      // Mock streak update
      mockUpdate.mockResolvedValueOnce({
        error: null
      });

      const mockShowSuccess = jest.fn();
      jest.spyOn(require('@/contexts/AppStateContext'), 'useAppState')
        .mockImplementation(() => ({
          showError: jest.fn(),
          showSuccess: mockShowSuccess
        }));

      const { getByTestId } = render(
        <CheckInStreakProvider>
          <TestComponent />
        </CheckInStreakProvider>
      );

      const component = getByTestId('test-component');
      const streakContext = JSON.parse(component.props.children);

      await act(async () => {
        await streakContext.incrementStreak('morning');
      });

      expect(mockShowSuccess).toHaveBeenCalledWith(
        expect.stringMatching(/7 day morning streak achieved/)
      );
    });
  });

  describe('refreshStreaks', () => {
    it('updates streaks from the server', async () => {
      // Mock initial streaks
      mockSingle.mockResolvedValueOnce({
        data: {
          morning_streak: 1,
          afternoon_streak: 2,
          evening_streak: 3
        },
        error: null
      });
      
      // Mock refreshed streaks
      mockSingle.mockResolvedValueOnce({
        data: {
          morning_streak: 4,
          afternoon_streak: 5,
          evening_streak: 6
        },
        error: null
      });

      let contextValue: CheckInStreakContextType | null = null;
      
      const { getByTestId } = render(
        <CheckInStreakProvider>
          <TestComponent onContextUpdate={(context: CheckInStreakContextType) => { contextValue = context; }} />
        </CheckInStreakProvider>
      );

      // Wait for context to be passed
      await waitFor(() => expect(contextValue).not.toBeNull());

      // Initial state
      let component = getByTestId('test-component');
      let initialData = JSON.parse(component.props.children);
      expect(initialData.streaks.morning).toBe(1);
      
      await act(async () => {
        await contextValue!.refreshStreaks();
      });

      // Check that the streaks were updated
      expect(contextValue!.streaks.morning).toBe(4);
      expect(contextValue!.streaks.afternoon).toBe(5);
      expect(contextValue!.streaks.evening).toBe(6);
    });

    it('handles errors during refresh', async () => {
      // Mock error response
      mockSingle.mockRejectedValueOnce(new Error('Network error'));
      
      const mockShowError = jest.fn();
      jest.spyOn(require('@/contexts/AppStateContext'), 'useAppState').mockReturnValueOnce({
        showError: mockShowError,
        showSuccess: jest.fn()
      });

      let contextValue: CheckInStreakContextType | null = null;
      
      render(
        <CheckInStreakProvider>
          <TestComponent onContextUpdate={(context: CheckInStreakContextType) => { contextValue = context; }} />
        </CheckInStreakProvider>
      );

      // Wait for context to be passed
      await waitFor(() => expect(contextValue).not.toBeNull());

      await act(async () => {
        await contextValue!.refreshStreaks();
      });

      expect(console.error).toHaveBeenCalledWith('Error fetching streaks:', expect.anything());
    });
  });

  describe('streak callback handling', () => {
    it('calls onStreakUpdated with correct parameters', async () => {
      const mockCallback = jest.fn();
      
      // Mock current streaks
      mockSingle.mockResolvedValueOnce({
        data: {
          morning_streak: 0,
          afternoon_streak: 0,
          evening_streak: 0
        },
        error: null
      });
      
      // Mock update
      mockUpdate.mockResolvedValueOnce({
        error: null
      });

      let contextValue: CheckInStreakContextType | null = null;
      
      render(
        <CheckInStreakProvider onStreakUpdated={mockCallback}>
          <TestComponent onContextUpdate={(context: CheckInStreakContextType) => { contextValue = context; }} />
        </CheckInStreakProvider>
      );

      // Wait for context to be passed
      await waitFor(() => expect(contextValue).not.toBeNull());

      await act(async () => {
        await contextValue!.incrementStreak('morning');
      });

      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          morning: 1
        }),
        true, // Should be first check-in
        false // Not all periods completed
      );
    });

    it('handles callback errors gracefully', async () => {
      const mockCallback = jest.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });

      mockSingle.mockResolvedValueOnce({
        data: {
          morning_streak: 1,
          afternoon_streak: 1,
          evening_streak: 1
        },
        error: null
      });

      mockUpdate.mockResolvedValueOnce({
        error: null
      });

      const { getByTestId } = render(
        <CheckInStreakProvider onStreakUpdated={mockCallback}>
          <TestComponent />
        </CheckInStreakProvider>
      );

      const component = getByTestId('test-component');
      const streakContext = JSON.parse(component.props.children);

      // Should not throw
      await act(async () => {
        await streakContext.incrementStreak('morning');
      });

      expect(mockCallback).toHaveBeenCalled();
    });
  });

  it('handles non-PGRST116 error when fetching streaks', async () => {
    // Mock error that is not a "not found" error
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { code: 'OTHER_ERROR', message: 'Database error' }
    });

    console.error = jest.fn();

    const { getByTestId } = render(
      <CheckInStreakProvider>
        <TestComponent />
      </CheckInStreakProvider>
    );

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Error fetching streaks:', expect.anything());
    });
  });

  it('handles error when updating streak', async () => {
    // Mock current streaks fetch
    mockSingle.mockResolvedValueOnce({
      data: {
        morning_streak: 3,
        last_morning_check_in: new Date().toISOString()
      },
      error: null
    });

    // Mock streak update error
    mockUpdate.mockResolvedValueOnce({
      error: { message: 'Error updating streak' }
    });

    console.error = jest.fn();

    const { getByTestId } = render(
      <CheckInStreakProvider>
        <TestComponent />
      </CheckInStreakProvider>
    );

    const component = getByTestId('test-component');
    const streakContext = JSON.parse(component.props.children);

    await act(async () => {
      await streakContext.incrementStreak('morning');
    });

    expect(console.error).toHaveBeenCalledWith('Error updating streak:', expect.anything());
  });

  it('handles null user when incrementing streak', async () => {
    // Mock Auth to return null user
    jest.spyOn(require('@/contexts/AuthContext'), 'useAuth')
      .mockImplementation(() => ({
        user: null
      }));

    const { getByTestId } = render(
      <CheckInStreakProvider>
        <TestComponent />
      </CheckInStreakProvider>
    );

    const component = getByTestId('test-component');
    const streakContext = JSON.parse(component.props.children);

    // Should not throw
    await act(async () => {
      await streakContext.incrementStreak('morning');
    });

    // Should not try to fetch streaks
    expect(mockSingle).not.toHaveBeenCalled();
  });

  it('handles invalid date in lastCheckIn field', async () => {
    // Mock current streaks fetch with invalid date
    mockSingle.mockResolvedValueOnce({
      data: {
        morning_streak: 3,
        last_morning_check_in: 'invalid-date'
      },
      error: null
    });

    // Mock streak update
    mockUpdate.mockResolvedValueOnce({
      error: null
    });

    const { getByTestId } = render(
      <CheckInStreakProvider>
        <TestComponent />
      </CheckInStreakProvider>
    );

    const component = getByTestId('test-component');
    const streakContext = JSON.parse(component.props.children);

    await act(async () => {
      await streakContext.incrementStreak('morning');
    });

    // Should reset to 1 when date is invalid
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        morning_streak: 1
      })
    );
  });

  it('creates new streak record when incrementing with no record', async () => {
    // First streaks fetch returns no record
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116' }
    });

    // Insert for new streak record
    mockInsert.mockResolvedValueOnce({
      error: null
    });

    const { getByTestId } = render(
      <CheckInStreakProvider>
        <TestComponent />
      </CheckInStreakProvider>
    );

    const component = getByTestId('test-component');
    const streakContext = JSON.parse(component.props.children);

    await act(async () => {
      await streakContext.incrementStreak('evening');
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          evening_streak: 1
        })
      ])
    );
  });

  it('handles error when creating streak record during increment', async () => {
    // First streaks fetch returns no record
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116' }
    });

    // Insert for new streak record fails
    mockInsert.mockResolvedValueOnce({
      error: { message: 'Insert failed' }
    });

    console.error = jest.fn();

    const { getByTestId } = render(
      <CheckInStreakProvider>
        <TestComponent />
      </CheckInStreakProvider>
    );

    const component = getByTestId('test-component');
    const streakContext = JSON.parse(component.props.children);

    await act(async () => {
      await streakContext.incrementStreak('morning');
    });

    expect(console.error).toHaveBeenCalledWith('Error creating streak:', expect.anything());
  });

  it('shows success message for all milestone streaks', async () => {
    const milestones = [3, 7, 14, 30, 60, 90];
    
    // Test each milestone
    for (const milestone of milestones) {
      jest.clearAllMocks();
      
      // Mock streaks with one less than milestone
      mockSingle.mockResolvedValueOnce({
        data: {
          morning_streak: milestone - 1,
          last_morning_check_in: (() => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            return yesterday.toISOString();
          })()
        },
        error: null
      });
      
      mockUpdate.mockResolvedValueOnce({
        error: null
      });
      
      // Mock showSuccess
      const mockShowSuccess = jest.fn();
      jest.spyOn(require('@/contexts/AppStateContext'), 'useAppState')
        .mockImplementation(() => ({
          showError: jest.fn(),
          showSuccess: mockShowSuccess
        }));
      
      const { getByTestId } = render(
        <CheckInStreakProvider>
          <TestComponent />
        </CheckInStreakProvider>
      );
      
      const component = getByTestId('test-component');
      const streakContext = JSON.parse(component.props.children);
      
      await act(async () => {
        await streakContext.incrementStreak('morning');
      });
      
      expect(mockShowSuccess).toHaveBeenCalledWith(`🔥 ${milestone} day morning streak achieved!`);
    }
  });

  it('throws error when hook is used outside provider', () => {
    console.error = jest.fn();
    
    expect(() => {
      const { result } = renderHook(() => useCheckInStreak());
    }).toThrow('useCheckInStreak must be used within a CheckInStreakProvider');
  });

  it('properly handles null fields in streak data', async () => {
    // Mock with some null fields
    mockSingle.mockResolvedValueOnce({
      data: {
        morning_streak: null,
        afternoon_streak: 3,
        evening_streak: null,
        last_morning_check_in: null,
        last_afternoon_check_in: '2023-01-01'
      },
      error: null
    });

    const { getByTestId } = render(
      <CheckInStreakProvider>
        <TestComponent />
      </CheckInStreakProvider>
    );

    await waitFor(() => {
      const component = getByTestId('test-component');
      const streakContext = JSON.parse(component.props.children);
      expect(streakContext.streaks.morning).toBe(0); // Null should default to 0
      expect(streakContext.streaks.afternoon).toBe(3);
      expect(streakContext.streaks.evening).toBe(0); // Null should default to 0
    });
  });
}); 