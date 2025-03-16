# Jest Configuration Strategy for React Native Testing

## Problem Statement

When running tests for React Native components, we're encountering the following error:

```
The module factory of jest.mock() is not allowed to reference any out-of-scope variables
```

This occurs because Jest's module factory functions are executed in isolation before test execution, which prevents them from accessing variables defined in the test file scope. In our React Native tests, we're trying to use JSX inside these mock functions, which violates Jest's scoping rules.

## Impact Assessment

- **Affected Tests**: All React Native component tests that use JSX in mock functions
- **Current Workaround**: None; tests are failing to execute
- **Test Files Affected**:
  - `src/screens/journal/__tests__/JournalScreen.test.tsx`
  - `src/screens/journal/__tests__/CheckInScreen.test.tsx`  
  - `src/screens/journal/__tests__/EntryDetailScreen.test.tsx`
  - Any future React Native component tests

## Solution Approaches

We have three potential approaches to solve this issue:

### Option 1: Create Separate Mock Files (Recommended)

#### Implementation Steps

1. Create a `__mocks__` directory in the `src/screens/journal/__tests__` folder
2. Create individual mock files for each dependency category:
   - `ComponentMocks.tsx`: React Native component mocks
   - `ContextMocks.tsx`: Context provider mocks
   - `UtilityMocks.tsx`: Utility function mocks
   - `AnimationMocks.tsx`: Animation-related mocks
3. Update the existing test files to import these mocks

#### Example Implementation

```typescript
// src/screens/journal/__tests__/__mocks__/ComponentMocks.tsx
import React from 'react';
import { View, TouchableOpacity, TextInput } from 'react-native';

export const Typography = ({ children, variant, style }: any) => (
  <View testID={`typography-${variant || 'default'}`}>{children}</View>
);

export const Card = ({ children, style, variant }: any) => (
  <View testID={`card-${variant || 'default'}`}>{children}</View>
);

export const Button = ({ title, onPress, variant, style }: any) => (
  <TouchableOpacity testID={`button-${title}`} onPress={onPress}>
    <View>{title}</View>
  </TouchableOpacity>
);

// Add other component mocks...
```

```typescript
// src/screens/journal/__tests__/CheckInScreen.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { CheckInScreen } from '../CheckInScreen';
// Import mocks
import { Typography, Card, Button, Input, Header, EmotionWheel, VideoBackground } from './__mocks__/ComponentMocks';

// Mock common components
jest.mock('@/components/common', () => ({
  Typography, 
  Card,
  Button,
  Input,
  Header,
  EmotionWheel,
  VideoBackground
}));

// Continue with test as before...
```

### Option 2: Update Jest Configuration

#### Implementation Steps

1. Locate the Jest configuration (either in `package.json` or `jest.config.js`)
2. Update the `transformIgnorePatterns` to properly handle React Native modules:

```js
module.exports = {
  // ... existing configuration
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-reanimated|expo-router|@expo|expo-.*)/)'
  ],
  // May need additional configuration for JSX transformer
}
```

3. Ensure the proper transformer is set up (usually babel-jest)
4. Update any custom setup files if needed

### Option 3: Use jest.doMock Instead of jest.mock

#### Implementation Steps

1. Replace all `jest.mock` calls with `jest.doMock`
2. Ensure mock implementations are defined before they're used
3. Update imports to use the actual mock implementation:

```typescript
import { CheckInScreen } from '../CheckInScreen';

// Define mock components
const Typography = ({ children, variant }: any) => <View testID={`typography-${variant}`}>{children}</View>;
// Define other mocks...

// Use jest.doMock instead of jest.mock
jest.doMock('@/components/common', () => ({
  Typography,
  // Other components...
}));

// Need to import after doMock
const { render } = require('@testing-library/react-native');

describe('CheckInScreen', () => {
  // Tests as before...
});
```

## Implementation Plan

### Phase 1: Preparation and Analysis (1 hour)

1. **Analyze Existing Tests** (30 minutes)
   - Review all affected test files
   - Identify common mocks across test files
   - Document dependencies and mock patterns

2. **Create Directory Structure** (15 minutes)
   - Create `__mocks__` directories in appropriate locations
   - Set up initial file structure for mock files

3. **Update Test Script** (15 minutes)
   - Modify the test script in package.json to include verbose output
   - Add configuration to run specific test files for incremental testing

### Phase 2: Implementation of Option 1 (2 hours)

1. **Create Common Component Mocks** (45 minutes)
   - Extract all UI component mocks to `ComponentMocks.tsx`
   - Ensure proper TypeScript interfaces
   - Add comments for clarity

2. **Create Context Mocks** (30 minutes)
   - Extract all context provider mocks to `ContextMocks.tsx`
   - Ensure mock functions are properly typed

3. **Create Utility and Animation Mocks** (30 minutes)
   - Extract utility function mocks to `UtilityMocks.tsx`
   - Extract animation-related mocks to `AnimationMocks.tsx`

4. **Update Test Files** (15 minutes)
   - Update imports in each test file
   - Update mock implementation references

### Phase 3: Testing and Verification (1 hour)

1. **Incremental Testing** (30 minutes)
   - Test each updated file individually
   - Verify that tests run without the module factory error

2. **Full Test Suite Verification** (15 minutes)
   - Run the complete test suite
   - Verify all tests pass or fail for expected reasons (not due to Jest configuration)

3. **Documentation Update** (15 minutes)
   - Update TEST_COVERAGE_STRATEGY.md with the new approach
   - Document any patterns or best practices for future tests

### Phase 4: Future-Proofing (Optional, 1 hour)

1. **Create Testing Utilities** (30 minutes)
   - Create helper functions for commonly used test patterns
   - Set up test fixtures for reusable test data

2. **Documentation and Examples** (30 minutes)
   - Create examples for testing new components
   - Document best practices for mocking in React Native tests

## Timeline Estimation

- **Total Estimated Time**: 5 hours
- **Critical Path**: Phases 1-3 (4 hours)
- **Optional Improvements**: Phase 4 (1 hour)

## Risk Assessment and Mitigation

### Risks

1. **Scope Creep**: Refactoring tests may reveal additional issues
   - **Mitigation**: Strictly focus on fixing the module factory error first
   
2. **Breaking Changes**: Changes might affect other tests
   - **Mitigation**: Implement changes incrementally and test after each change
   
3. **Library Compatibility**: Some third-party libraries might require special handling
   - **Mitigation**: Document any special cases and create custom mocks as needed

4. **Knowledge Transfer**: New approach needs to be adopted by team
   - **Mitigation**: Document the approach clearly and provide examples

## Success Criteria

1. All existing tests run without the module factory error
2. Test suite provides accurate results (passing or failing based on implementation, not configuration)
3. Documentation is updated to guide future test implementations
4. Approach is scalable for additional test files

## Next Steps

1. Begin with Phase 1: Preparation and Analysis
2. Implement Option 1 (Separate Mock Files) as the most straightforward solution
3. If Option 1 proves insufficient, evaluate Option 2 (Jest Configuration)
4. Update the test coverage strategy documentation with new approach
5. Apply the same pattern to future test files 