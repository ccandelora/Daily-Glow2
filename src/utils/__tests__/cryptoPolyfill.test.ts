// First, mock the react-native-get-random-values module to prevent it from interfering with our tests
jest.mock('react-native-get-random-values', () => {
  // This empty mock prevents the real implementation from running
});

// Then, mock expo-crypto
jest.mock('expo-crypto', () => ({
  getRandomValues: jest.fn((array) => {
    // Simple deterministic implementation for testing
    for (let i = 0; i < array.length; i++) {
      array[i] = i + 1;
    }
    return array;
  })
}));

import * as Crypto from 'expo-crypto';

// Store original global.crypto for restoration
const originalCrypto = global.crypto;

describe('cryptoPolyfill', () => {
  beforeEach(() => {
    // Reset global.crypto before each test to ensure a clean state
    // @ts-ignore - Intentionally manipulating global for testing
    global.crypto = undefined;
    
    // Clear the module cache to ensure fresh import of the polyfill
    jest.resetModules();
  });
  
  afterEach(() => {
    // Restore original global.crypto after each test
    // @ts-ignore - Restoring global after test
    global.crypto = originalCrypto;
    
    // Reset mocks
    jest.clearAllMocks();
  });
  
  afterAll(() => {
    // Final restoration of original state
    // @ts-ignore - Restoring global after all tests
    global.crypto = originalCrypto;
  });

  it('should create global.crypto object if it does not exist', () => {
    // Arrange: Ensure global.crypto is undefined
    // @ts-ignore - Intentionally manipulating global for testing
    global.crypto = undefined;
    
    // Act: Import the polyfill which should set up global.crypto
    require('../cryptoPolyfill');
    
    // Assert: global.crypto should now be an object
    expect(global.crypto).toBeDefined();
    expect(typeof global.crypto).toBe('object');
  });

  it('should not override existing global.crypto object', () => {
    // Arrange: Set up a mock crypto object
    const mockCrypto = { test: 'value' };
    // @ts-ignore - Intentionally manipulating global for testing
    global.crypto = mockCrypto;
    
    // Act: Import the polyfill which should preserve the existing object
    require('../cryptoPolyfill');
    
    // Assert: global.crypto should still have our test property
    // @ts-ignore - Accessing test property
    expect(global.crypto.test).toBe('value');
  });

  it('should add getRandomValues method if it does not exist', () => {
    // Arrange: Set up crypto without getRandomValues
    // @ts-ignore - Intentionally manipulating global for testing
    global.crypto = {};
    
    // Act: Import the polyfill which should add getRandomValues
    require('../cryptoPolyfill');
    
    // Assert: getRandomValues should now be a function
    expect(global.crypto.getRandomValues).toBeDefined();
    expect(typeof global.crypto.getRandomValues).toBe('function');
  });

  it('should not override existing getRandomValues method', () => {
    // Arrange: Set up a mock getRandomValues function
    const mockGetRandomValues = jest.fn();
    // @ts-ignore - Intentionally manipulating global for testing
    global.crypto = { getRandomValues: mockGetRandomValues };
    
    // Act: Import the polyfill which should set up the global
    require('../cryptoPolyfill');
    
    // Assert: getRandomValues should still be our mock function
    expect(global.crypto.getRandomValues).toBe(mockGetRandomValues);
  });

  it('should use expo-crypto or fallback implementation', () => {
    // Arrange: Ensure global.crypto exists but without getRandomValues
    // @ts-ignore - Intentionally manipulating global for testing
    global.crypto = {};
    
    // Act: Import the polyfill
    require('../cryptoPolyfill');
    
    // Create a test array
    const testArray = new Uint8Array(10).fill(0);
    
    // Call getRandomValues
    global.crypto.getRandomValues(testArray);
    
    // Assert: The array should have been filled with values
    // We don't check the specific implementation, just that it functions
    const hasNonZeroValues = Array.from(testArray).some(value => value !== 0);
    expect(hasNonZeroValues).toBe(true);
  });

  it('should correctly fill array with random values when called', () => {
    // Arrange: Ensure global.crypto exists but without getRandomValues
    // @ts-ignore - Intentionally manipulating global for testing
    global.crypto = {};
    
    // Act: Import the polyfill
    require('../cryptoPolyfill');
    
    // Create a test array filled with zeros
    const testArray = new Uint8Array(10).fill(0);
    
    // Use the polyfilled method
    const result = global.crypto.getRandomValues(testArray);
    
    // Assert: Array should now contain values from our mock implementation
    expect(result).toBe(testArray); // Should return the same array
    expect(Array.from(testArray)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });
}); 