-- Drop existing tables if they exist
DROP TABLE IF EXISTS user_badges;
DROP TABLE IF EXISTS badges;

-- Create badges table with correct columns
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_badges table
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Insert some initial badges
INSERT INTO badges (name, description, icon_name, category) VALUES
('Welcome Badge', 'Earned by joining Daily Glow', 'checkmark-circle-outline', 'beginner'),
('First Check-in', 'Completed your first daily check-in', 'calendar-outline', 'beginner'),
('Profile Complete', 'Filled out your profile information', 'person-outline', 'beginner'),
('Consistent User', 'Used the app for 7 consecutive days', 'time-outline', 'intermediate'),
('Reflection Master', 'Completed 30 check-ins', 'book-outline', 'intermediate'),
('Mood Tracker', 'Tracked a wide variety of emotions', 'analytics-outline', 'advanced'),
('Gratitude Expert', 'Shared 50 gratitude entries', 'heart-outline', 'advanced'),
('Daily Glow Master', 'Completed 100 check-ins', 'star-outline', 'expert'),
('Wellness Guru', 'Maintained a 30-day streak', 'flame-outline', 'master');

-- Time-specific badges
INSERT INTO badges (name, description, icon_name, category) VALUES
-- Morning badges
('Early Bird', 'Complete 5 morning check-ins', 'sunny-outline', 'beginner'),
('Morning Person', 'Complete 15 morning check-ins', 'sunny-outline', 'intermediate'),
('Sunrise Seeker', 'Complete 30 morning check-ins', 'sunny-outline', 'advanced'),
('Dawn Devotee', 'Complete 50 morning check-ins', 'sunny-outline', 'expert'),

-- Afternoon badges
('Midday Meditator', 'Complete 5 afternoon check-ins', 'partly-sunny-outline', 'beginner'),
('Afternoon Achiever', 'Complete 15 afternoon check-ins', 'partly-sunny-outline', 'intermediate'),
('Daylight Devotee', 'Complete 30 afternoon check-ins', 'partly-sunny-outline', 'advanced'),
('Solar Sentinel', 'Complete 50 afternoon check-ins', 'partly-sunny-outline', 'expert'),

-- Evening badges
('Night Owl', 'Complete 5 evening check-ins', 'moon-outline', 'beginner'),
('Twilight Tracker', 'Complete 15 evening check-ins', 'moon-outline', 'intermediate'),
('Evening Enthusiast', 'Complete 30 evening check-ins', 'moon-outline', 'advanced'),
('Midnight Master', 'Complete 50 evening check-ins', 'moon-outline', 'expert');

-- Streak badges for specific time periods
INSERT INTO badges (name, description, icon_name, category) VALUES
('Morning Streak', 'Complete 7 consecutive morning check-ins', 'sunny-outline', 'intermediate'),
('Afternoon Streak', 'Complete 7 consecutive afternoon check-ins', 'partly-sunny-outline', 'intermediate'),
('Evening Streak', 'Complete 7 consecutive evening check-ins', 'moon-outline', 'intermediate'),
('Morning Maestro', 'Complete 14 consecutive morning check-ins', 'sunny-outline', 'advanced'),
('Afternoon Ace', 'Complete 14 consecutive afternoon check-ins', 'partly-sunny-outline', 'advanced'),
('Evening Expert', 'Complete 14 consecutive evening check-ins', 'moon-outline', 'advanced');

-- Create RLS policies
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Everyone can read badges
CREATE POLICY "Anyone can read badges" 
ON badges FOR SELECT 
USING (true);

-- Only authenticated users can read their own user_badges
CREATE POLICY "Users can read their own badges" 
ON user_badges FOR SELECT 
USING (auth.uid() = user_id);

-- Only authenticated users can insert their own user_badges
CREATE POLICY "Users can insert their own badges" 
ON user_badges FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to award welcome badge on user creation
CREATE OR REPLACE FUNCTION award_welcome_badge()
RETURNS TRIGGER AS $$
DECLARE
  welcome_badge_id UUID;
BEGIN
  -- Get the welcome badge ID
  SELECT id INTO welcome_badge_id FROM badges WHERE name = 'Welcome Badge' LIMIT 1;
  
  -- Insert the user badge
  IF welcome_badge_id IS NOT NULL THEN
    INSERT INTO user_badges (user_id, badge_id)
    VALUES (NEW.id, welcome_badge_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to award welcome badge on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION award_welcome_badge(); 