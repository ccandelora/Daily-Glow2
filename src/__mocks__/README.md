# Mock Utilities for Daily Glow Tests

This directory contains shared mock utilities to help with testing React Native components and context providers in a consistent way. These utilities use the dynamic require approach to avoid the common Jest module factory error.

## Overview of Files

- `SharedComponentMocks.ts` - Mocks for common UI components
- `AnimationMocks.ts` - Mocks for React Native's Animated API
- `ContextMocks.ts` - Mocks for context providers
- `MockUsageExample.md` - Examples of how to use these mocks in tests
- `FixedOnboardingContextTest.jsx` - Example implementation for OnboardingContext tests
- `FixedSignInScreenTest.jsx` - Example implementation for SignInScreen tests
- `FixedJournalScreenTest.jsx` - Example implementation for JournalScreen tests with animation mocks

## Common Issues Fixed

1. **Jest Module Factory Error**: The error "The module factory of jest.mock() is not allowed to reference any out-of-scope variables" is resolved by using dynamic requires inside the factory function.

2. **Animation Mocking Issues**: React Native animations are properly mocked to ensure tests don't fail due to animation timing or missing animation functions.

3. **Context Provider Mocking**: Context providers are consistently mocked with proper default values and customization options.

4. **Timing Issues**: Asynchronous operations are properly handled with `waitFor` and proper loading state mocks.

## How to Fix Failing Tests

### 1. Authentication Screen Tests

If you're fixing tests for authentication screens (SignInScreen, SignUpScreen, etc.), follow these steps:

1. Replace direct component imports with dynamic requires:

   ```javascript
   // Instead of this (causes module factory error):
   import { Typography, Button } from '../../components';
   
   jest.mock('../../components', () => ({
     Typography: ({ children }) => <Text>{children}</Text>,
     Button: ({ onPress, title }) => <TouchableOpacity onPress={onPress}>{title}</TouchableOpacity>
   }));
   
   // Use this approach:
   jest.mock('../../components/Typography', () => {
     const { createCommonComponentMocks } = require('../../__mocks__/SharedComponentMocks');
     return createCommonComponentMocks().Typography;
   });
   
   jest.mock('../../components/Button', () => {
     const { createCommonComponentMocks } = require('../../__mocks__/SharedComponentMocks');
     return createCommonComponentMocks().Button;
   });
   ```

2. Mock auth context consistently:

   ```javascript
   jest.mock('../../contexts/AuthContext', () => {
     const { createAuthContextMock } = require('../../__mocks__/ContextMocks');
     const React = require('react');
     
     const mockContext = createAuthContextMock({
       // Customize values if needed
       signIn: jest.fn().mockResolvedValue({ error: null })
     });
     
     return {
       useAuth: () => mockContext,
       AuthProvider: ({ children }) => {
         return React.createElement('div', { 'data-testid': 'mock-auth-provider' }, children);
       }
     };
   });
   ```

3. See `FixedSignInScreenTest.jsx` for a complete example.

### 2. Journal Screen Tests

If you're fixing tests for journal screens with animations:

1. Mock animation components:

   ```javascript
   jest.mock('react-native/Libraries/Animated/Animated', () => {
     const { createAnimationMocks } = require('../../__mocks__/AnimationMocks');
     return createAnimationMocks();
   });
   ```

2. Properly mock JournalContext:

   ```javascript
   jest.mock('../../contexts/JournalContext', () => {
     const { createJournalContextMock } = require('../../__mocks__/ContextMocks');
     const React = require('react');
     
     const mockEntries = [
       // Define your test entries here
     ];
     
     const defaultMock = createJournalContextMock({
       entries: mockEntries,
       getEntries: jest.fn().mockResolvedValue(mockEntries)
     });
     
     return {
       useJournal: () => defaultMock,
       JournalProvider: ({ children }) => {
         return React.createElement('div', { 'data-testid': 'mock-journal-provider' }, children);
       }
     };
   });
   ```

3. See `FixedJournalScreenTest.jsx` for a complete example.

### 3. Context Provider Tests

If you're fixing tests for context providers:

1. Mock dependencies with dynamic requires:

   ```javascript
   jest.mock('../../lib/supabase', () => {
     // Create mock responses
     return {
       supabase: {
         rpc: jest.fn(() => ({ data: false, error: null })),
         from: jest.fn(() => ({
           select: jest.fn(() => ({
             eq: jest.fn(() => ({ data: null, error: null }))
           })),
           insert: jest.fn(() => ({
             single: jest.fn(() => ({ data: { id: 'test-id' }, error: null }))
           }))
         }))
       }
     };
   });
   ```

2. Mock dependent contexts:

   ```javascript
   jest.mock('../../contexts/AppStateContext', () => {
     const { createAppStateMock } = require('../../__mocks__/ContextMocks');
     
     const mockAppState = createAppStateMock();
     
     return {
       useAppState: jest.fn(() => mockAppState),
       // Export mocks for test manipulation if needed
       __setLoading: mockAppState.setLoading
     };
   });
   ```

3. Create a test component to access context values:

   ```javascript
   const TestComponent = ({ onComplete }) => {
     const { someValue, someFunction } = useYourContext();
     
     React.useEffect(() => {
       onComplete({ someValue });
     }, [someValue, onComplete]);
     
     return <View data-testid="test-component" />;
   };
   ```

4. See `FixedOnboardingContextTest.jsx` for a complete example.

## Testing Best Practices

1. **Reset mocks in beforeEach**: Always reset mocks before each test to ensure test isolation:

   ```javascript
   beforeEach(() => {
     jest.clearAllMocks();
     // Reset any specific mocks
   });
   ```

2. **Use waitFor for async operations**: Wait for async operations to complete:

   ```javascript
   await waitFor(() => {
     expect(onComplete).toHaveBeenCalled();
   });
   ```

3. **Mock console methods**: To prevent console clutter, mock console methods:

   ```javascript
   const originalConsoleError = console.error;
   console.error = jest.fn();
   // Run your test
   console.error = originalConsoleError; // Restore after test
   ```

4. **Test for both success and error cases**: Ensure you test how components handle errors:

   ```javascript
   test('handles errors', async () => {
     // Mock an error response
     mockFunction.mockRejectedValueOnce(new Error('Test error'));
     
     // Run test...
     
     // Verify error handling
     expect(showError).toHaveBeenCalled();
   });
   ```

## Integration with Existing Tests

To integrate these mock utilities with your existing test files:

1. Identify tests that are failing with module factory errors
2. Replace direct JSX mocks with dynamic requires using our shared mocks
3. Ensure all animation components are properly mocked
4. Properly mock context providers with all required functions
5. Run tests and fix any remaining issues

For more examples, see the example test files in this directory. 