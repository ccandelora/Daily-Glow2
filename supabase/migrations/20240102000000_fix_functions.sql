-- Drop existing triggers first
DROP TRIGGER IF EXISTS update_streak_on_entry ON journal_entries;
DROP TRIGGER IF EXISTS check_badges_on_stats_update ON user_stats;

-- Then drop existing functions
DROP FUNCTION IF EXISTS get_or_create_user_stats(UUID);
DROP FUNCTION IF EXISTS update_user_streak();
DROP FUNCTION IF EXISTS check_and_award_badges();
DROP FUNCTION IF EXISTS get_daily_challenge(UUID);
DROP FUNCTION IF EXISTS complete_challenge(UUID, UUID, TEXT);

-- Recreate get_daily_challenge with proper date handling
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
    v_completed_today INTEGER;
    v_today DATE := CURRENT_DATE;
    v_challenge_count INTEGER;
BEGIN
    -- Check if we have any challenges at all
    SELECT COUNT(*) INTO v_challenge_count FROM challenges;
    RAISE NOTICE 'Total challenges in database: %', v_challenge_count;

    -- First, mark old in_progress challenges as failed
    UPDATE user_challenges
    SET status = 'failed'
    WHERE user_id = p_user_id
    AND status = 'in_progress'
    AND DATE(created_at) < v_today;

    -- Get count of completed challenges for today
    SELECT COUNT(*)
    INTO v_completed_today
    FROM user_challenges uc
    WHERE uc.user_id = p_user_id
    AND uc.status = 'completed'
    AND DATE(uc.completed_at) = v_today;

    RAISE NOTICE 'Completed challenges today: %', v_completed_today;

    -- Check if user has already completed 2 challenges today
    IF v_completed_today >= 2 THEN
        RAISE NOTICE 'User has completed maximum challenges for today';
        -- Return empty result if daily limit reached
        RETURN;
    END IF;

    -- Get a random challenge that hasn't been completed today
    RETURN QUERY
    WITH today_challenges AS (
        SELECT uc.challenge_id
        FROM user_challenges uc
        WHERE uc.user_id = p_user_id
        AND DATE(uc.created_at) = v_today
        AND uc.status = 'completed'
    )
    SELECT 
        c.id,
        c.title,
        c.description,
        c.type,
        c.points,
        COALESCE(uc.status, 'not_started')::TEXT as challenge_status
    FROM challenges c
    LEFT JOIN user_challenges uc ON 
        c.id = uc.challenge_id 
        AND uc.user_id = p_user_id
        AND DATE(uc.created_at) = v_today
    WHERE c.active = true
    AND c.id NOT IN (SELECT challenge_id FROM today_challenges)
    ORDER BY RANDOM()
    LIMIT 1;

    -- Log if no challenge was found
    IF NOT FOUND THEN
        RAISE NOTICE 'No eligible challenge found for user';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Recreate get_or_create_user_stats with fixed column references
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
DECLARE
    v_stats RECORD;
