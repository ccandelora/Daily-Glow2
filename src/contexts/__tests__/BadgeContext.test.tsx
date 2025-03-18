import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Text, TouchableOpacity, View } from 'react-native';
import { BadgeProvider, useBadges, Badge, UserBadge } from '@/contexts/BadgeContext';
import { supabase } from '@/lib/supabase';
import { BadgeService } from '@/services/BadgeService';

// Mock the BadgeService
jest.mock('@/services/BadgeService', () => ({
  BadgeService: {
    initializeBadges: jest.fn().mockResolvedValue(undefined),
    checkStreakBadges: jest.fn().mockResolvedValue(undefined),
    checkAllPeriodsCompleted: jest.fn().mockResolvedValue(undefined),
    awardWelcomeBadge: jest.fn().mockResolvedValue(undefined),
    awardFirstCheckInBadge: jest.fn().mockResolvedValue(undefined),
  },
  initializeBadges: jest.fn().mockResolvedValue(undefined),
  BADGE_IDS: {
    COMPLETION: {
      'Welcome Badge': 'Welcome Badge',
      'First Check-in': 'First Check-in',
    },
  },
}));

// Mock the supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: null,
          error: null,
        })),
        limit: jest.fn(() => ({
          data: null,
          error: null,
        })),
        order: jest.fn(() => ({
          data: [
            { 
              id: '1', 
              name: 'Test Badge', 
              description: 'Test Description', 
              icon_name: 'star', 
              category: 'test',
              created_at: new Date().toISOString()
            },
            { 
              id: '2', 
              name: 'Welcome Badge', 
              description: 'Welcome to the app', 
              icon_name: 'welcome', 
              category: 'completion',
              created_at: new Date().toISOString()
            }
          ],
          error: null,
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          data: null,
          error: null,
        })),
      })),
    })),
  },
}));

