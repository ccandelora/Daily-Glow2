import React, { ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { NotificationsProvider, useNotifications } from '../NotificationsContext';
import { AppStateProvider } from '../AppStateContext';
import { AuthProvider } from '../AuthContext';
import { Alert } from 'react-native';
import { SupabaseClient } from '@supabase/supabase-js';

// Mock dependencies
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
  Platform: {
    OS: 'ios',
  },
  AppState: {
    addEventListener: jest.fn()
  }
}));

// Mock session data
const mockUser = { id: 'test-user-id' };
const mockSession = { user: mockUser };

// Mock functions for AppState
const mockSetLoading = jest.fn();
const mockShowError = jest.fn();
const mockShowSuccess = jest.fn();

// Mock the AppStateContext
jest.mock('../AppStateContext', () => ({
  useAppState: jest.fn().mockImplementation(() => ({
    setLoading: mockSetLoading,
    showError: mockShowError,
    showSuccess: mockShowSuccess,
    isLoading: false,
  })),
  AppStateProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock the AuthContext
jest.mock('../AuthContext', () => ({
  useAuth: jest.fn().mockImplementation(() => ({
    session: { user: { id: 'test-user-id' } },
    user: { id: 'test-user-id' },
  })),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock the BadgeContext
jest.mock('@/contexts/BadgeContext', () => ({
  useBadges: jest.fn().mockReturnValue({
    setUserId: jest.fn(),
  }),
}));

// Mock Supabase module
jest.mock('@/lib/supabase', () => ({
  supabase: {},
  redirectUrl: 'https://example.com'
}));

// Mock data
const mockNotifications = [
  {
    id: '1',
    type: 'achievement',
    title: 'Achievement Unlocked',
    message: 'You achieved something great!',
    metadata: {},
    read: false,
    created_at: '2023-06-01T12:00:00Z',
    user_id: 'test-user-id'
  },
  {
    id: '2',
    type: 'badge',
    title: 'New Badge',
    message: 'You earned a new badge!',
    metadata: {},
    read: true,
    created_at: '2023-05-28T12:00:00Z',
    user_id: 'test-user-id'
  },
];

const mockUserBadges = [
  {
    id: '1',
    badge_id: 'badge-1',
    unlocked_at: '2023-06-01T12:00:00Z',
    user_id: 'test-user-id',
    badge: {
      id: 'badge-1',
      name: 'Test Badge',
      description: 'A test badge',
      icon: 'trophy',
      type: 'special',
      requirement_count: 1,
      points: 100,
    },
  },
];

describe('NotificationsContext', () => {
  // Setup for each test
  let mockSupabase: any;
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Create a fresh mockSupabase for each test
    mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnValue({ data: mockNotifications, error: null }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({ data: null, error: null })
          })
        }),
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({ data: null, error: null })
          })
        }),
      }),
      channel: jest.fn().mockReturnValue({
        on: jest.fn().mockReturnValue({
          subscribe: jest.fn()
        })
      }),
      removeChannel: jest.fn(),
      // Add minimal required properties to satisfy SupabaseClient interface
      auth: {},
      rest: {},
      realtime: {},
      supabaseUrl: 'https://example.com',
      supabaseKey: 'dummy-key'
    };
    
    // Replace the supabase module export with our mock
    const supabaseModule = require('@/lib/supabase');
    supabaseModule.supabase = mockSupabase;
    
    // Reset auth mock to return a user
    require('../AuthContext').useAuth.mockImplementation(() => ({
      session: mockSession,
      user: mockUser,
    }));
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Create a wrapper with all required context providers
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AppStateProvider>
      <AuthProvider>
        <NotificationsProvider>{children}</NotificationsProvider>
      </AuthProvider>
    </AppStateProvider>
  );

  it('provides the notifications context with default values', async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });
    
    // Allow component to initialize
    await waitFor(() => {
      expect(result.current).toBeDefined();
    });
    
    // Check context function types
    expect(typeof result.current.markAsRead).toBe('function');
    expect(typeof result.current.markAllAsRead).toBe('function');
    expect(typeof result.current.deleteNotification).toBe('function');
    expect(typeof result.current.refreshNotifications).toBe('function');
  });

  it('does not load data when session is null', async () => {
    // Mock the AuthContext to return null session
    require('../AuthContext').useAuth.mockImplementation(() => ({
      session: null,
      user: null,
    }));
    
    const { result } = renderHook(() => useNotifications(), { wrapper });
    
    // Allow component to initialize
    await waitFor(() => {
      expect(result.current).toBeDefined();
    });
    
    // Context should provide default values
    expect(result.current.notifications).toEqual([]);
    expect(result.current.userBadges).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
    
    // Supabase should not be called when there's no session
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it('handles error when loading notifications', async () => {
    // Setup the mock to return an error for notifications
    mockSupabase.from.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnValue({ 
        data: null, 
        error: new Error('Failed to load notifications') 
      })
    });
    
    renderHook(() => useNotifications(), { wrapper });
    
    // Wait for the error to be shown
    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalled();
    });
  });
  
  it('marks a notification as read', async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });
    
    // Allow component to initialize
    await waitFor(() => {
      expect(result.current).toBeDefined();
    });
    
    // Mock the internal state by directly setting the notifications
    act(() => {
      // @ts-ignore - Accessing internal methods for testing
      result.current._setNotifications?.(mockNotifications);
    });
    
    // Reset mocks to track new calls
    mockSupabase.from.mockClear();
    
    // Call markAsRead with id '1'
    await act(async () => {
      await result.current.markAsRead('1');
    });
    
    // Verify the method was called with expected arguments
    expect(mockSetLoading).toHaveBeenCalledWith(true);
    expect(mockSupabase.from).toHaveBeenCalledWith('notifications');
  });
  
  it('deletes a notification', async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });
    
    // Allow component to initialize
    await waitFor(() => {
      expect(result.current).toBeDefined();
    });
    
    // Mock the internal state by directly setting the notifications
    act(() => {
      // @ts-ignore - Accessing internal methods for testing
      result.current._setNotifications?.(mockNotifications);
    });
    
    // Reset mocks to track new calls
    mockSupabase.from.mockClear();
    
    // Call deleteNotification with id '1'
    await act(async () => {
      await result.current.deleteNotification('1');
    });
    
    // Verify the method was called with expected arguments
    expect(mockSetLoading).toHaveBeenCalledWith(true);
    expect(mockSupabase.from).toHaveBeenCalledWith('notifications');
  });
  
  it('marks all notifications as read', async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });
    
    // Allow component to initialize
    await waitFor(() => {
      expect(result.current).toBeDefined();
    });
    
    // Mock the internal state by directly setting the notifications
    act(() => {
      // @ts-ignore - Accessing internal methods for testing
      result.current._setNotifications?.(mockNotifications);
    });
    
    // Reset mocks to track new calls
    mockSupabase.from.mockClear();
    
    // Call markAllAsRead
    await act(async () => {
      await result.current.markAllAsRead();
    });
    
    // Verify the method was called with expected arguments
    expect(mockSetLoading).toHaveBeenCalledWith(true);
    expect(mockSupabase.from).toHaveBeenCalledWith('notifications');
  });
  
  it('refreshes notifications and badges', async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });
    
    // Allow component to initialize
    await waitFor(() => {
      expect(result.current).toBeDefined();
    });
    
    // Reset mocks to track new calls
    mockSupabase.from.mockClear();
    
    // Call refreshNotifications
    await act(async () => {
      await result.current.refreshNotifications();
    });
    
    // Verify the method was called with expected arguments
    expect(mockSupabase.from).toHaveBeenCalledWith('notifications');
    expect(mockSupabase.from).toHaveBeenCalledWith('user_badges');
  });
  
  it('handles error when marking a notification as read', async () => {
    // Setup the mock to return an error for update
    mockSupabase.from.mockReturnValueOnce({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({ 
            data: null, 
            error: new Error('Failed to mark notification as read') 
          })
        })
      })
    });
    
    const { result } = renderHook(() => useNotifications(), { wrapper });
    
    // Allow component to initialize
    await waitFor(() => {
      expect(result.current).toBeDefined();
    });
    
    // Mock the internal state by directly setting the notifications
    act(() => {
      // @ts-ignore - Accessing internal methods for testing
      result.current._setNotifications?.(mockNotifications);
    });
    
    // Call markAsRead with id '1'
    await act(async () => {
      await result.current.markAsRead('1');
    });
    
    // Verify error handling
    expect(mockShowError).toHaveBeenCalled();
    expect(mockSetLoading).toHaveBeenCalledWith(false);
  });
  
  it('handles error when deleting a notification', async () => {
    // Setup the mock to return an error for delete
    mockSupabase.from.mockReturnValueOnce({
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({ 
            data: null, 
            error: new Error('Failed to delete notification') 
          })
        })
      })
    });
    
    const { result } = renderHook(() => useNotifications(), { wrapper });
    
    // Allow component to initialize
    await waitFor(() => {
      expect(result.current).toBeDefined();
    });
    
    // Mock the internal state by directly setting the notifications
    act(() => {
      // @ts-ignore - Accessing internal methods for testing
      result.current._setNotifications?.(mockNotifications);
    });
    
    // Call deleteNotification with id '1'
    await act(async () => {
      await result.current.deleteNotification('1');
    });
    
    // Verify error handling
    expect(mockShowError).toHaveBeenCalled();
    expect(mockSetLoading).toHaveBeenCalledWith(false);
  });
}); 