# Database Setup for Daily Glow

This document explains how to set up the necessary database tables for the Daily Glow app.

## Issue: Missing Tables or Columns

The app is currently encountering the error: `relation "public.user_profiles" does not exist` which means the database schema is not properly set up. Based on your schema diagram, we need to create the proper tables with the correct structure.

## Solution: Create Required Tables

### Option 1: Run Migration Scripts in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Go to the SQL Editor
3. Create a new query and paste the contents of `supabase/migrations/create_profiles_table.sql`
4. Run the query to create the tables and functions

### Option 2: Use the Supabase CLI

If you have the Supabase CLI installed, you can run migrations:

```bash
supabase migration up
```

## Required Tables

The app expects the following tables and columns in your database schema:

1. **profiles**
   - id (UUID, primary key)
   - user_id (UUID, references auth.users.id)
   - display_name (TEXT)
   - avatar_url (TEXT)
   - has_completed_onboarding (BOOLEAN)
   - streak (INT)
   - points (INT)
   - last_check_in (TIMESTAMP)
   - user_goals (JSONB) - Stores an array of goal IDs selected during onboarding
   - notification_preferences (JSONB) - Stores an array of notification preferences
   - created_at (TIMESTAMP)
   - updated_at (TIMESTAMP)

## Connecting Tables to Auth

The `profiles` table should be connected to the `auth.users` table using the `user_id` field as a foreign key. This ensures that each user's profile is properly linked to their authentication record.

## Row Level Security

The migration script includes proper RLS (Row Level Security) policies to ensure that users can only access their own data.

## Local Development Fix

If you're testing locally and can't immediately update the database schema, the app includes a fallback mechanism to store onboarding progress in AsyncStorage. This allows you to complete the onboarding flow without database connectivity.

## Schema Update in Production

When deploying to production, make sure to run the migration scripts to create the necessary tables and columns before users access the app. 