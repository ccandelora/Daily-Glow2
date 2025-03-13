-- Function to add a column to a table if it doesn't exist
CREATE OR REPLACE FUNCTION add_column_if_not_exists(
  table_name text,
  column_name text,
  column_type text,
  column_default text DEFAULT NULL
) RETURNS void AS $$
DECLARE
  column_exists boolean;
BEGIN
  -- Check if the column already exists
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = $1
    AND column_name = $2
  ) INTO column_exists;
  
  -- If the column doesn't exist, add it
  IF NOT column_exists THEN
    EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s %s', 
      table_name, 
      column_name, 
      column_type, 
      CASE WHEN column_default IS NOT NULL THEN 'DEFAULT ' || column_default ELSE '' END
    );
    RAISE NOTICE 'Column % added to table %', column_name, table_name;
  ELSE
    RAISE NOTICE 'Column % already exists in table %', column_name, table_name;
  END IF;
END;
$$ LANGUAGE plpgsql; 