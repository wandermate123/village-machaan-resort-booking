/*
  # Remove advance payment fields from bookings table

  1. Changes
    - Remove advance_amount column from bookings table
    - Remove remaining_amount column from bookings table
    - Remove payment_verification_notes column from bookings table
    - Remove verified_by column from bookings table
    - Remove verification_date column from bookings table
    - Update payment_status check constraint to remove advance_paid option
    - Clean up any advance payment related data

  2. Security
    - Maintains existing RLS policies
    - No changes to user permissions
*/

-- Remove advance payment specific columns
DO $$
BEGIN
  -- Remove advance_amount column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'advance_amount'
  ) THEN
    ALTER TABLE bookings DROP COLUMN advance_amount;
  END IF;

  -- Remove remaining_amount column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'remaining_amount'
  ) THEN
    ALTER TABLE bookings DROP COLUMN remaining_amount;
  END IF;

  -- Remove payment_verification_notes column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'payment_verification_notes'
  ) THEN
    ALTER TABLE bookings DROP COLUMN payment_verification_notes;
  END IF;

  -- Remove verified_by column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'verified_by'
  ) THEN
    ALTER TABLE bookings DROP COLUMN verified_by;
  END IF;

  -- Remove verification_date column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'verification_date'
  ) THEN
    ALTER TABLE bookings DROP COLUMN verification_date;
  END IF;
END $$;

-- Update payment status constraint to remove advance_paid option
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'bookings' AND constraint_name = 'bookings_payment_status_check'
  ) THEN
    ALTER TABLE bookings DROP CONSTRAINT bookings_payment_status_check;
  END IF;

  -- Add updated constraint without advance_paid
  ALTER TABLE bookings ADD CONSTRAINT bookings_payment_status_check 
    CHECK (payment_status = ANY (ARRAY['pending'::text, 'paid'::text, 'failed'::text, 'refunded'::text, 'partial_refund'::text]));
END $$;

-- Update any existing advance_paid records to paid
UPDATE bookings 
SET payment_status = 'paid', 
    updated_at = now()
WHERE payment_status = 'advance_paid';

-- Remove pending_verification status if it exists
UPDATE bookings 
SET status = 'pending', 
    updated_at = now()
WHERE status = 'pending_verification';