/*
  # Add Advance Payment Support

  1. New Payment Status
    - Add 'advance_paid' to payment_status enum
  
  2. New Booking Status  
    - Add 'pending_verification' to booking status enum
    
  3. New Columns
    - `advance_amount` (integer) - Amount paid in advance
    - `payment_verification_notes` (text) - Admin notes during verification
    - `verified_by` (uuid) - Admin who verified the payment
    - `verification_date` (timestamptz) - When payment was verified
    
  4. Security
    - Add RLS policy for admin payment verification
    - Add index for advance payment queries
*/

-- Add advance_amount column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'advance_amount'
  ) THEN
    ALTER TABLE bookings ADD COLUMN advance_amount integer DEFAULT 0;
    ALTER TABLE bookings ADD CONSTRAINT bookings_advance_amount_check CHECK (advance_amount >= 0);
  END IF;
END $$;

-- Add payment_verification_notes column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'payment_verification_notes'
  ) THEN
    ALTER TABLE bookings ADD COLUMN payment_verification_notes text;
  END IF;
END $$;

-- Add verified_by column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'verified_by'
  ) THEN
    ALTER TABLE bookings ADD COLUMN verified_by uuid;
    ALTER TABLE bookings ADD CONSTRAINT bookings_verified_by_fkey 
    FOREIGN KEY (verified_by) REFERENCES admin_users(id);
  END IF;
END $$;

-- Add verification_date column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'verification_date'
  ) THEN
    ALTER TABLE bookings ADD COLUMN verification_date timestamptz;
  END IF;
END $$;

-- Update payment_status constraint to include advance_paid
DO $$
BEGIN
  -- Drop existing constraint
  ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_payment_status_check;
  
  -- Add new constraint with advance_paid status
  ALTER TABLE bookings ADD CONSTRAINT bookings_payment_status_check 
  CHECK (payment_status = ANY (ARRAY['pending'::text, 'paid'::text, 'failed'::text, 'refunded'::text, 'partial_refund'::text, 'advance_paid'::text]));
END $$;

-- Update booking status constraint to include pending_verification
DO $$
BEGIN
  -- Drop existing constraint
  ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
  
  -- Add new constraint with pending_verification status
  ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
  CHECK (status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'cancelled'::text, 'completed'::text, 'no_show'::text, 'pending_verification'::text]));
END $$;

-- Create index for advance payment bookings
CREATE INDEX IF NOT EXISTS idx_bookings_advance_payment 
ON bookings (payment_status, status) 
WHERE payment_status = 'advance_paid' AND status = 'pending_verification';

-- Add RLS policy for admin advance payment verification
DO $$
BEGIN
  -- Drop policy if it exists
  DROP POLICY IF EXISTS "Admins can verify advance payments" ON bookings;
  
  -- Create new policy
  CREATE POLICY "Admins can verify advance payments"
    ON bookings
    FOR UPDATE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM admin_users 
        WHERE admin_users.id::text = auth.uid()::text 
        AND admin_users.is_active = true
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM admin_users 
        WHERE admin_users.id::text = auth.uid()::text 
        AND admin_users.is_active = true
      )
    );
END $$;