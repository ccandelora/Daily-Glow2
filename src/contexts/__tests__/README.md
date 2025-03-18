# Context Provider Testing

This directory contains tests for the React Context providers used throughout the Daily Glow application.

## Testing Approach

Our approach to testing context providers focuses on:

1. **Direct Context Access**: Using `renderHook` and accessing context values directly through `result.current` rather than using JSON parsing.
2. **Isolated Branch Testing**: Testing specific branches in isolation to avoid complex test setups.
3. **Proper Mocking**: Creating comprehensive mocks for external dependencies like Supabase.
4. **Error Handling Coverage**: Ensuring all error handling paths are covered with specific tests.
5. **Simplified Test Implementations**: For complex contexts, creating simplified test implementations that focus on specific functionality.

## NotificationsContext Testing

The NotificationsContext is particularly challenging to test due to:

1. **Complex Subscription Handling**: The context manages Supabase real-time subscriptions which can cause memory issues in tests.
2. **Cleanup Functions**: The cleanup functions in useEffect can cause infinite update loops when testing.
3. **Multiple External Dependencies**: The context depends on AuthContext, AppStateContext, and Supabase.

### Solutions Implemented

1. **Simplified Test Implementation**: Created `NotificationsContext.simplified.test.tsx` which uses a simplified context implementation to test specific error branches.
2. **Isolated Branch Testing**: Each test focuses on a specific branch of code, particularly error handling paths.
3. **Direct Context Access**: Using `renderHook` to access context values directly.
4. **Proper Error Handling**: Ensuring all error handling paths are covered with specific tests.

### Remaining Areas to Improve

1. **Subscription Error Handling**: Improve tests for subscription error handling.
2. **User Badge Loading**: Add tests for user badge loading error handling.
3. **Notification Channel Removal**: Test error handling during channel removal.

## UserProfileContext Testing

The UserProfileContext has achieved good coverage (95.45% statements, 81.25% branches) through:

1. **Comprehensive Error Testing**: Testing various error scenarios including profile not found, duplicate key errors, and fetch errors.
2. **Error Recovery Paths**: Testing error recovery paths when one error is followed by another.
3. **Edge Cases**: Testing edge cases like missing profiles table.

## General Best Practices

1. **Avoid JSON Parsing**: Don't use `JSON.stringify/parse` in tests as it breaks function references.
2. **Mock External Dependencies**: Create comprehensive mocks for external dependencies.
3. **Test Error Handling**: Ensure all error handling paths are covered.
4. **Isolate Tests**: Test specific functionality in isolation to avoid complex test setups.
5. **Use Direct Context Access**: Access context values directly through `renderHook` and `result.current`.
6. **Simplify Complex Tests**: For complex contexts, create simplified test implementations that focus on specific functionality.
7. **Separate Test Files**: Create separate test files for specific functionality to avoid memory issues.

## Memory Issues

If you encounter memory issues or "Maximum update depth exceeded" errors:

1. Create separate, smaller test files for specific parts of the context.
2. Use simplified context implementations for testing.
3. Implement isolated unit tests that directly test functions rather than the entire component lifecycle.
4. Avoid complex subscription setup/teardown in tests.
5. Use extended timeouts for tests involving Supabase. 