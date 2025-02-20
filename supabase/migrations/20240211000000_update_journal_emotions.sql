-- First add the new columns as nullable
ALTER TABLE journal_entries
  ADD COLUMN IF NOT EXISTS initial_emotion VARCHAR(50),
  ADD COLUMN IF NOT EXISTS post_gratitude_emotion VARCHAR(50),
  ADD COLUMN IF NOT EXISTS emotional_shift DECIMAL(3,2) DEFAULT 0;

-- Update existing entries to map old mood values to new emotion values
UPDATE journal_entries
SET 
  initial_emotion = CASE mood
    WHEN 'great' THEN 'happy'
    WHEN 'good' THEN 'peaceful'
    WHEN 'okay' THEN 'optimistic'
    WHEN 'bad' THEN 'sad'
    ELSE 'neutral'
  END,
  post_gratitude_emotion = CASE mood
    WHEN 'great' THEN 'happy'
    WHEN 'good' THEN 'peaceful'
    WHEN 'okay' THEN 'optimistic'
    WHEN 'bad' THEN 'sad'
    ELSE 'neutral'
  END,
  emotional_shift = CASE mood
    WHEN 'great' THEN 1
    WHEN 'good' THEN 0.5
    WHEN 'okay' THEN 0
    WHEN 'bad' THEN -0.5
    ELSE 0
  END;

-- Now make the columns NOT NULL after data has been migrated
ALTER TABLE journal_entries
  ALTER COLUMN initial_emotion SET NOT NULL,
  ALTER COLUMN post_gratitude_emotion SET NOT NULL,
  ALTER COLUMN emotional_shift SET NOT NULL;

-- Drop the old mood column
ALTER TABLE journal_entries DROP COLUMN IF EXISTS mood;

-- Add check constraints to ensure emotional_shift is between -1 and 1
ALTER TABLE journal_entries
  ADD CONSTRAINT emotional_shift_range 
  CHECK (emotional_shift >= -1 AND emotional_shift <= 1);

-- Add indexes for querying emotions
CREATE INDEX IF NOT EXISTS idx_journal_entries_initial_emotion 
  ON journal_entries(initial_emotion);
CREATE INDEX IF NOT EXISTS idx_journal_entries_post_emotion 
  ON journal_entries(post_gratitude_emotion);
CREATE INDEX IF NOT EXISTS idx_journal_entries_emotional_shift 
  ON journal_entries(emotional_shift);

-- Comment on columns
COMMENT ON COLUMN journal_entries.initial_emotion IS 'The emotion ID before gratitude reflection';
COMMENT ON COLUMN journal_entries.post_gratitude_emotion IS 'The emotion ID after gratitude reflection';
COMMENT ON COLUMN journal_entries.emotional_shift IS 'Numerical value between -1 and 1 representing emotional change'; 