BEGIN
    -- First try to get existing stats
    SELECT * INTO v_stats
    FROM user_stats s
    WHERE s.user_id = p_user_id;

    -- If no stats exist, insert new ones
    IF v_stats IS NULL THEN
        INSERT INTO user_stats AS s (
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
        RETURNING 
            s.user_id,
            s.current_streak,
            s.longest_streak,
            s.total_points,
            s.total_entries,
            s.last_check_in,
            s.level,
            s.metadata;
    END IF;

    -- Return the stats
    RETURN QUERY
    SELECT 
        v_stats.user_id,
        v_stats.current_streak,
        v_stats.longest_streak,
        v_stats.total_points,
        v_stats.total_entries,
        v_stats.last_check_in,
        v_stats.level,
        v_stats.metadata;
END;
$$ LANGUAGE plpgsql;

-- Recreate update_user_streak with fixed column references
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
BEGIN
    -- Get or create user stats
    INSERT INTO user_stats (user_id)
    VALUES (NEW.user_id)
    ON CONFLICT (user_id) DO NOTHING;

    -- Update streak and last check-in
    WITH streak_update AS (
        SELECT
            CASE
                WHEN (s.last_check_in IS NULL OR 
                      s.last_check_in < CURRENT_DATE - INTERVAL '1 day') THEN 1
                ELSE s.current_streak + 1
            END as new_streak
        FROM user_stats s
        WHERE s.user_id = NEW.user_id
    )
    UPDATE user_stats s
    SET 
        current_streak = streak_update.new_streak,
        longest_streak = GREATEST(s.longest_streak, streak_update.new_streak),
        total_entries = s.total_entries + 1,
        last_check_in = NEW.created_at
    FROM streak_update
    WHERE s.user_id = NEW.user_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate check_and_award_badges with fixed column references
CREATE OR REPLACE FUNCTION check_and_award_badges()
RETURNS TRIGGER AS $$
DECLARE
    badge_record RECORD;
    user_stat RECORD;
BEGIN
    -- Get user stats
    SELECT * INTO user_stat 
    FROM user_stats s 
    WHERE s.user_id = NEW.user_id;
    
    -- Check each badge
    FOR badge_record IN SELECT * FROM badges LOOP
        -- Skip if user already has this badge
        IF EXISTS (
            SELECT 1 
            FROM user_badges b
            WHERE b.user_id = NEW.user_id 
            AND b.badge_id = badge_record.id
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
                    INSERT INTO notifications (
                        user_id, 
                        type, 
                        title, 
                        message, 
                        metadata
                    )
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
                    UPDATE user_stats s
                    SET total_points = s.total_points + badge_record.points
                    WHERE s.user_id = NEW.user_id;
                END IF;
            WHEN 'entries' THEN
                IF user_stat.total_entries >= badge_record.requirement_count THEN
                    -- Award badge
                    INSERT INTO user_badges (user_id, badge_id)
                    VALUES (NEW.user_id, badge_record.id);
                    
                    -- Create notification
                    INSERT INTO notifications (
                        user_id, 
                        type, 
                        title, 
                        message, 
                        metadata
                    )
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
                    UPDATE user_stats s
                    SET total_points = s.total_points + badge_record.points
                    WHERE s.user_id = NEW.user_id;
                END IF;
            WHEN 'challenges' THEN
                -- Check completed challenges count
                IF (
                    SELECT COUNT(*) 
                    FROM user_challenges c
                    WHERE c.user_id = NEW.user_id 
                    AND c.status = 'completed'
                ) >= badge_record.requirement_count THEN
                    -- Award badge
                    INSERT INTO user_badges (user_id, badge_id)
                    VALUES (NEW.user_id, badge_record.id);
                    
                    -- Create notification
                    INSERT INTO notifications (
                        user_id, 
                        type, 
                        title, 
                        message, 
                        metadata
                    )
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
                    UPDATE user_stats s
                    SET total_points = s.total_points + badge_record.points
                    WHERE s.user_id = NEW.user_id;
                END IF;
            ELSE
                CONTINUE;
        END CASE;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate complete_challenge with validation
CREATE OR REPLACE FUNCTION complete_challenge(p_user_id UUID, p_challenge_id UUID, p_response TEXT DEFAULT NULL)
RETURNS SETOF user_stats AS $$
DECLARE
    v_challenge_points INTEGER;
    v_user_stats user_stats;
    v_completed_today INTEGER;
    v_points_before INTEGER;
    v_points_after INTEGER;
BEGIN
    -- Check if user has already completed 2 challenges today
    SELECT COUNT(*)
    INTO v_completed_today
    FROM user_challenges
    WHERE user_id = p_user_id
    AND status = 'completed'
    AND DATE(completed_at) = CURRENT_DATE;

    IF v_completed_today >= 2 THEN
        RAISE EXCEPTION 'Daily challenge limit reached (2 per day)';
    END IF;

    -- Get current points
    SELECT total_points INTO v_points_before
    FROM user_stats
    WHERE user_id = p_user_id;
    
    RAISE NOTICE 'Points before completion: %', v_points_before;

    -- Get challenge points
    SELECT points INTO v_challenge_points
    FROM challenges
    WHERE id = p_challenge_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Challenge not found';
    END IF;

    -- Create or update user challenge entry
    INSERT INTO user_challenges (user_id, challenge_id, status, response, completed_at)
    VALUES (p_user_id, p_challenge_id, 'completed', p_response, NOW())
    ON CONFLICT (user_id, challenge_id) 
    WHERE DATE(created_at) = CURRENT_DATE
    DO UPDATE SET 
        status = 'completed',
        response = EXCLUDED.response,
        completed_at = EXCLUDED.completed_at;

    -- Update user stats
    UPDATE user_stats
    SET 
        total_points = total_points + v_challenge_points,
        total_challenges_completed = COALESCE(total_challenges_completed, 0) + 1,
        level = FLOOR((total_points + v_challenge_points) / 100) + 1
    WHERE user_id = p_user_id
    RETURNING * INTO v_user_stats;

    -- Get points after update
    SELECT total_points INTO v_points_after
    FROM user_stats
    WHERE user_id = p_user_id;
    
    RAISE NOTICE 'Challenge found with % points', v_challenge_points;
    RAISE NOTICE 'Points updated from % to %', v_points_before, v_points_after;

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
        'You earned ' || v_challenge_points || ' points for completing a challenge.',
        jsonb_build_object(
            'challenge_id', p_challenge_id,
            'points_earned', v_challenge_points
        )
    );

    RAISE NOTICE 'Achievement notification created';
    RAISE NOTICE 'Achievement record created';

    RETURN NEXT v_user_stats;
END;
$$ LANGUAGE plpgsql;

-- First, add completion_text column to user_challenges if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_challenges' 
        AND column_name = 'completion_text'
    ) THEN
        ALTER TABLE user_challenges ADD COLUMN completion_text TEXT;
    END IF;
