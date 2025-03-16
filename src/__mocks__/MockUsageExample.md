# Mock Usage Examples

This document provides examples of how to use the shared mock utilities when writing tests. These examples show how to implement the dynamic require approach to avoid Jest module factory errors.

## Using Component Mocks

### Example for SignInScreen.test.tsx

```tsx
// Import React and test utilities
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// Use jest.mock with the dynamic require approach
jest.mock('../../components/Typography', () => {
  const { createCommonComponentMocks } = require('../../__mocks__/SharedComponentMocks');
  return createCommonComponentMocks().Typography;
});

jest.mock('../../components/Button', () => {
  const { createCommonComponentMocks } = require('../../__mocks__/SharedComponentMocks');
  return createCommonComponentMocks().Button;
});

jest.mock('../../components/Input', () => {
  const { createCommonComponentMocks } = require('../../__mocks__/SharedComponentMocks');
  return createCommonComponentMocks().Input;
});

// Mock the AuthContext
jest.mock('../../contexts/AuthContext', () => {
  const { createAuthContextMock } = require('../../__mocks__/ContextMocks');
  const React = require('react');
  
  const mockContext = createAuthContextMock({
    signIn: jest.fn().mockResolvedValue({ error: null })
  });
  
  return {
    useAuth: () => mockContext,
    AuthProvider: ({ children }) => {
      return React.createElement('div', { 'data-testid': 'mock-auth-provider' }, children);
    }
  };
});

// Import the component to test
import SignInScreen from '../SignInScreen';

describe('SignInScreen', () => {
  it('renders correctly', () => {
    const { getByTestId, getByText } = render(<SignInScreen />);
    
    expect(getByTestId('input-Email')).toBeTruthy();
    expect(getByTestId('input-Password')).toBeTruthy();
    expect(getByText('Sign In')).toBeTruthy();
  });
  
  it('handles sign in process', async () => {
    const { getByTestId, getByText } = render(<SignInScreen />);
    
    // Fill the form
    fireEvent.changeText(getByTestId('input-field-Email'), 'test@example.com');
    fireEvent.changeText(getByTestId('input-field-Password'), 'password123');
    
    // Submit the form
    fireEvent.press(getByText('Sign In'));
    
    // Get the mocked signIn function
    const { useAuth } = require('../../contexts/AuthContext');
    const { signIn } = useAuth();
    
    // Verify it was called with the right parameters
    expect(signIn).toHaveBeenCalledWith('test@example.com', 'password123');
  });
});
```

## Using Animation Mocks

### Example for JournalScreen.test.tsx

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';

// Mock Animated components with dynamic require
jest.mock('react-native/Libraries/Animated/Animated', () => {
  const { createAnimationMocks } = require('../../__mocks__/AnimationMocks');
  return createAnimationMocks();
});

// Mock JournalContext
jest.mock('../../contexts/JournalContext', () => {
  const { createJournalContextMock } = require('../../__mocks__/ContextMocks');
  const React = require('react');
  
  const mockJournalContext = createJournalContextMock({
    entries: [
      { id: '1', title: 'Test Entry', content: 'Test content', created_at: new Date().toISOString() }
    ]
  });
  
  return {
    useJournal: () => mockJournalContext,
    JournalProvider: ({ children }) => {
      return React.createElement('div', { 'data-testid': 'mock-journal-provider' }, children);
    }
  };
});

// Import component to test
import JournalScreen from '../JournalScreen';

describe('JournalScreen', () => {
  it('renders the journal entries', () => {
    const { getByText } = render(<JournalScreen />);
    
    expect(getByText('Test Entry')).toBeTruthy();
    expect(getByText('Test content')).toBeTruthy();
  });
});
```

## Using Multiple Context Mocks

### Example for HomeScreen.test.tsx

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';

// Mock common components
jest.mock('../../components/Typography', () => {
  const { createCommonComponentMocks } = require('../../__mocks__/SharedComponentMocks');
  return createCommonComponentMocks().Typography;
});

// Mock multiple contexts
jest.mock('../../contexts/AuthContext', () => {
  const { createAuthContextMock } = require('../../__mocks__/ContextMocks');
  const React = require('react');
  
  return {
    useAuth: () => createAuthContextMock(),
    AuthProvider: ({ children }) => React.createElement('div', null, children)
  };
});

jest.mock('../../contexts/ChallengesContext', () => {
  const { createChallengesContextMock } = require('../../__mocks__/ContextMocks');
  const React = require('react');
  
  return {
    useChallenges: () => createChallengesContextMock(),
    ChallengesProvider: ({ children }) => React.createElement('div', null, children)
  };
});

jest.mock('../../contexts/BadgeContext', () => {
  const { createBadgeContextMock } = require('../../__mocks__/ContextMocks');
  const React = require('react');
  
  return {
    useBadges: () => createBadgeContextMock(),
    BadgeProvider: ({ children }) => React.createElement('div', null, children)
  };
});

// Import component to test
import HomeScreen from '../HomeScreen';

describe('HomeScreen', () => {
  it('renders the home screen', () => {
    const { getByText } = render(<HomeScreen />);
    
    expect(getByText('Daily Challenge')).toBeTruthy();
    expect(getByText('Test Challenge')).toBeTruthy(); // From the mock daily challenge
  });
});
```

## Tips for Using Mock Utilities

1. **Always use dynamic require**: Ensure you're using `require()` inside the mock factory function, not importing outside.

2. **Customize your mocks**: Pass custom values to override default behavior when needed:
   ```js
   createAuthContextMock({ isAuthenticated: false })
   ```

3. **Access mocked functions in tests**: You can access the mock implementations in your tests:
   ```js
   const { useAuth } = require('../../contexts/AuthContext');
   const { signIn } = useAuth();
   expect(signIn).toHaveBeenCalledWith('email', 'password');
   ```

4. **Test for errors**: You can test error scenarios by customizing the mock:
   ```js
   jest.mock('../../contexts/AuthContext', () => {
     const { createAuthContextMock } = require('../../__mocks__/ContextMocks');
     return {
       useAuth: () => createAuthContextMock({
         signIn: jest.fn().mockResolvedValue({ error: { message: 'Invalid credentials' } })
       })
     };
   });
   ``` 