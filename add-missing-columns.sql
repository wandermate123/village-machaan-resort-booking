-- =====================================================
-- ADD MISSING COLUMNS TO EXISTING VILLA_INVENTORY TABLE
-- Run this first to add the missing columns
-- =====================================================

-- 1. Add missing columns to existing villa_inventory table
ALTER TABLE villa_inventory 
ADD COLUMN IF NOT EXISTS bedroom_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_occupancy INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS check_in_time TIME DEFAULT '13:30:00',
ADD COLUMN IF NOT EXISTS check_out_time TIME DEFAULT '11:30:00';

-- 2. Update existing records with default values
UPDATE villa_inventory 
SET 
  bedroom_count = 1,
  max_occupancy = 2,
  check_in_time = '13:30:00',
  check_out_time = '11:30:00'
WHERE bedroom_count IS NULL OR max_occupancy IS NULL OR check_in_time IS NULL OR check_out_time IS NULL;

-- 3. Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_villa_inventory_bedroom_count ON villa_inventory(bedroom_count);
CREATE INDEX IF NOT EXISTS idx_villa_inventory_max_occupancy ON villa_inventory(max_occupancy);

-- 4. Verify the columns were added
DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'villa_inventory' 
    AND column_name = 'bedroom_count'
  ) INTO column_exists;
  
  IF column_exists THEN
    RAISE NOTICE 'Successfully added missing columns to villa_inventory table!';
    RAISE NOTICE 'Added: bedroom_count, max_occupancy, check_in_time, check_out_time';
  ELSE
    RAISE NOTICE 'Error: Columns were not added successfully';
  END IF;
END $$;


