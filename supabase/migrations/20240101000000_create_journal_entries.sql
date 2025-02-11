-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- Drop existing tables if they exist
drop table if exists public.journal_entries cascade;
drop table if exists public.challenges cascade;
drop table if exists public.user_achievements cascade;
drop table if exists public.user_challenges cascade;
drop table if exists public.user_stats cascade;
drop table if exists public.badges cascade;
drop table if exists public.user_badges cascade;
drop table if exists public.notifications cascade;

-- Create journal entries table
create table public.journal_entries (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    mood text not null,
    gratitude text not null,
    note text,
    constraint mood_check check (mood in ('great', 'good', 'okay', 'bad'))
);

-- Create challenges table
CREATE TABLE challenges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('mood', 'gratitude', 'mindfulness', 'creative')),
    points INTEGER NOT NULL DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    active BOOLEAN DEFAULT true
);

-- Create badges table
CREATE TABLE badges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('streak', 'entries', 'challenges', 'special')),
    requirement_count INTEGER NOT NULL DEFAULT 1,
    points INTEGER NOT NULL DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create user-related tables
CREATE TABLE user_achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('streak', 'challenge', 'milestone')),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    points INTEGER NOT NULL DEFAULT 0,
    achieved_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE user_challenges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'failed')),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(user_id, challenge_id)
);

CREATE TABLE user_stats (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    total_entries INTEGER DEFAULT 0,
    last_check_in TIMESTAMP WITH TIME ZONE,
    level INTEGER DEFAULT 1,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE user_badges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(user_id, badge_id)
);

CREATE TABLE notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('achievement', 'badge', 'streak', 'reminder')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes
create index if not exists journal_entries_user_id_idx on public.journal_entries(user_id);
create index if not exists journal_entries_created_at_idx on public.journal_entries(created_at desc);

-- Enable Row Level Security (RLS)
alter table public.journal_entries enable row level security;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can only access their own entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can view their own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can view their own challenges" ON user_challenges;
DROP POLICY IF EXISTS "Users can update their own challenges" ON user_challenges;
DROP POLICY IF EXISTS "Users can insert their own challenges" ON user_challenges;
DROP POLICY IF EXISTS "Users can view their own stats" ON user_stats;
DROP POLICY IF EXISTS "Users can insert their own stats" ON user_stats;
DROP POLICY IF EXISTS "Users can update their own stats" ON user_stats;
DROP POLICY IF EXISTS "Users can view their own badges" ON user_badges;
DROP POLICY IF EXISTS "Users can insert their own badges" ON user_badges;
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON notifications;

-- Create RLS policies
CREATE POLICY "Users can only access their own entries"
    ON public.journal_entries
    FOR ALL
    USING (auth.uid() = journal_entries.user_id)
    WITH CHECK (auth.uid() = journal_entries.user_id);

CREATE POLICY "Challenges are viewable by all authenticated users"
    ON challenges FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Badges are viewable by all authenticated users"
    ON badges FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can view their own achievements"
    ON user_achievements
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_achievements.user_id);

CREATE POLICY "Users can view their own challenges"
    ON user_challenges
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_challenges.user_id);

CREATE POLICY "Users can update their own challenges"
    ON user_challenges
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_challenges.user_id);

CREATE POLICY "Users can insert their own challenges"
    ON user_challenges
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_challenges.user_id);

CREATE POLICY "Users can view their own stats"
    ON user_stats
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_stats.user_id);

CREATE POLICY "Users can insert their own stats"
    ON user_stats
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_stats.user_id);

CREATE POLICY "Users can update their own stats"
    ON user_stats
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_stats.user_id);

CREATE POLICY "Users can view their own badges"
    ON user_badges
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_badges.user_id);

CREATE POLICY "Users can insert their own badges"
    ON user_badges
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_badges.user_id);

CREATE POLICY "Users can view their own notifications"
    ON notifications
    FOR SELECT
    TO authenticated
    USING (auth.uid() = notifications.user_id);

CREATE POLICY "Users can update their own notifications"
    ON notifications
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = notifications.user_id);

