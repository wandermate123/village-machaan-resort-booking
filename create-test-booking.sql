-- Create a test booking for admin dashboard testing
-- Run this SQL in your Supabase SQL Editor

INSERT INTO bookings (
  booking_id,
  guest_name,
  email,
  phone,
  check_in,
  check_out,
  guests,
  villa_id,
  villa_name,
  villa_price,
  package_id,
  package_name,
  package_price,
  safari_requests,
  safari_total,
  subtotal,
  taxes,
  total_amount,
  special_requests,
  status,
  payment_status,
  advance_amount,
  remaining_amount,
  admin_notes,
  booking_source,
  created_at,
  updated_at
) VALUES (
  'TEST' || EXTRACT(EPOCH FROM NOW())::bigint,
  'Test Guest',
  'test@example.com',
  '9876543210',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '2 days',
  2,
  'glass-cottage',
  'Glass Cottage',
  15000,
  NULL,
  NULL,
  0,
  '[]'::jsonb,
  0,
  15000,
  2700,
  17700,
  'Test booking for admin dashboard',
  'pending',
  'pending',
  0,
  17700,
  'Created for testing update functionality',
  'admin_test',
  NOW(),
  NOW()
);

-- Verify the booking was created
SELECT id, booking_id, guest_name, status, created_at 
FROM bookings 
ORDER BY created_at DESC 
LIMIT 1;
