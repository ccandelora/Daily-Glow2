-- Migration to reset onboarding status for testing
-- This is commented out by default to prevent accidental execution
-- Uncomment to reset all users' onboarding status

/*
UPDATE public.profiles
SET has_completed_onboarding = false;
*/

-- Create a function to reset onboarding status for a specific user
CREATE OR REPLACE FUNCTION public.reset_user_onboarding(user_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET has_completed_onboarding = false
  WHERE user_id = user_id_param;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.reset_user_onboarding(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_user_onboarding(UUID) TO service_role;

-- Create a function to reset all users' onboarding status
CREATE OR REPLACE FUNCTION public.reset_all_onboarding()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET has_completed_onboarding = false;
END;
$$;

-- Grant execute permission to service_role only (not regular users)
GRANT EXECUTE ON FUNCTION public.reset_all_onboarding() TO service_role; 