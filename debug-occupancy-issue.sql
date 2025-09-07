-- Debug script to check why occupancy is not updating
-- Run this in your Supabase SQL editor

-- 1. Check if the trigger function exists
SELECT 
  trigger_name, 
  event_manipulation, 
  action_statement,
  action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_assign_unit_to_booking';

-- 2. Check recent bookings
SELECT 
  id,
  booking_id,
  villa_id,
  villa_name,
  guest_name,
  check_in,
  check_out,
  status,
  payment_status,
  created_at
FROM bookings 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Check if any units were assigned to recent bookings
SELECT 
  bu.id,
  bu.booking_id,
  bu.villa_inventory_id,
  bu.check_in,
  bu.check_out,
  bu.status,
  vi.unit_number,
  vi.villa_id
FROM booking_units bu
JOIN villa_inventory vi ON bu.villa_inventory_id = vi.id
ORDER BY bu.created_at DESC
LIMIT 10;

-- 4. Check villa inventory status
SELECT 
  villa_id,
  COUNT(*) as total_units,
  COUNT(CASE WHEN status = 'available' THEN 1 END) as available_units,
  COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance_units
FROM villa_inventory
GROUP BY villa_id;

-- 5. Check current occupancy for today
SELECT 
  vi.villa_id,
  vi.unit_number,
  bu.booking_id,
  b.guest_name,
  bu.check_in,
  bu.check_out,
  bu.status
FROM villa_inventory vi
LEFT JOIN booking_units bu ON vi.id = bu.villa_inventory_id 
  AND bu.check_in <= CURRENT_DATE 
  AND bu.check_out > CURRENT_DATE
  AND bu.status IN ('reserved', 'occupied')
LEFT JOIN bookings b ON bu.booking_id = b.booking_id
WHERE vi.villa_id IN ('glass-cottage', 'hornbill-villa', 'kingfisher-villa')
ORDER BY vi.villa_id, vi.unit_number;

-- 6. Test the trigger function manually (replace with actual booking_id)
-- SELECT assign_unit_to_booking();
