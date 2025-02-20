-- Add time_period enum type
CREATE TYPE time_period AS ENUM ('MORNING', 'AFTERNOON', 'EVENING');

-- Add time_period column to journal_entries
ALTER TABLE journal_entries
ADD COLUMN time_period time_period NOT NULL DEFAULT 'MORNING'::time_period;

-- Update existing entries based on their created_at time
UPDATE journal_entries
SET time_period = 
  CASE 
    WHEN EXTRACT(HOUR FROM created_at) BETWEEN 5 AND 11 THEN 'MORNING'::time_period
    WHEN EXTRACT(HOUR FROM created_at) BETWEEN 12 AND 16 THEN 'AFTERNOON'::time_period
    ELSE 'EVENING'::time_period
  END; 