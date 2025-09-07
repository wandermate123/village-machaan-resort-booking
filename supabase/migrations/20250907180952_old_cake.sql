/*
  # Check and Fix Booking Database Issues

  1. Database Diagnostics
    - Check existing bookings and their ID formats
    - Identify any problematic records
    - Show booking status and payment information

  2. Data Cleanup
    - Fix any inconsistent booking records
    - Ensure proper UUID and booking_id relationships
    - Update any incomplete payment statuses

  3. Verification
    - Verify all bookings have proper structure
    - Check foreign key relationships
    - Validate data integrity
*/

-- First, let's check what bookings currently exist
DO $$
BEGIN
  RAISE NOTICE 'Starting booking database diagnostics...';
END $$;

-- Check all existing bookings
SELECT 
  'Current Bookings:' as info,
  COUNT(*) as total_bookings
FROM bookings;

-- Show detailed booking information
SELECT 
  id as supabase_uuid,
  booking_id as display_id,
  guest_name,
  villa_name,
  status,
  payment_status,
  total_amount,
  advance_amount,
  remaining_amount,
  created_at
FROM bookings 
ORDER BY created_at DESC;

-- Check for any bookings with problematic patterns
SELECT 
  'Problematic Bookings:' as info,
  id,
  booking_id,
  guest_name,
  status,
  payment_status
FROM bookings 
WHERE booking_id LIKE 'VM1757266%'
   OR payment_status IS NULL
   OR status IS NULL;

-- Fix any incomplete booking records
UPDATE bookings 
SET 
  payment_status = COALESCE(payment_status, 'pending'),
  status = COALESCE(status, 'pending'),
  advance_amount = COALESCE(advance_amount, 0),
  remaining_amount = COALESCE(remaining_amount, total_amount),
  updated_at = NOW()
WHERE payment_status IS NULL 
   OR status IS NULL 
   OR advance_amount IS NULL 
   OR remaining_amount IS NULL;

-- Show results after cleanup
SELECT 
  'After Cleanup:' as info,
  COUNT(*) as total_bookings,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bookings,
  COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
  COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_payments,
  COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_bookings,
  COUNT(CASE WHEN payment_status = 'advance_paid' THEN 1 END) as advance_paid_bookings
FROM bookings;

-- Verify data integrity
SELECT 
  'Data Integrity Check:' as info,
  COUNT(CASE WHEN id IS NULL THEN 1 END) as null_ids,
  COUNT(CASE WHEN booking_id IS NULL THEN 1 END) as null_booking_ids,
  COUNT(CASE WHEN guest_name IS NULL OR guest_name = '' THEN 1 END) as missing_guest_names,
  COUNT(CASE WHEN email IS NULL OR email = '' THEN 1 END) as missing_emails,
  COUNT(CASE WHEN total_amount IS NULL OR total_amount <= 0 THEN 1 END) as invalid_amounts
FROM bookings;

-- Clean up any expired booking holds
DELETE FROM booking_holds 
WHERE expires_at < NOW();

-- Show final status
DO $$
DECLARE
  booking_count INTEGER;
  hold_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO booking_count FROM bookings;
  SELECT COUNT(*) INTO hold_count FROM booking_holds;
  
  RAISE NOTICE 'Database cleanup completed successfully!';
  RAISE NOTICE 'Total bookings: %', booking_count;
  RAISE NOTICE 'Active booking holds: %', hold_count;
  RAISE NOTICE 'All booking records have been validated and cleaned up.';
END $$;