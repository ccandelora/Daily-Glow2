import { logAppStartupInfo } from '../debugUtils';
import { Platform } from 'react-native';

// Mock Platform - but our tests will adapt to the actual values reported
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    Version: undefined,
  },
}));

// Extend global to include __DEV__ for TypeScript
declare global {
  namespace NodeJS {
    interface Global {
      __DEV__: boolean;
      performance?: {
        memory?: {
          jsHeapSizeLimit: number;
        };
      };
    }
  }
}

describe('debugUtils', () => {
  // Store original environment variables and console methods
  const originalEnv = process.env;
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  beforeEach(() => {
    // Reset environment variables to a clean state
    process.env = { ...originalEnv };

    // Mock console methods
    console.log = jest.fn();
    console.error = jest.fn();

    // Reset mocks between tests
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original environment and console methods
    process.env = originalEnv;
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  it('should log app startup information correctly', () => {
    // Define global __DEV__ for test
    (global as any).__DEV__ = true;

    // Call the function
    logAppStartupInfo();

    // Get all calls to console.log
    const calls = (console.log as jest.Mock).mock.calls;
    const allMessages = calls.map(call => call[0]);

    // Verify header is present
    expect(allMessages).toContain('=== APP STARTUP DEBUG INFO ===');
    
    // Verify platform info is logged (match actual values from test environment)
    expect(allMessages).toContain('Platform: ios');
    expect(allMessages).toContain('OS Version: undefined');
    expect(allMessages).toContain('Is Dev: Yes');
    
    // Verify environment checks are logged (but don't assume their values)
    expect(allMessages.some(msg => msg.includes('Supabase URL defined:'))).toBe(true);
    expect(allMessages.some(msg => msg.includes('Supabase Key defined:'))).toBe(true);
    expect(allMessages.some(msg => msg.includes('Supabase URL length:'))).toBe(true);
    expect(allMessages.some(msg => msg.includes('Supabase Key starts with:'))).toBe(true);
  });

  it('should handle missing environment variables', () => {
    // Explicitly remove the env vars
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    // Define global __DEV__ for test
    (global as any).__DEV__ = false;

    // Call the function
    logAppStartupInfo();

    // Get all calls to console.log
    const calls = (console.log as jest.Mock).mock.calls;
    const allMessages = calls.map(call => call[0]);

    // Verify specific messages for missing env vars
    expect(allMessages).toContain('Supabase URL defined: false');
    expect(allMessages).toContain('Supabase Key defined: false');
    expect(allMessages).toContain('Supabase URL length: 0');
    expect(allMessages).toContain('Supabase Key starts with: undefined...');
    expect(allMessages).toContain('Is Dev: No');
  });

  it('should handle memory info when available', () => {
    // Mock performance.memory
    const mockMemory = {
      jsHeapSizeLimit: 2048 * 1024 * 1024,
    };

    // Set up the performance object with memory
    (global as any).performance = {
      memory: mockMemory,
    };

    // Call the function
    logAppStartupInfo();

    // Get all calls to console.log
    const calls = (console.log as jest.Mock).mock.calls;
    const allMessages = calls.map(call => call[0]);

    // Verify memory info was logged
    expect(allMessages).toContain(`Memory available: ${mockMemory.jsHeapSizeLimit}`);

    // Clean up mock
    delete (global as any).performance;
  });

  it('should handle unavailable memory info', () => {
    // Ensure performance.memory is not available
    (global as any).performance = {};

    // Call the function
    logAppStartupInfo();

    // Get all calls to console.log
    const calls = (console.log as jest.Mock).mock.calls;
    const allMessages = calls.map(call => call[0]);

    // Verify memory info message for unavailable memory
    expect(allMessages).toContain('Memory info not available in this environment');

    // Clean up mock
    delete (global as any).performance;
  });

  it('should handle errors when logging startup info', () => {
    // Force an error during execution
    console.log = jest.fn().mockImplementation(() => {
      throw new Error('Mock error');
    });

    // Call the function
    logAppStartupInfo();

    // Verify error was logged
    expect(console.error).toHaveBeenCalledWith('Error in startup diagnostics:', 'Mock error');
  });

  it('should handle non-Error objects when logging errors', () => {
    // Force a string error during execution
    console.log = jest.fn().mockImplementation(() => {
      throw 'String error message';
    });

    // Call the function
    logAppStartupInfo();

    // Verify error was logged with string message
    expect(console.error).toHaveBeenCalledWith('Error in startup diagnostics:', 'String error message');
  });
}); 