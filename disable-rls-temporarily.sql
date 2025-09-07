-- Temporarily disable RLS for bookings table to allow admin updates
-- Run this in your Supabase SQL Editor

-- Disable RLS on bookings table
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'bookings';

-- Test update (this should work now)
UPDATE bookings 
SET updated_at = NOW(), 
    admin_notes = 'RLS disabled for testing - ' || NOW()::text
WHERE id IN (
  SELECT id FROM bookings LIMIT 1
);

-- Show the updated booking
SELECT id, booking_id, guest_name, admin_notes, updated_at 
FROM bookings 
ORDER BY updated_at DESC 
LIMIT 1;

-- IMPORTANT: Re-enable RLS after testing
-- ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
