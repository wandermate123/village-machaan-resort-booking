/*
  # Add images column to packages table

  1. Changes
    - Add `images` column to `packages` table as text array
    - Set default value as empty array
    - Update existing packages with demo images

  2. Security
    - No changes to existing RLS policies needed
*/

-- Add images column to packages table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'packages' AND column_name = 'images'
  ) THEN
    ALTER TABLE packages ADD COLUMN images text[] DEFAULT '{}';
  END IF;
END $$;

-- Update existing packages with demo images
UPDATE packages 
SET images = ARRAY['/images/glass-cottage/main.jpg']
WHERE id = 'basic-stay' AND (images IS NULL OR array_length(images, 1) IS NULL);

UPDATE packages 
SET images = ARRAY['/images/hornbill/main.jpg']
WHERE id = 'breakfast-package' AND (images IS NULL OR array_length(images, 1) IS NULL);