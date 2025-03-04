# Onboarding System Documentation

This document explains how the onboarding system works in Daily Glow and provides instructions for debugging and testing.

## Database Structure

The onboarding status is stored in the `profiles` table with a column called `has_completed_onboarding` (boolean).

## Migrations

The following migrations have been added to the Supabase migrations folder:

1. `20250228000000_add_onboarding_column.sql` - Adds the `has_completed_onboarding` column to the profiles table
2. `20250228000001_reset_onboarding_status.sql` - Creates functions to reset onboarding status
3. `20250228000002_check_profiles.sql` - Creates utility functions to check and fix profiles

## How Onboarding Works

1. When a user signs up, a profile is created with `has_completed_onboarding` set to `false`
2. The app checks this value to determine whether to show the onboarding flow
3. When onboarding is completed, the value is updated to `true` in both:
   - The database (profiles table)
   - Local storage (AsyncStorage with key `@onboarding_state`)

## Debugging Tools

### Running in Debug Mode

Use the `run_with_debug.sh` script to start the app with debugging enabled:

```bash
# Make the script executable (if not already)
chmod +x run_with_debug.sh

# Run the script
./run_with_debug.sh
```

The script will:
- Clear Metro bundler cache and Watchman watches
- Set environment variables for debugging
- Offer to reset onboarding status
- Let you choose which platform to run on (iOS, Android, or web)
- Provide instructions for using the debug tools

### In-App Debug Tools

1. Go to the Settings screen
2. Tap on the version number ("Daily Glow v1.0.0") to reveal debug tools
3. Use the "Check Onboarding Status" button to see the current status
4. Use the "Reset Onboarding" button to reset the status and force the onboarding flow

### JavaScript Scripts

Several scripts are provided for debugging:

1. `fix_onboarding.js` - Checks and fixes the onboarding column in the database
2. `reset_onboarding_for_testing.js` - Resets onboarding status for testing
3. `debug_badges.js` - Diagnoses badge-related issues
4. `fix_welcome_badges.js` - Fixes missing welcome badges for users

To use these scripts:

```bash
# Set your Supabase URL and key
export SUPABASE_URL=your_supabase_url
export SUPABASE_KEY=your_supabase_service_key

# Run the fix script
node fix_onboarding.js

# Reset onboarding for all users
node reset_onboarding_for_testing.js

# Reset onboarding for a specific user
# Edit the USER_ID_TO_RESET variable in the script first
node reset_onboarding_for_testing.js

# Debug badge issues
node debug_badges.js

# Fix missing welcome badges
node fix_welcome_badges.js
```

### SQL Functions

You can also use the SQL functions directly in the Supabase SQL Editor:

```sql
-- Check profiles table structure
SELECT * FROM check_profiles_structure();

-- Check for NULL values in has_completed_onboarding
SELECT check_null_onboarding();

-- Fix NULL values
SELECT fix_null_onboarding();

-- Reset onboarding for a specific user
SELECT reset_user_onboarding('user-id-here');

-- Reset onboarding for all users (admin only)
SELECT reset_all_onboarding();
```

## Troubleshooting

### Onboarding Issues

If users are not being directed to the onboarding flow:

1. Check if the profile exists in the database
2. Verify the `has_completed_onboarding` value is correct
3. Clear AsyncStorage on the device
4. Use the debug tools to reset onboarding status
5. Check the logs for any errors in the onboarding context

### Badge Issues

If users are not receiving badges:

1. Use the `debug_badges.js` script to check badge status
2. Verify that the welcome badge is being awarded on signup
3. Check for discrepancies between the database and app state
4. Use the `fix_welcome_badges.js` script to repair missing welcome badges
5. Check the logs for badge-related errors

## Code References

The onboarding system is implemented in these files:

- `src/contexts/OnboardingContext.tsx` - Main context for onboarding state
- `src/contexts/UserProfileContext.tsx` - Handles user profile data
- `app/_layout.tsx` - Navigation based on onboarding status
- `src/components/debug/DebugTools.tsx` - Debug tools component

## Debugging Logs

To view detailed logs:

1. Run the app with `run_with_debug.sh`
2. Check the Metro bundler console for log output
3. Look for specific log messages related to onboarding and badges
4. Use the in-app debug tools to trigger specific actions and observe the logs 