END $$;

-- Finally, recreate triggers
CREATE TRIGGER update_streak_on_entry
    AFTER INSERT ON journal_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_user_streak();

CREATE TRIGGER check_badges_on_stats_update
    AFTER UPDATE ON user_stats
    FOR EACH ROW
    EXECUTE FUNCTION check_and_award_badges();

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own achievements" ON user_achievements;
DROP POLICY IF EXISTS "System can insert achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can view their own badges" ON user_badges;
DROP POLICY IF EXISTS "System can insert badges" ON user_badges;
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view their own stats" ON user_stats;
DROP POLICY IF EXISTS "System can manage user stats" ON user_stats;

-- Enable RLS
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own achievements"
ON user_achievements
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert achievements"
ON user_achievements
FOR INSERT
WITH CHECK (true);  -- Allow system functions to insert achievements

CREATE POLICY "Users can view their own badges"
ON user_badges
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert badges"
ON user_badges
FOR INSERT
WITH CHECK (true);  -- Allow system functions to insert badges

CREATE POLICY "Users can view their own notifications"
ON notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
ON notifications
FOR INSERT
WITH CHECK (true);  -- Allow system functions to insert notifications

CREATE POLICY "Users can view their own stats"
ON user_stats
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can manage user stats"
ON user_stats
FOR ALL
WITH CHECK (true);  -- Allow system functions to manage stats

-- Set security definer on functions that need to bypass RLS
ALTER FUNCTION get_or_create_user_stats(UUID) SECURITY DEFINER;
ALTER FUNCTION update_user_streak() SECURITY DEFINER;
ALTER FUNCTION check_and_award_badges() SECURITY DEFINER;
ALTER FUNCTION complete_challenge(UUID, UUID, TEXT) SECURITY DEFINER;

-- Add diagnostic function
CREATE OR REPLACE FUNCTION check_challenges_status()
RETURNS TABLE (
    total_challenges BIGINT,
    active_challenges BIGINT,
    challenge_types TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT as total_challenges,
        COUNT(*) FILTER (WHERE active = true)::BIGINT as active_challenges,
        ARRAY_AGG(DISTINCT type) as challenge_types
    FROM challenges;
END;
$$ LANGUAGE plpgsql; 