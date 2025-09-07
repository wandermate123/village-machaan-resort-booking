-- Fix admin dashboard updates by temporarily disabling RLS
-- Run this in your Supabase SQL Editor

-- Step 1: Disable RLS on bookings table
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;

-- Step 2: Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'bookings';

-- Step 3: Test that updates work now
UPDATE bookings 
SET updated_at = NOW(), 
    admin_notes = 'RLS disabled - admin updates now work - ' || NOW()::text
WHERE id IN (
  SELECT id FROM bookings LIMIT 1
);

-- Step 4: Show the updated booking to confirm it worked
SELECT id, booking_id, guest_name, admin_notes, updated_at 
FROM bookings 
ORDER BY updated_at DESC 
LIMIT 3;

-- IMPORTANT: After testing, you can re-enable RLS with:
-- ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