CREATE POLICY "Users can insert their own notifications"
    ON notifications
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = notifications.user_id);

-- Insert initial data
INSERT INTO challenges (title, description, type, points) VALUES
    ('Morning Reflection', 'Start your day by reflecting on what you''re looking forward to', 'mood', 10),
    ('Gratitude Chain', 'List three things you''re grateful for that are connected to each other', 'gratitude', 15),
    ('Mindful Moment', 'Take a 5-minute break to practice mindfulness and record your feelings', 'mindfulness', 20),
    ('Creative Expression', 'Write a short poem or story about your current emotional state', 'creative', 25);

INSERT INTO badges (name, description, icon, type, requirement_count, points) VALUES
    ('Early Bird', 'Complete your first morning reflection', 'sunrise-outline', 'entries', 1, 50),
    ('Gratitude Master', 'Complete 10 gratitude entries', 'heart-outline', 'entries', 10, 100),
    ('Mindfulness Explorer', 'Try all mindfulness exercises', 'leaf-outline', 'challenges', 5, 150),
    ('Streak Champion', 'Maintain a 7-day streak', 'flame-outline', 'streak', 7, 200),
    ('Creative Soul', 'Complete 5 creative challenges', 'brush-outline', 'challenges', 5, 150),
    ('Reflection Guru', 'Complete 30 daily entries', 'star-outline', 'entries', 30, 300),
    ('Consistency King', 'Maintain a 30-day streak', 'trophy-outline', 'streak', 30, 500);

-- Create functions and triggers
DROP FUNCTION IF EXISTS get_or_create_user_stats(UUID);

