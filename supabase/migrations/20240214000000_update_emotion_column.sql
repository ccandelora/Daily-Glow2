-- Check if post_gratitude_emotion exists and if so, migrate the data
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'journal_entries'
        AND column_name = 'post_gratitude_emotion'
    ) THEN
        -- Update any null secondary_emotion with data from post_gratitude_emotion
        UPDATE journal_entries
        SET secondary_emotion = post_gratitude_emotion
        WHERE secondary_emotion IS NULL;

        -- Drop the old column
        ALTER TABLE journal_entries
        DROP COLUMN post_gratitude_emotion;
    END IF;
END $$;

-- Ensure secondary_emotion is NOT NULL
ALTER TABLE journal_entries
ALTER COLUMN secondary_emotion SET NOT NULL; 