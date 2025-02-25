-- Create user_streaks table to track streaks by time period
CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  morning_streak INTEGER NOT NULL DEFAULT 0,
  afternoon_streak INTEGER NOT NULL DEFAULT 0,
  evening_streak INTEGER NOT NULL DEFAULT 0,
  last_morning_check_in TIMESTAMP WITH TIME ZONE,
  last_afternoon_check_in TIMESTAMP WITH TIME ZONE,
  last_evening_check_in TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create RLS policies
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can read their own streaks
CREATE POLICY "Users can read their own streaks" 
ON user_streaks FOR SELECT 
USING (auth.uid() = user_id);

-- Only authenticated users can update their own streaks
CREATE POLICY "Users can update their own streaks" 
ON user_streaks FOR UPDATE
USING (auth.uid() = user_id);

-- Only authenticated users can insert their own streaks
CREATE POLICY "Users can insert their own streaks" 
ON user_streaks FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_streaks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_user_streaks_updated_at
BEFORE UPDATE ON user_streaks
FOR EACH ROW
EXECUTE FUNCTION update_user_streaks_updated_at(); 