CREATE OR REPLACE FUNCTION get_or_create_user_stats(p_user_id UUID)
RETURNS TABLE (
  user_id UUID,
  current_streak INTEGER,
  longest_streak INTEGER,
  total_points INTEGER,
  total_entries INTEGER,
  last_check_in TIMESTAMP WITH TIME ZONE,
  level INTEGER,
  metadata JSONB
) AS $$
BEGIN
  -- Insert without table alias
  INSERT INTO user_stats (
    user_id,
    current_streak,
    longest_streak,
    total_points,
    total_entries,
    level,
    metadata
  )
  VALUES (
    p_user_id,
    0,
    0,
    0,
    0,
    1,
    '{}'::jsonb
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Return the stats with explicit table alias
  RETURN QUERY
  SELECT 
    us.user_id,
    us.current_streak,
    us.longest_streak,
    us.total_points,
    us.total_entries,
    us.last_check_in,
    us.level,
    us.metadata
  FROM user_stats us
  WHERE us.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
BEGIN
    -- Get or create user stats (removed table alias from INSERT)
    INSERT INTO user_stats (user_id)
    VALUES (NEW.user_id)
    ON CONFLICT (user_id) DO NOTHING;

    -- Update streak and last check-in
    WITH streak_update AS (
        SELECT
            CASE
                WHEN (us.last_check_in IS NULL OR 
                      us.last_check_in < CURRENT_DATE - INTERVAL '1 day') THEN 1
                ELSE us.current_streak + 1
            END as new_streak
        FROM user_stats us
        WHERE us.user_id = NEW.user_id
    )
    UPDATE user_stats us
    SET 
        current_streak = streak_update.new_streak,
        longest_streak = GREATEST(us.longest_streak, streak_update.new_streak),
        total_entries = us.total_entries + 1,
        last_check_in = NEW.created_at
    FROM streak_update
    WHERE us.user_id = NEW.user_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_and_award_badges()
RETURNS TRIGGER AS $$
DECLARE
    badge_record RECORD;
    user_stat RECORD;
BEGIN
    -- Get user stats
    SELECT * INTO user_stat FROM user_stats us WHERE us.user_id = NEW.user_id;
    
    -- Check each badge
    FOR badge_record IN SELECT * FROM badges LOOP
        -- Skip if user already has this badge
        IF EXISTS (
            SELECT 1 FROM user_badges ub 
            WHERE ub.user_id = NEW.user_id 
            AND ub.badge_id = badge_record.id
        ) THEN
            CONTINUE;
        END IF;
        
        -- Check requirements
        CASE badge_record.type
            WHEN 'streak' THEN
                IF user_stat.current_streak >= badge_record.requirement_count THEN
                    -- Award badge
                    INSERT INTO user_badges (user_id, badge_id)
                    VALUES (NEW.user_id, badge_record.id);
                    
                    -- Create notification
                    INSERT INTO notifications (user_id, type, title, message, metadata)
                    VALUES (
                        NEW.user_id,
                        'badge',
                        'New Badge Unlocked!',
                        format('You''ve earned the %s badge!', badge_record.name),
                        jsonb_build_object(
                            'badge_id', badge_record.id,
                            'badge_name', badge_record.name,
                            'badge_icon', badge_record.icon,
                            'points', badge_record.points
                        )
                    );
                    
                    -- Update user points
                    UPDATE user_stats us
                    SET total_points = us.total_points + badge_record.points
                    WHERE us.user_id = NEW.user_id;
                END IF;
            WHEN 'entries' THEN
                IF user_stat.total_entries >= badge_record.requirement_count THEN
                    -- Award badge and create notification
                    INSERT INTO user_badges (user_id, badge_id)
                    VALUES (NEW.user_id, badge_record.id);
                    
                    INSERT INTO notifications (user_id, type, title, message, metadata)
                    VALUES (
                        NEW.user_id,
                        'badge',
                        'New Badge Unlocked!',
                        format('You''ve earned the %s badge!', badge_record.name),
                        jsonb_build_object(
                            'badge_id', badge_record.id,
                            'badge_name', badge_record.name,
                            'badge_icon', badge_record.icon,
                            'points', badge_record.points
                        )
                    );
                    
                    UPDATE user_stats us
                    SET total_points = us.total_points + badge_record.points
                    WHERE us.user_id = NEW.user_id;
                END IF;
            WHEN 'challenges' THEN
                -- Check completed challenges count
                IF (
                    SELECT COUNT(*) FROM user_challenges uc
                    WHERE uc.user_id = NEW.user_id 
                    AND uc.status = 'completed'
                ) >= badge_record.requirement_count THEN
                    -- Award badge
                    INSERT INTO user_badges (user_id, badge_id)
                    VALUES (NEW.user_id, badge_record.id);
                    
                    -- Create notification
                    INSERT INTO notifications (user_id, type, title, message, metadata)
                    VALUES (
                        NEW.user_id,
                        'badge',
                        'New Badge Unlocked!',
                        format('You''ve earned the %s badge!', badge_record.name),
                        jsonb_build_object(
                            'badge_id', badge_record.id,
                            'badge_name', badge_record.name,
                            'badge_icon', badge_record.icon,
                            'points', badge_record.points
                        )
                    );
                    
                    -- Update user points
                    UPDATE user_stats us
                    SET total_points = us.total_points + badge_record.points
                    WHERE us.user_id = NEW.user_id;
                END IF;
            ELSE
                CONTINUE;
        END CASE;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_streak_on_entry
    AFTER INSERT ON journal_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_user_streak();

CREATE TRIGGER check_badges_on_stats_update
    AFTER UPDATE ON user_stats
    FOR EACH ROW
    EXECUTE FUNCTION check_and_award_badges();

-- Add new functions for challenge management
DROP FUNCTION IF EXISTS get_daily_challenge(UUID);

CREATE OR REPLACE FUNCTION get_daily_challenge(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    type TEXT,
    points INTEGER,
    challenge_status TEXT
) AS $$
DECLARE
    v_challenge_id UUID;
    v_today DATE := CURRENT_DATE;
BEGIN
    -- First, check if user already has an active challenge for today
    SELECT uc.challenge_id INTO v_challenge_id
    FROM user_challenges uc
    WHERE uc.user_id = p_user_id
    AND DATE(uc.created_at) = v_today
    AND uc.status = 'in_progress'
    LIMIT 1;

    -- If no active challenge, assign a new one
    IF v_challenge_id IS NULL THEN
        -- Get a random challenge the user hasn't completed
        SELECT c.id INTO v_challenge_id
        FROM challenges c
        WHERE c.active = true
        AND NOT EXISTS (
            SELECT 1 FROM user_challenges uc
            WHERE uc.challenge_id = c.id
            AND uc.user_id = p_user_id
            AND uc.status = 'completed'
        )
        ORDER BY RANDOM()
        LIMIT 1;

        -- If we found a challenge, create it for the user
        IF v_challenge_id IS NOT NULL THEN
            INSERT INTO user_challenges (user_id, challenge_id, status)
            VALUES (p_user_id, v_challenge_id, 'in_progress');
        END IF;
    END IF;

    -- Return the challenge details
    RETURN QUERY
    SELECT 
        c.id,
        c.title,
        c.description,
        c.type,
        c.points,
        COALESCE(uc.status, 'not_started')::TEXT AS challenge_status
    FROM challenges c
    LEFT JOIN user_challenges uc ON uc.challenge_id = c.id AND uc.user_id = p_user_id
    WHERE c.id = v_challenge_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION complete_challenge(p_user_id UUID, p_challenge_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_challenge RECORD;
    v_already_completed BOOLEAN;
BEGIN
    -- Check if challenge exists and is active
    SELECT * INTO v_challenge
    FROM challenges
    WHERE id = p_challenge_id AND active = true;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Check if already completed
    SELECT EXISTS (
        SELECT 1 FROM user_challenges
        WHERE user_id = p_user_id
        AND challenge_id = p_challenge_id
        AND status = 'completed'
    ) INTO v_already_completed;

    IF v_already_completed THEN
        RETURN FALSE;
    END IF;

    -- Update or insert the challenge completion
    INSERT INTO user_challenges (user_id, challenge_id, status, completed_at)
    VALUES (p_user_id, p_challenge_id, 'completed', NOW())
    ON CONFLICT (user_id, challenge_id)
    DO UPDATE SET 
        status = 'completed',
        completed_at = NOW();

    -- Update user stats
    UPDATE user_stats
    SET 
        total_points = total_points + v_challenge.points
    WHERE user_id = p_user_id;

    -- Create achievement notification
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        metadata
    ) VALUES (
        p_user_id,
        'achievement',
        'Challenge Completed!',
        format('You completed the "%s" challenge and earned %s points!', v_challenge.title, v_challenge.points),
        jsonb_build_object(
            'challenge_id', v_challenge.id,
            'challenge_title', v_challenge.title,
            'points', v_challenge.points,
            'type', v_challenge.type
        )
    );

    -- Create achievement record
    INSERT INTO user_achievements (
        user_id,
        type,
        name,
        description,
        points
    ) VALUES (
        p_user_id,
        'challenge',
        format('Completed %s', v_challenge.title),
        format('Successfully completed the %s challenge', v_challenge.title),
        v_challenge.points
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create a function to reset daily challenges
CREATE OR REPLACE FUNCTION reset_daily_challenges()
RETURNS void AS $$
BEGIN
    -- Mark all in_progress challenges older than 24 hours as failed
    UPDATE user_challenges
    SET status = 'failed'
    WHERE status = 'in_progress'
    AND created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Add more initial challenges with varied types
INSERT INTO challenges (title, description, type, points) VALUES
    ('Positive Reflection', 'Write about a positive experience from today', 'mood', 15),
    ('Three Good Things', 'List three good things that happened today', 'gratitude', 20),
    ('Breathing Exercise', 'Complete a 2-minute deep breathing exercise', 'mindfulness', 25),
    ('Emotion Journal', 'Write a detailed entry about your emotions today', 'creative', 30),
    ('Gratitude Letter', 'Write a short thank you note to someone', 'gratitude', 35),
    ('Body Scan', 'Complete a 5-minute body scan meditation', 'mindfulness', 40),
    ('Mood Timeline', 'Track your mood changes throughout the day', 'mood', 45),
    ('Creative Visualization', 'Visualize and describe your perfect day', 'creative', 50); 