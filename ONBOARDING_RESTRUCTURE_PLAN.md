# Daily Glow - Onboarding Flow Restructuring Plan

## Problem Analysis

The app is experiencing an "Unmatched Route" error when trying to navigate to `daily-glow:///(onboarding)/index`. This indicates an issue with the Expo Router configuration and deep linking setup.

Key issues identified:
- Incomplete route structure for the onboarding flow
- Inconsistent navigation patterns
- Missing route definitions in layout files
- Improper deep link handling

## Implementation Plan

### Phase 1: Examine Current Structure

1. Review the current app structure
2. Identify key files that need modification
3. Document dependencies between files

### Phase 2: Create Proper Routing Structure

1. Update the root `app/_layout.tsx` file
   - Ensure it properly handles auth state
   - Define all route groups including `(onboarding)`
   - Set up navigation guards

2. Set up proper routing for the onboarding flow:
   - Create/update `app/(onboarding)/_layout.tsx`
   - Create/update `app/(onboarding)/index.tsx`
   - Create/update additional onboarding screens

3. Ensure proper main app routing:
   - Check `app/(app)/_layout.tsx` configuration
   - Verify other app routes

4. Implement a clean root index handler in `app/index.tsx`
   - Add logic to route to the right place based on auth/onboarding status

### Phase 3: Update Context Providers

1. Review and update the AuthContext if needed
2. Update OnboardingContext to work with new routing structure
3. Ensure proper storage of onboarding completion status

### Phase 4: Configure Deep Linking

1. Verify app.json has the correct scheme
2. Update any deep link handlers

### Phase 5: Testing

1. Test normal app flow
2. Test deep linking
3. Test onboarding completion
4. Test auth flows

## File Changes Required

1. **app/_layout.tsx**
   - Update to include all route groups
   - Ensure proper navigation based on auth state

2. **app/index.tsx**
   - Create or update the root index to handle initial routing

3. **app/(onboarding)/_layout.tsx**
   - Create proper layout for onboarding group

4. **app/(onboarding)/index.tsx**
   - Update to start the onboarding process

5. **app/(onboarding)/** screens
   - Update all onboarding screens to use consistent navigation

6. **src/contexts/AuthContext.tsx**
   - Ensure it properly exposes auth state

7. **src/contexts/OnboardingContext.tsx**
   - Update to work with new routing

8. **app.json**
   - Confirm proper scheme configuration

## Implementation Details

### Routing Structure

The expected file structure should be:

```
app/
├── (onboarding)/
│   ├── index.tsx
│   ├── welcome.tsx
│   ├── personalize.tsx
│   ├── notifications.tsx
│   └── _layout.tsx
├── (app)/
│   ├── index.tsx
│   └── _layout.tsx
├── (auth)/
│   ├── sign-in.tsx
│   └── _layout.tsx
├── _layout.tsx
└── index.tsx
```

### Navigation Flow

1. User opens app → `app/index.tsx`
2. Check auth status:
   - If not authenticated → `(auth)/sign-in`
   - If authenticated but not completed onboarding → `(onboarding)/index`
   - If authenticated and completed onboarding → `(app)/index`

3. Onboarding flow:
   - `(onboarding)/index` → `(onboarding)/welcome`
   - `(onboarding)/welcome` → `(onboarding)/personalize`
   - `(onboarding)/personalize` → `(onboarding)/notifications`
   - `(onboarding)/notifications` → mark onboarding as complete → `(app)/index`

## Execution Timeline

1. Stage 1: Create/update core routing files (1-2 hours)
2. Stage 2: Update context providers (1 hour)
3. Stage 3: Update onboarding screens (2-3 hours)
4. Stage 4: Test and debug (1-2 hours)

Total estimated time: 5-8 hours

## Risks and Mitigation

1. **Risk**: Breaking existing routes
   **Mitigation**: Test each route after changes

2. **Risk**: Context providers might need significant changes
   **Mitigation**: Create wrappers if needed rather than changing existing code

3. **Risk**: Deep linking issues may persist
   **Mitigation**: Test deep links with various URL formats

## Success Criteria

1. Navigation works correctly between all screens
2. Onboarding flow completes successfully
3. Deep links to all routes work properly
4. Auth flow integrates correctly with onboarding flow

## Completion Status

✅ The onboarding restructuring has been completed with the following improvements:

1. Simplified routing structure:
   - Updated app/(onboarding)/index.tsx to directly redirect to welcome screen
   - Improved screen navigation flow

2. Enhanced OnboardingContext:
   - Improved state management with proper persistence
   - Added proper AsyncStorage integration

3. Redesigned Screens:
   - Improved welcome screen with feature highlights
   - Enhanced personalization screen with better UI
   - Optimized notifications screen with clearer instructions

4. Error Handling:
   - Added better error handling throughout the flow
   - Improved UX with friendly error messages

The implementation follows the planned structure and provides a more robust onboarding experience.