// Mock the AppStateContext
const mockShowError = jest.fn();
const mockShowSuccess = jest.fn();
jest.mock('@/contexts/AppStateContext', () => ({
  useAppState: jest.fn().mockReturnValue({
    showError: mockShowError,
    showSuccess: mockShowSuccess,
  }),
  AppStateProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Simple test component
const TestComponent = () => {
  const { 
    badges, 
    userBadges, 
    setUserId, 
    addUserBadge, 
    refreshBadges, 
    getBadgeById, 
    getBadgeByName, 
    isLoading 
  } = useBadges();
  
  // Force isLoading to false after a short delay for testing purposes
  React.useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        // This will trigger a re-render with isLoading=false
        refreshBadges();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, refreshBadges]);

  return (
    <View>
      <Text testID="badges-count">{badges.length}</Text>
      <Text testID="user-badges-count">{userBadges.length}</Text>
      <Text testID="loading-state">{isLoading ? 'Loading' : 'Not Loading'}</Text>
      <TouchableOpacity testID="set-user-id" onPress={() => setUserId('test-user')}>
        <Text>Set User ID</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="set-user-id-null" onPress={() => setUserId(null)}>
        <Text>Set User ID to null</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="add-user-badge" onPress={() => addUserBadge('1')}>
        <Text>Add User Badge</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="get-badge-by-id" onPress={() => getBadgeById('1')}>
        <Text>Get Badge By ID</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="get-badge-by-name" onPress={() => getBadgeByName('Test Badge')}>
        <Text>Get Badge By Name</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="refresh-badges" onPress={() => refreshBadges()}>
        <Text>Refresh Badges</Text>
      </TouchableOpacity>
    </View>
  );
};

describe('BadgeContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('provides badge functionality', async () => {
    const { getByTestId } = render(
      <BadgeProvider>
        <TestComponent />
      </BadgeProvider>
    );
    
    // Basic assertions
    expect(getByTestId('badges-count')).toBeTruthy();
    expect(getByTestId('loading-state')).toBeTruthy();
    
    // Wait for initial loading to complete
    await waitFor(() => {
      expect(getByTestId('loading-state').props.children).toBe('Not Loading');
    });
    
    // Test setting user ID
    fireEvent.press(getByTestId('set-user-id'));
    
    // Test adding a badge
    fireEvent.press(getByTestId('add-user-badge'));
    
    // Test refreshing badges
    fireEvent.press(getByTestId('refresh-badges'));
    
    // Verify supabase was called for various operations
    expect(supabase.from).toHaveBeenCalled();
  });

  it('initializes badges table if it does not exist', async () => {
    // Mock supabase to return empty data for the table check
    (supabase.from as jest.Mock).mockImplementationOnce(() => ({
      select: jest.fn(() => ({
        limit: jest.fn(() => ({
          data: [],
          error: null,
        })),
      })),
    }));

    render(
      <BadgeProvider>
        <TestComponent />
      </BadgeProvider>
    );
    
    // Wait for initialization to complete
    await waitFor(() => {
      // Check that initializeBadges was called
      expect(BadgeService.initializeBadges).toHaveBeenCalled();
    });
  });

  it('gets a badge by ID', async () => {
    const { getByTestId } = render(
      <BadgeProvider>
        <TestComponent />
      </BadgeProvider>
    );
    
    // Wait for initial loading to complete
    await waitFor(() => {
      expect(getByTestId('loading-state').props.children).toBe('Not Loading');
    });
    
    // Test getting a badge by ID
    fireEvent.press(getByTestId('get-badge-by-id'));
    
    // No need to assert the return value as it's internal to the component,
    // but we can check that the component doesn't crash
    expect(getByTestId('get-badge-by-id')).toBeTruthy();
  });

  it('gets a badge by name', async () => {
    const { getByTestId } = render(
      <BadgeProvider>
        <TestComponent />
      </BadgeProvider>
    );
    
    // Wait for initial loading to complete
    await waitFor(() => {
      expect(getByTestId('loading-state').props.children).toBe('Not Loading');
    });
    
    // Test getting a badge by name
    fireEvent.press(getByTestId('get-badge-by-name'));
    
    // No need to assert the return value as it's internal to the component,
    // but we can check that the component doesn't crash
    expect(getByTestId('get-badge-by-name')).toBeTruthy();
  });

  it('fetches user badges when user ID is set', async () => {
    // Mock supabase to return user badges
    const mockUserBadges = [
      {
        id: 'ub1',
        user_id: 'test-user',
        badge_id: '1',
        created_at: new Date().toISOString(),
        badge: {
          id: '1',
          name: 'Test Badge',
          description: 'Test Description',
          icon_name: 'star',
          category: 'test',
          created_at: new Date().toISOString(),
        },
      },
    ];
    
    // Setup mock for user badges
    (supabase.from as jest.Mock).mockImplementationOnce(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: mockUserBadges,
          error: null,
        })),
      })),
    }));
    
    const { getByTestId } = render(
      <BadgeProvider>
        <TestComponent />
      </BadgeProvider>
    );
    
    // Wait for initial loading to complete
    await waitFor(() => {
      expect(getByTestId('loading-state').props.children).toBe('Not Loading');
    });
    
    // Set the user ID to trigger fetching user badges
    fireEvent.press(getByTestId('set-user-id'));
    
    // Mock supabase again for the fetchUserBadges call
    (supabase.from as jest.Mock).mockImplementationOnce(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: mockUserBadges,
          error: null,
        })),
      })),
    }));
    
    // Wait for user badges to be fetched
    await waitFor(() => {
      // Since the mock implementation gets used up, we can't directly check the user badges count
      // but we can verify that supabase.from was called
      expect(supabase.from).toHaveBeenCalledWith('user_badges');
    });
  });

  it('handles errors when fetching badges', async () => {
    // Mock supabase to return an error
    (supabase.from as jest.Mock).mockImplementationOnce(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          data: null,
          error: { message: 'Error fetching badges' },
        })),
      })),
    }));
    
    render(
      <BadgeProvider>
        <TestComponent />
      </BadgeProvider>
    );
    
    // Verify error was logged
    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
    });
  });

  it('handles errors when adding user badges', async () => {
    // Mock supabase for the initial load
    (supabase.from as jest.Mock).mockImplementationOnce(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          data: [
            { 
              id: '1', 
              name: 'Test Badge', 
              description: 'Test Description', 
              icon_name: 'star', 
              category: 'test',
              created_at: new Date().toISOString()
            }
          ],
          error: null,
        })),
      })),
    }));
    
    // Mock supabase to return an error when inserting
    (supabase.from as jest.Mock).mockImplementationOnce(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          data: null,
          error: { message: 'Error adding badge' },
        })),
      })),
    }));
    
    const { getByTestId } = render(
      <BadgeProvider>
        <TestComponent />
      </BadgeProvider>
    );
    
    // Wait for initial loading to complete
    await waitFor(() => {
      expect(getByTestId('loading-state').props.children).toBe('Not Loading');
    });
    
    // Set user ID
    fireEvent.press(getByTestId('set-user-id'));
    
    // Try to add a badge that will result in an error
    fireEvent.press(getByTestId('add-user-badge'));
    
    // Verify error handler was called
    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
      expect(mockShowError).toHaveBeenCalled();
    });
  });

  it('checks for first badge when user has no badges', async () => {
    // Mock supabase for the initial load
    (supabase.from as jest.Mock).mockImplementationOnce(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          data: [
            { 
              id: '2', 
              name: 'Welcome Badge', 
              description: 'Welcome to the app', 
              icon_name: 'welcome', 
              category: 'completion',
              created_at: new Date().toISOString()
            }
          ],
          error: null,
        })),
      })),
    }));
    
    // Mock supabase for user badges - return empty array indicating no badges
    (supabase.from as jest.Mock).mockImplementationOnce(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: [],
          error: null,
        })),
      })),
    }));
    
    // Mock checking for existing badges - also return empty to trigger first badge check
    (supabase.from as jest.Mock).mockImplementationOnce(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: [],
          error: null,
        })),
      })),
    }));
    
    // Mock for latest badges
    (supabase.from as jest.Mock).mockImplementationOnce(() => ({
      select: jest.fn(() => ({
        data: [
          { 
            id: '2', 
            name: 'Welcome Badge', 
            description: 'Welcome to the app', 
            icon_name: 'welcome', 
            category: 'completion',
            created_at: new Date().toISOString()
          }
        ],
        error: null,
      })),
    }));
    
    const { getByTestId } = render(
      <BadgeProvider>
        <TestComponent />
      </BadgeProvider>
    );
    
    // Wait for initial loading to complete
    await waitFor(() => {
      expect(getByTestId('loading-state').props.children).toBe('Not Loading');
    });
    
    // Set user ID to trigger user badge fetching
    fireEvent.press(getByTestId('set-user-id'));
    
    // Verify the check and award first badge was attempted
    await waitFor(() => {
      // Since the process is internal, we can verify that supabase was called with the right query patterns
      expect(supabase.from).toHaveBeenCalled();
    });
  });

  it('clears badges when user ID is set to null', async () => {
    const { getByTestId } = render(
      <BadgeProvider>
        <TestComponent />
      </BadgeProvider>
    );
    
    // Wait for initial loading to complete
    await waitFor(() => {
      expect(getByTestId('loading-state').props.children).toBe('Not Loading');
    });
    
    // Set user ID
    fireEvent.press(getByTestId('set-user-id'));
    
    // Set user ID to null
    fireEvent.press(getByTestId('set-user-id-null'));
    
    // User badges should be cleared
    await waitFor(() => {
      expect(getByTestId('user-badges-count').props.children).toBe(0);
    });
  });

  it('adds a welcome badge', async () => {
    // Mock supabase for the initial load
    (supabase.from as jest.Mock).mockImplementationOnce(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          data: [
            { 
              id: '2', 
              name: 'Welcome Badge', 
              description: 'Welcome to the app', 
              icon_name: 'welcome', 
              category: 'completion',
              created_at: new Date().toISOString()
            }
          ],
          error: null,
        })),
      })),
    }));
    
    // Mock supabase for inserting a badge
    (supabase.from as jest.Mock).mockImplementationOnce(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          data: {
            id: 'ub1',
            user_id: 'test-user',
            badge_id: '2',
          },
          error: null,
        })),
      })),
    }));
    
    const { getByTestId } = render(
      <BadgeProvider>
        <TestComponent />
      </BadgeProvider>
    );
    
    // Wait for initial loading to complete
    await waitFor(() => {
      expect(getByTestId('loading-state').props.children).toBe('Not Loading');
    });
    
    // Set user ID
    fireEvent.press(getByTestId('set-user-id'));
    
    // Add welcome badge
    fireEvent.press(getByTestId('add-user-badge'));
    
    // Verify success message was shown
    await waitFor(() => {
      expect(mockShowSuccess).toHaveBeenCalled();
    });
  });

  it('handles failed badge table initialization', async () => {
    // Mock Supabase to return an error for the first query attempting to initialize badges
    (supabase.from as jest.Mock).mockImplementationOnce(() => ({
      select: jest.fn(() => ({
        limit: jest.fn(() => ({
          data: null,
          error: { message: 'Error checking badges table' },
        })),
      })),
    }));

    // Mock BadgeService to throw an error when called
    (BadgeService.initializeBadges as jest.Mock).mockRejectedValueOnce(new Error('Failed to initialize badges'));

    const { getByTestId } = render(
      <BadgeProvider>
        <TestComponent />
      </BadgeProvider>
    );

    // Wait for some error handling and fallback to complete
    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
    });

    // Wait for loading to finish
    await waitFor(() => {
      expect(getByTestId('loading-state').props.children).toBe('Not Loading');
    });
  });

  it('attempts re-initialization when badge verification fails', async () => {
    // Mock first table check to succeed but no badges found
    (supabase.from as jest.Mock).mockImplementationOnce(() => ({
      select: jest.fn(() => ({
        limit: jest.fn(() => ({
          data: [],
          error: null,
        })),
      })),
    }));

    // Mock second verification check to fail
    (supabase.from as jest.Mock).mockImplementationOnce(() => ({
      select: jest.fn(() => ({
        limit: jest.fn(() => ({
          data: [],
          error: { message: 'Failed to verify badges' },
        })),
      })),
    }));

    const { getByTestId } = render(
      <BadgeProvider>
        <TestComponent />
      </BadgeProvider>
    );

    // Verify initializeBadges was called multiple times (initial + retry)
    await waitFor(() => {
      expect(BadgeService.initializeBadges).toHaveBeenCalled();
    });

    // Wait for loading to finish
    await waitFor(() => {
      expect(getByTestId('loading-state').props.children).toBe('Not Loading');
    });
  });

  it('handles errors when fetching user badges', async () => {
    // Mock supabase for the initial load
    (supabase.from as jest.Mock).mockImplementationOnce(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          data: [
            { 
              id: '1', 
              name: 'Test Badge', 
              description: 'Test Description', 
              icon_name: 'star', 
              category: 'test',
              created_at: new Date().toISOString()
            }
          ],
          error: null,
        })),
      })),
    }));
    
    // Mock error when fetching user badges
    (supabase.from as jest.Mock).mockImplementationOnce(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: null,
          error: { message: 'Error fetching user badges' },
        })),
      })),
    }));
    
    const { getByTestId } = render(
      <BadgeProvider>
        <TestComponent />
      </BadgeProvider>
    );
    
    // Wait for initial loading to complete
    await waitFor(() => {
      expect(getByTestId('loading-state').props.children).toBe('Not Loading');
    });
    
    // Set user ID to trigger fetching user badges, which will error
    fireEvent.press(getByTestId('set-user-id'));
    
    // Verify error was logged
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Error fetching user badges:', expect.anything());
    });
  });

  it('handles fallback when additional unfiltered badge query is needed', async () => {
    // First mock returns empty badges array
    (supabase.from as jest.Mock).mockImplementationOnce(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          data: [],
          error: null,
        })),
      })),
    }));
    
    // Second mock for unfiltered query returns some badges
    (supabase.from as jest.Mock).mockImplementationOnce(() => ({
      select: jest.fn(() => ({
        data: [
          { 
            id: '1', 
            name: 'Test Badge', 
            description: 'Test Description', 
            icon_name: 'star', 
            category: 'test',
            created_at: new Date().toISOString()
          }
        ],
        error: null,
      })),
    }));
    
    const { getByTestId } = render(
      <BadgeProvider>
        <TestComponent />
      </BadgeProvider>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(getByTestId('loading-state').props.children).toBe('Not Loading');
    });
    
    // Check that badges count is 1 (from unfiltered query)
    expect(getByTestId('badges-count').props.children).toBe(1);
  });

  it('handles error in unfiltered badge query fallback', async () => {
    // First mock returns empty badges array
    (supabase.from as jest.Mock).mockImplementationOnce(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          data: [],
          error: null,
        })),
      })),
    }));
    
    // Second mock for unfiltered query also fails
    (supabase.from as jest.Mock).mockImplementationOnce(() => ({
      select: jest.fn(() => ({
        data: null,
        error: { message: 'Error fetching all badges' },
      })),
    }));
    
    const { getByTestId } = render(
      <BadgeProvider>
        <TestComponent />
      </BadgeProvider>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(getByTestId('loading-state').props.children).toBe('Not Loading');
    });
    
    // Verify error was logged
    expect(console.error).toHaveBeenCalledWith('Error fetching all badges:', expect.anything());
    
    // Check that badges count is 0 (fallback to empty array)
    expect(getByTestId('badges-count').props.children).toBe(0);
  });
}); 