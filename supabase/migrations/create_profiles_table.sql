-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_url TEXT,
    has_completed_onboarding BOOLEAN DEFAULT FALSE,
    streak INT DEFAULT 0,
    points INT DEFAULT 0,
    last_check_in TIMESTAMP WITH TIME ZONE,
    user_goals JSONB DEFAULT '[]'::jsonb,
    notification_preferences JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies for the profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own profile
CREATE POLICY "Users can read their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Policy for users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy for users to insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create trigger to update the updated_at field on update
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at_trigger
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_profiles_updated_at();

-- Add check_user_onboarding function
CREATE OR REPLACE FUNCTION check_user_onboarding(user_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  onboarding_completed BOOLEAN;
BEGIN
  SELECT has_completed_onboarding INTO onboarding_completed
  FROM profiles
  WHERE user_id = user_id_param;
  
  RETURN onboarding_completed;
END;
$$ LANGUAGE plpgsql; 