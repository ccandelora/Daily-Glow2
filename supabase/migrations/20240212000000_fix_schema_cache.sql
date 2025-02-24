-- Drop existing functions to ensure clean slate
DROP FUNCTION IF EXISTS public.calculate_level(BIGINT) CASCADE;
DROP FUNCTION IF EXISTS public.calculate_level(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.complete_challenge(UUID, TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.update_user_stats() CASCADE;

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_user_stats_trigger ON public.user_challenges;

-- Backup existing data
CREATE TEMP TABLE IF NOT EXISTS journal_entries_backup AS
SELECT 
    id,
    created_at::text,
    user_id,
    initial_emotion,
    post_gratitude_emotion,
    emotional_shift,
    gratitude,
    note
FROM journal_entries;

CREATE TEMP TABLE IF NOT EXISTS user_challenges_backup AS
SELECT 
    id,
    user_id,
    challenge_id,
    status,
    created_at::text
FROM user_challenges;

-- Drop tables in correct order
DROP TABLE IF EXISTS public.user_challenges CASCADE;
DROP TABLE IF EXISTS public.journal_entries CASCADE;
DROP TABLE IF EXISTS public.user_stats CASCADE;

-- Ensure challenges table exists
CREATE TABLE IF NOT EXISTS public.challenges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('mood', 'gratitude', 'mindfulness', 'creative')),
    points INTEGER NOT NULL DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    active BOOLEAN DEFAULT true
);

-- Create user_stats table
CREATE TABLE public.user_stats (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    total_challenges_completed INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Recreate journal_entries table
CREATE TABLE public.journal_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    initial_emotion VARCHAR(50) NOT NULL,
    post_gratitude_emotion VARCHAR(50) NOT NULL,
    emotional_shift DECIMAL(3,2) NOT NULL DEFAULT 0,
    gratitude TEXT NOT NULL,
    note TEXT,
    CONSTRAINT emotional_shift_range CHECK (emotional_shift >= -1 AND emotional_shift <= 1)
);

-- Recreate user_challenges table
CREATE TABLE public.user_challenges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'failed')),
    response TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    points_awarded INTEGER DEFAULT 0,
    UNIQUE(user_id, challenge_id)
);

-- Enable RLS
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can only access their own entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can only access their own challenges" ON public.user_challenges;
DROP POLICY IF EXISTS "Challenges are viewable by all authenticated users" ON public.challenges;
DROP POLICY IF EXISTS "Users can only access their own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.challenges;

-- Create RLS policies
CREATE POLICY "Users can only access their own entries"
    ON public.journal_entries FOR ALL
    USING (auth.uid() = journal_entries.user_id)
    WITH CHECK (auth.uid() = journal_entries.user_id);

CREATE POLICY "Users can only access their own challenges"
    ON public.user_challenges FOR ALL
    USING (auth.uid() = user_challenges.user_id)
    WITH CHECK (auth.uid() = user_challenges.user_id);

CREATE POLICY "Challenges are viewable by all authenticated users"
    ON public.challenges FOR SELECT
    TO authenticated USING (true);

CREATE POLICY "Users can only access their own stats"
    ON public.user_stats FOR ALL
    USING (auth.uid() = user_stats.user_id)
    WITH CHECK (auth.uid() = user_stats.user_id);

-- Create level calculation function
CREATE FUNCTION calculate_level(points BIGINT) RETURNS INTEGER AS $$
BEGIN
    RETURN FLOOR(1 + SQRT(points::float/100));
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION calculate_level(points INTEGER) RETURNS INTEGER AS $$
BEGIN
    RETURN calculate_level(points::bigint);
END;
$$ LANGUAGE plpgsql;

-- Create stats update trigger function
CREATE FUNCTION update_user_stats() RETURNS TRIGGER AS $$
DECLARE
    v_user_stats RECORD;
    v_points INTEGER;
    v_total_points INTEGER;
BEGIN
    -- Only proceed if status is changing to completed
    IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
        -- Get the points from the challenge
        SELECT points INTO v_points FROM public.challenges WHERE id = NEW.challenge_id;
        
        -- Update points_awarded in the user_challenge
        NEW.points_awarded = v_points;
        
        -- Get or create user stats
        SELECT * INTO v_user_stats FROM public.user_stats WHERE user_id = NEW.user_id;
        
        -- Calculate total points including the new points
        SELECT COALESCE(SUM(points_awarded), 0) INTO v_total_points 
        FROM public.user_challenges 
        WHERE user_id = NEW.user_id 
        AND status = 'completed';
        
        -- Add the new points
        v_total_points = v_total_points + v_points;
        
        IF NOT FOUND THEN
            -- Create new user stats
            INSERT INTO public.user_stats (
                user_id,
                total_points,
                level,
                updated_at
            ) VALUES (
                NEW.user_id,
                v_points,
                calculate_level(v_points),
                NOW()
            );
        ELSE
            -- Update existing user stats
            UPDATE public.user_stats SET
                total_points = v_total_points,
                level = calculate_level(v_total_points),
                updated_at = NOW()
            WHERE user_id = NEW.user_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for both INSERT and UPDATE
