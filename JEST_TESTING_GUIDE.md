# Jest Testing Guide for React Native

This document provides guidance on Jest testing for our React Native application, incorporating lessons learned and best practices.

## Jest Configuration

Our Jest configuration is set up in `jest.config.js`:

```javascript
module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|expo-router|expo-asset|expo-modules-core|expo-constants)'
  ],
  testEnvironment: 'node',
  testTimeout: 30000, // For slow tests
  verbose: true,
  setupFilesAfterEnv: ['./test-setup.ts'],
};
```

## Common Issues and Solutions

### Module Factory Error

The most common error when testing React Native components is:

```
The module factory of jest.mock() is not allowed to reference any out-of-scope variables
```

This occurs because Jest's module factory functions are executed in isolation during test initialization, before any variables in your test file are defined. This isolation prevents accessing any variables from the test file scope.

#### Solution 1: Dynamic Requires

Use `require()` inside the factory function instead of imports:

```typescript
jest.mock('@/components/common', () => {
  // This works - requires are done inside the factory
  const React = require('react');
  const { View } = require('react-native');
  
  return {
    Typography: ({ children, variant }) => (
      <View testID={`typography-${variant}`}>{children}</View>
    ),
  };
});
```

#### Solution 2: "mock" Prefix Variables

Jest allows accessing variables with names prefixed with "mock" (case-insensitive):

```typescript
// Define your mock with "mock" prefix
const mockLinearGradient = ({ children, ...props }) => (
  <View testID="linear-gradient">{children}</View>
);

// Use it in jest.mock
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: mockLinearGradient,
}));
```

#### Solution 3: React.createElement Instead of JSX

Use `React.createElement()` instead of JSX for complex components:

```typescript
jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  return {
    LinearGradient: jest.fn().mockImplementation(({ children, ...props }) => {
      return React.createElement('View', { 
        ...props,
        testID: 'linear-gradient'
      }, children);
    })
  };
});
```

#### Solution 4: Use jest.doMock()

`jest.doMock()` is evaluated at runtime instead of during initialization:

```typescript
import { Typography } from './__mocks__/ComponentMocks';

// Regular imports are available to jest.doMock
jest.doMock('@/components/common', () => ({
  Typography,
  // Other components...
}));
```

### Testing Components with State and Animations

Testing React Native components with multi-step flows and animations requires special approaches:

#### 1. Simplified Assertions

For complex components like multi-step forms:

```typescript
// Instead of testing the full flow, verify key elements are present
it('renders the check-in screen', () => {
  const { getByTestId, getByText } = render(<CheckInScreen />);
  
  // Basic assertions that don't depend on state
  expect(getByTestId('emotion-wheel')).toBeTruthy();
  expect(getByText(/How are you feeling/)).toBeTruthy();
});
```

#### 2. Handle Animations

For components with animations:

```typescript
// Mock the animation timing
jest.useFakeTimers();

it('shows content after animation completes', async () => {
  const { getByTestId } = render(<AnimatedComponent />);
  
  // Fast-forward animations
  jest.advanceTimersByTime(1000);
  
  // Wait for elements to appear
  await waitFor(() => {
    expect(getByTestId('animated-content')).toBeTruthy();
  });
});
```

#### 3. Mocking Animation Libraries

Create simplified mocks for animation libraries:

```typescript
// In __mocks__/AnimationMocks.js
export const mockAnimated = {
  Value: jest.fn(() => ({
    interpolate: jest.fn(() => ({ interpolate: jest.fn() })),
    setValue: jest.fn(),
  })),
  timing: jest.fn(() => ({ start: jest.fn(cb => cb && cb()) })),
  spring: jest.fn(() => ({ start: jest.fn(cb => cb && cb()) })),
  // Add other animation functions as needed
};

// In your test
jest.mock('react-native/Libraries/Animated/Animated', () => mockAnimated);
```

## Component Mocking Strategies

### Making Text Content Accessible for Testing

When mocking typography components, include a Text component to make content accessible:

```typescript
const Typography = ({ children, variant }) => (
  <View testID={`typography-${variant}`}>
    <Text>{children}</Text>
  </View>
);
```

### Using Optional Chaining

Prevent errors when props are undefined:

```typescript
const Button = ({ title, onPress }) => (
  <TouchableOpacity 
    testID={`button-${title}`} 
    onPress={() => onPress?.()}
  >
    <Text>{title}</Text>
  </TouchableOpacity>
);
```

### Mock Complete Theme Objects

Include all theme properties that components might access:

```typescript
jest.mock('@/constants/theme', () => ({
  COLORS: {
    ui: {
      background: '#121212',
      card: '#1E1E1E',
      text: '#FFFFFF',
      accent: '#6200EE',
    },
    primary: {
      green: '#4CAF50', 
      blue: '#2196F3',
      purple: '#9C27B0',
      red: '#F44336',
      yellow: '#FFEB3B',
    },
  },
  SPACING: {
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  // Other theme properties...
}));
```

## Context Mocking

Create mock context hooks for testing components that use contexts:

```typescript
// Import mock functions
import { 
  mockAddEntry, 
  mockGetLatestEntryForPeriod, 
  mockGetTodayEntries,
} from './__mocks__/ContextMocks';

// Mock the context
jest.mock('@/contexts/JournalContext', () => ({
  useJournal: jest.fn(() => ({
    addEntry: mockAddEntry,
    getLatestEntryForPeriod: mockGetLatestEntryForPeriod,
    getTodayEntries: mockGetTodayEntries,
  })),
}));

// In your tests
test('calls addEntry when form is submitted', () => {
  // ... render component and interact with it
  
  expect(mockAddEntry).toHaveBeenCalledWith('happy', 'excited', 'text', 'note');
});
```

## Using TestID for Robust Tests

For more resilient tests, prefer `getByTestId()` over `getByText()`:

```typescript
// In your component
<View testID="emotion-wheel">
  <TouchableOpacity testID="select-emotion-happy">
    <Text>Happy</Text>
  </TouchableOpacity>
</View>

// In your test
const { getByTestId } = render(<MyComponent />);
expect(getByTestId('emotion-wheel')).toBeTruthy();
fireEvent.press(getByTestId('select-emotion-happy'));
```

## Testing Best Practices

1. **Test Component Rendering**: Verify key elements are displayed
2. **Test User Interactions**: Use `fireEvent` to simulate touches, text input, etc.
3. **Test Basic Logic**: Focus on core functionality rather than visual details
4. **Use Specific Assertions**: Prefer `toBeInTheDocument()` over `toBeTruthy()`
5. **RegExp for Text**: Use regexp for text that might vary: `getByText(/welcome/i)`
6. **Mock External Dependencies**: Create simplified mocks for external APIs and libraries
7. **Test Error States**: Verify components handle error conditions properly
8. **Isolate Tests**: Each test should be independent and not rely on other tests

## Running Tests

```bash
# Run all tests
npm test

# Run tests for a specific component
npm test -- src/components/Button.test.tsx

# Run with coverage report
npm test -- --coverage

# Update snapshots
npm test -- -u

# Run tests in watch mode (automatically reruns on file changes)
npm test -- --watch
```

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Testing React Native Apps](https://reactnative.dev/docs/testing-overview) 