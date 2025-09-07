/*
  # Add 50% Advance Payment System

  1. New Fields
    - `advance_amount` (integer) - Amount paid as advance
    - `payment_verification_notes` (text) - Admin notes for payment verification
    - `verified_by` (uuid) - Reference to admin who verified payment
    - `verification_date` (timestamptz) - When payment was verified

  2. Updated Constraints
    - Payment status constraint updated to include 'advance_paid'
    - Booking status constraint updated to include 'pending_verification'
    - Added check constraint for advance_amount >= 0

  3. Performance
    - Added index for advance payment queries
    - Foreign key constraint for verified_by field

  4. Security
    - Existing RLS policies will handle advance payment operations
*/

-- Add advance_amount field if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'advance_amount'
  ) THEN
    ALTER TABLE bookings ADD COLUMN advance_amount integer DEFAULT 0;
  END IF;
END $$;

-- Add payment_verification_notes field if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'payment_verification_notes'
  ) THEN
    ALTER TABLE bookings ADD COLUMN payment_verification_notes text;
  END IF;
END $$;

-- Add verified_by field if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'verified_by'
  ) THEN
    ALTER TABLE bookings ADD COLUMN verified_by uuid;
  END IF;
END $$;

-- Add verification_date field if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'verification_date'
  ) THEN
    ALTER TABLE bookings ADD COLUMN verification_date timestamptz;
  END IF;
END $$;

-- Add foreign key constraint for verified_by if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'bookings_verified_by_fkey'
  ) THEN
    ALTER TABLE bookings ADD CONSTRAINT bookings_verified_by_fkey 
    FOREIGN KEY (verified_by) REFERENCES admin_users(id);
  END IF;
END $$;

-- Add check constraint for advance_amount if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'bookings_advance_amount_check'
  ) THEN
    ALTER TABLE bookings ADD CONSTRAINT bookings_advance_amount_check 
    CHECK (advance_amount >= 0);
  END IF;
END $$;

-- Update payment_status constraint to include advance_paid
DO $$
BEGIN
  -- Drop existing constraint if it exists
  ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_payment_status_check;
  
  -- Add updated constraint with advance_paid
  ALTER TABLE bookings ADD CONSTRAINT bookings_payment_status_check 
  CHECK (payment_status = ANY (ARRAY['pending'::text, 'paid'::text, 'failed'::text, 'refunded'::text, 'partial_refund'::text, 'advance_paid'::text]));
END $$;

-- Update status constraint to include pending_verification
DO $$
BEGIN
  -- Drop existing constraint if it exists
  ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
  
  -- Add updated constraint with pending_verification
  ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
  CHECK (status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'cancelled'::text, 'completed'::text, 'no_show'::text, 'pending_verification'::text]));
END $$;

-- Create index for advance payment queries if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_bookings_advance_payment 
ON bookings (payment_status, status) 
WHERE payment_status = 'advance_paid' AND status = 'pending_verification';