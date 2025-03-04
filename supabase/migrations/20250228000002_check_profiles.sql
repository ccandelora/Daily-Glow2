-- This is a utility script to check the profiles table structure and data
-- It doesn't make any changes to the database

-- Create a function to check profiles table structure
CREATE OR REPLACE FUNCTION public.check_profiles_structure()
RETURNS TABLE (
    column_name text,
    data_type text,
    is_nullable text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles'
    ORDER BY ordinal_position;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.check_profiles_structure() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_profiles_structure() TO service_role;

-- Create a function to check for NULL values in has_completed_onboarding
CREATE OR REPLACE FUNCTION public.check_null_onboarding()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT COUNT(*) as null_count
    FROM public.profiles
    WHERE has_completed_onboarding IS NULL;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.check_null_onboarding() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_null_onboarding() TO service_role;

-- Create a function to fix NULL values in has_completed_onboarding
CREATE OR REPLACE FUNCTION public.fix_null_onboarding()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.profiles
    SET has_completed_onboarding = false
    WHERE has_completed_onboarding IS NULL;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.fix_null_onboarding() TO service_role; 