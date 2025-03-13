-- Function to check if a user has completed onboarding
CREATE OR REPLACE FUNCTION check_user_onboarding(user_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  onboarding_completed BOOLEAN;
BEGIN
  -- Ensure the user_profiles table has the necessary column
  BEGIN
    ALTER TABLE public.user_profiles 
    ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT FALSE;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error adding column: %', SQLERRM;
  END;
  
  -- Check if the user has a profile
  SELECT has_completed_onboarding INTO onboarding_completed
  FROM public.user_profiles
  WHERE user_id = user_id_param;
  
  -- If no profile exists, create one with default values
  IF NOT FOUND THEN
    INSERT INTO public.user_profiles (user_id, has_completed_onboarding)
    VALUES (user_id_param, FALSE);
    RETURN FALSE;
  END IF;
  
  RETURN COALESCE(onboarding_completed, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 