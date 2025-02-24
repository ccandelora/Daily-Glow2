-- First, make sure the time_period type exists
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'time_period') THEN
        CREATE TYPE time_period AS ENUM ('MORNING', 'AFTERNOON', 'EVENING');
    END IF;
END $$;

-- Make sure the column exists with the correct type
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'journal_entries' 
        AND column_name = 'time_period'
    ) THEN
        ALTER TABLE journal_entries ADD COLUMN time_period time_period;
    END IF;
END $$;

-- Update all existing entries with the appropriate time period based on created_at time
UPDATE journal_entries
SET time_period = 
    CASE 
        WHEN EXTRACT(HOUR FROM created_at AT TIME ZONE 'UTC') BETWEEN 5 AND 11 THEN 'MORNING'::time_period
        WHEN EXTRACT(HOUR FROM created_at AT TIME ZONE 'UTC') BETWEEN 12 AND 16 THEN 'AFTERNOON'::time_period
        ELSE 'EVENING'::time_period
    END
WHERE time_period IS NULL;

-- Make the column required
ALTER TABLE journal_entries 
ALTER COLUMN time_period SET NOT NULL,
ALTER COLUMN time_period SET DEFAULT 'MORNING'::time_period; 