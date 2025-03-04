-- Migration to add has_completed_onboarding column to profiles table
-- Check if the column exists first to avoid errors
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'has_completed_onboarding'
  ) THEN
    -- Add the column with a default value of false
    ALTER TABLE public.profiles ADD COLUMN has_completed_onboarding BOOLEAN DEFAULT false NOT NULL;
  END IF;
END;
$$;

-- Create a function to add the column (for use in application code)
CREATE OR REPLACE FUNCTION public.add_onboarding_column()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the column exists
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'has_completed_onboarding'
  ) THEN
    -- Add the column with a default value of false
    EXECUTE 'ALTER TABLE public.profiles ADD COLUMN has_completed_onboarding BOOLEAN DEFAULT false NOT NULL';
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.add_onboarding_column() TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_onboarding_column() TO service_role; 