// Mock expo-linking
jest.mock('expo-linking', () => ({
  createURL: jest.fn().mockReturnValue('dailyglow://'),
}));

// Mock React to test createElement calls
jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  return {
    ...originalReact,
    createElement: jest.fn(originalReact.createElement),
  };
});

// Mock @testing-library/react-native
jest.mock('@testing-library/react-native', () => {
  return {
    render: jest.fn().mockReturnValue({ getByTestId: jest.fn() }),
  };
});

import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { wait, createMockHooks, createMockSupabase, createProvidersWrapper, createRenderWithProviders, AllProvidersWrapper, renderWithAllProviders } from '../testUtils';

describe('testUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('wait', () => {
    it('should return a promise that resolves after the specified time', async () => {
      // Mock setTimeout
      jest.useFakeTimers();
      
      // Create a mock function to check when the promise resolves
      const mockFn = jest.fn();
      
      // Call wait and add the mock function as a callback
      const promise = wait(1000).then(mockFn);
      
      // At this point, the callback should not have been called
      expect(mockFn).not.toHaveBeenCalled();
      
      // Fast-forward time
      jest.advanceTimersByTime(999);
      await Promise.resolve(); // Let any pending promises resolve
      
      // The callback should still not have been called
      expect(mockFn).not.toHaveBeenCalled();
      
      // Fast-forward to 1000ms
      jest.advanceTimersByTime(1);
      await Promise.resolve(); // Let any pending promises resolve
      
      // Now the callback should have been called
      expect(mockFn).toHaveBeenCalled();
      
      // Clean up
      jest.useRealTimers();
    });
  });

  describe('createMockHooks', () => {
    it('should create mock implementations of common hooks', () => {
      // Get mock hooks
      const mockHooks = createMockHooks();
      
      // Check that all expected hooks are defined
      expect(mockHooks.useAuth).toBeDefined();
      expect(mockHooks.useAppState).toBeDefined();
      expect(mockHooks.useBadges).toBeDefined();
      expect(mockHooks.useNotifications).toBeDefined();
      
      // Check that hooks return expected mock values
      const authResult = mockHooks.useAuth();
      expect(authResult.user).toBeDefined();
      expect(authResult.session).toBeDefined();
      expect(authResult.signIn).toBeDefined();
      
      // Verify function mocks can be called
      authResult.signIn('test@example.com', 'password');
      expect(authResult.signIn).toHaveBeenCalledWith('test@example.com', 'password');
      
      // Check AppState hook
      const appStateResult = mockHooks.useAppState();
      expect(appStateResult.isLoading).toBeDefined();
      expect(appStateResult.setLoading).toBeDefined();
      expect(appStateResult.showError).toBeDefined();
      expect(appStateResult.showSuccess).toBeDefined();
      
      // Check Badges hook
      const badgesResult = mockHooks.useBadges();
      expect(badgesResult.badges).toBeDefined();
      expect(badgesResult.refreshBadges).toBeDefined();
      
      // Check Notifications hook
      const notificationsResult = mockHooks.useNotifications();
      expect(notificationsResult.notifications).toBeDefined();
      expect(notificationsResult.markAsRead).toBeDefined();
      expect(notificationsResult.markAllAsRead).toBeDefined();
    });
  });

  describe('createMockSupabase', () => {
    it('should create mock implementations of Supabase client', () => {
      // Get mock Supabase
      const { mockSupabase, mockChannel } = createMockSupabase();
      
      // Check that mock client has expected methods
      expect(mockSupabase.from).toBeDefined();
      expect(mockSupabase.auth).toBeDefined();
      
      // Verify method chaining works
      const fromResult = mockSupabase.from('table');
      expect(fromResult.select).toBeDefined();
      
      // Check auth methods
      expect(mockSupabase.auth.signInWithPassword).toBeDefined();
      
      // Verify channel is created correctly
      expect(mockSupabase.channel('test')).toBe(mockChannel);
      expect(mockChannel.on).toBeDefined();
      expect(mockChannel.subscribe).toBeDefined();
    });
  });

  describe('createProvidersWrapper', () => {
    it('should return a function that creates a wrapper component', () => {
      // Check that createProvidersWrapper returns a function
      const wrapper = createProvidersWrapper([]);
      expect(typeof wrapper).toBe('function');
      
      // Check that the returned function is a React component (accepts children)
      const WrapperComponent = wrapper;
      expect(WrapperComponent).toBeDefined();
    });
    
    it('should use React.createElement to create components with providers', () => {
      // Create mock providers
      const MockProviderA = jest.fn(({ children }) => children);
      const MockProviderB = jest.fn(({ children }) => children);
      
      // Create a wrapper with these providers
      const wrapper = createProvidersWrapper([MockProviderA, MockProviderB]);
      
      // Call the wrapper function with children
      const children = React.createElement(Text, { testID: 'test' }, 'Test');
      wrapper({ children });
      
      // Check that React.createElement was called with the right arguments
      expect(React.createElement).toHaveBeenCalled();
    });
  });

  describe('createRenderWithProviders', () => {
    it('should return a function for rendering with providers', () => {
      // Check that createRenderWithProviders returns a function
      const renderWithProviders = createRenderWithProviders([]);
      expect(typeof renderWithProviders).toBe('function');
    });
    
    it('should create a render function that uses the wrapper', () => {
      // Create a mock provider
      const MockProvider = jest.fn(({ children }) => children);
      
      // Create a render function with this provider
      const customRender = createRenderWithProviders([MockProvider]);
      
      // Check that the render function is defined
      expect(customRender).toBeDefined();
      expect(typeof customRender).toBe('function');
    });
    
    it('should call render with the wrapper', () => {
      // Create a custom render function
      const customRender = createRenderWithProviders([]);
      
      // Create a test component
      const testComponent = React.createElement(Text, { testID: 'test' }, 'Test');
      
      // Call the render function
      customRender(testComponent);
      
      // Check that render was called with the right arguments
      expect(render).toHaveBeenCalled();
      expect(render).toHaveBeenCalledWith(
        testComponent,
        expect.objectContaining({
          wrapper: expect.any(Function)
        })
      );
    });
  });
  
  describe('AllProvidersWrapper', () => {
    it('should be a function created by createProvidersWrapper', () => {
      // Check that AllProvidersWrapper is defined
      expect(AllProvidersWrapper).toBeDefined();
      expect(typeof AllProvidersWrapper).toBe('function');
    });
  });
  
  describe('renderWithAllProviders', () => {
    it('should be a function created by createRenderWithProviders', () => {
      // Check that renderWithAllProviders is defined
      expect(renderWithAllProviders).toBeDefined();
      expect(typeof renderWithAllProviders).toBe('function');
    });
  });
}); 