DROP TRIGGER IF EXISTS update_user_stats_trigger ON public.user_challenges;
CREATE TRIGGER update_user_stats_trigger
    BEFORE INSERT OR UPDATE OF status ON public.user_challenges
    FOR EACH ROW
    EXECUTE FUNCTION update_user_stats();

-- Create challenge completion function
CREATE FUNCTION public.complete_challenge(
    p_challenge_id UUID,
    p_response TEXT,
    p_user_id UUID
) RETURNS JSONB AS $$
DECLARE
    v_challenge RECORD;
    v_user_challenge RECORD;
    v_user_stats RECORD;
    v_points INTEGER;
    v_total_points INTEGER;
BEGIN
    -- Get challenge details
    SELECT * INTO v_challenge FROM public.challenges WHERE id = p_challenge_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Challenge not found');
    END IF;

    -- Check if already completed
    SELECT * INTO v_user_challenge 
    FROM public.user_challenges 
    WHERE user_id = p_user_id AND challenge_id = p_challenge_id;

    IF FOUND AND v_user_challenge.status = 'completed' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Challenge already completed');
    END IF;

    -- Set points from challenge
    v_points := v_challenge.points;

    -- Calculate current total points
    SELECT COALESCE(SUM(points_awarded), 0) INTO v_total_points 
    FROM public.user_challenges 
    WHERE user_id = p_user_id 
    AND status = 'completed';

    -- Add new points
    v_total_points := v_total_points + v_points;

    -- Insert or update the challenge completion
    INSERT INTO public.user_challenges (
        user_id,
        challenge_id,
        status,
        response,
        completed_at,
        points_awarded
    ) VALUES (
        p_user_id,
        p_challenge_id,
        'completed',
        p_response,
        NOW(),
        v_points
    ) ON CONFLICT (user_id, challenge_id) DO UPDATE SET 
        status = 'completed',
        response = EXCLUDED.response,
        completed_at = EXCLUDED.completed_at,
        points_awarded = v_points;

    -- Update user stats
    INSERT INTO public.user_stats (
        user_id,
        total_points,
        level,
        updated_at
    ) VALUES (
        p_user_id,
        v_total_points,
        calculate_level(v_total_points),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        total_points = EXCLUDED.total_points,
        level = EXCLUDED.level,
        updated_at = EXCLUDED.updated_at
    RETURNING * INTO v_user_stats;

    -- Return updated information
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Challenge completed successfully',
        'points_awarded', v_points,
        'total_points', v_total_points,
        'level', calculate_level(v_total_points)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes
CREATE INDEX IF NOT EXISTS journal_entries_user_id_idx ON public.journal_entries(user_id);
CREATE INDEX IF NOT EXISTS journal_entries_created_at_idx ON public.journal_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_entries_initial_emotion ON journal_entries(initial_emotion);
CREATE INDEX IF NOT EXISTS idx_journal_entries_post_emotion ON journal_entries(post_gratitude_emotion);
CREATE INDEX IF NOT EXISTS idx_journal_entries_emotional_shift ON journal_entries(emotional_shift);

CREATE INDEX IF NOT EXISTS user_challenges_user_id_idx ON public.user_challenges(user_id);
CREATE INDEX IF NOT EXISTS user_challenges_challenge_id_idx ON public.user_challenges(challenge_id);
CREATE INDEX IF NOT EXISTS user_challenges_status_idx ON public.user_challenges(status);
CREATE INDEX IF NOT EXISTS user_challenges_created_at_idx ON public.user_challenges(created_at DESC);

-- Restore data
INSERT INTO journal_entries (
    id, created_at, user_id, initial_emotion, post_gratitude_emotion,
    emotional_shift, gratitude, note
) SELECT 
    id, created_at::timestamp with time zone, user_id, initial_emotion,
    post_gratitude_emotion, emotional_shift, gratitude, note
FROM journal_entries_backup 
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_challenges (
    id, user_id, challenge_id, status, created_at
) SELECT 
    id, user_id, challenge_id, status, created_at::timestamp with time zone
FROM user_challenges_backup 
ON CONFLICT (id) DO NOTHING;

-- Initialize user stats
INSERT INTO user_stats (user_id, total_challenges_completed, total_points, level)
SELECT DISTINCT 
    user_id,
    COUNT(*) FILTER (WHERE status = 'completed') as total_completed,
    COALESCE(SUM(points_awarded) FILTER (WHERE status = 'completed'), 0) as total_points,
    calculate_level(COALESCE(SUM(points_awarded) FILTER (WHERE status = 'completed'), 0))
FROM user_challenges
GROUP BY user_id
ON CONFLICT (user_id) DO UPDATE SET 
    total_challenges_completed = EXCLUDED.total_challenges_completed,
    total_points = EXCLUDED.total_points,
    level = EXCLUDED.level;

-- Cleanup
DROP TABLE IF EXISTS journal_entries_backup;
DROP TABLE IF EXISTS user_challenges_backup;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema'; 