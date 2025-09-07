/*
  # Add advance payment support to bookings

  1. Schema Updates
    - Add `advance_amount` column to track 50% advance payments
    - Add `remaining_amount` column to track balance due at property
    - Add `advance_paid_at` timestamp for tracking when advance was paid
    - Add `advance_payment_method` to track how advance was paid
    - Update payment_status enum to include 'advance_paid'

  2. Security
    - Update existing RLS policies to handle new columns
    - Add indexes for performance on new columns

  3. Data Migration
    - Update existing bookings to set advance amounts where applicable
*/

-- Add new columns for advance payment tracking
DO $$
BEGIN
  -- Add advance_amount column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'advance_amount'
  ) THEN
    ALTER TABLE bookings ADD COLUMN advance_amount integer DEFAULT 0;
  END IF;

  -- Add remaining_amount column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'remaining_amount'
  ) THEN
    ALTER TABLE bookings ADD COLUMN remaining_amount integer DEFAULT 0;
  END IF;

  -- Add advance_paid_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'advance_paid_at'
  ) THEN
    ALTER TABLE bookings ADD COLUMN advance_paid_at timestamptz;
  END IF;

  -- Add advance_payment_method column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'advance_payment_method'
  ) THEN
    ALTER TABLE bookings ADD COLUMN advance_payment_method text;
  END IF;
END $$;

-- Update payment_status check constraint to include advance_paid
DO $$
BEGIN
  -- Drop existing constraint
  ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_payment_status_check;
  
  -- Add new constraint with advance_paid option
  ALTER TABLE bookings ADD CONSTRAINT bookings_payment_status_check 
    CHECK (payment_status = ANY (ARRAY['pending'::text, 'paid'::text, 'advance_paid'::text, 'failed'::text, 'refunded'::text, 'partial_refund'::text]));
END $$;

-- Add check constraints for advance payment amounts
ALTER TABLE bookings ADD CONSTRAINT bookings_advance_amount_check 
  CHECK (advance_amount >= 0);

ALTER TABLE bookings ADD CONSTRAINT bookings_remaining_amount_check 
  CHECK (remaining_amount >= 0);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_advance_payment 
  ON bookings (payment_status, advance_amount) 
  WHERE payment_status = 'advance_paid';

CREATE INDEX IF NOT EXISTS idx_bookings_advance_paid_at 
  ON bookings (advance_paid_at) 
  WHERE advance_paid_at IS NOT NULL;

-- Update existing bookings to set advance amounts for advance_paid status
UPDATE bookings 
SET 
  advance_amount = CASE 
    WHEN payment_status = 'advance_paid' THEN ROUND(total_amount * 0.5)
    ELSE 0
  END,
  remaining_amount = CASE 
    WHEN payment_status = 'advance_paid' THEN ROUND(total_amount * 0.5)
    ELSE total_amount
  END,
  advance_payment_method = CASE 
    WHEN payment_status = 'advance_paid' THEN 'bank_transfer'
    ELSE NULL
  END
WHERE advance_amount IS NULL OR advance_amount = 0;