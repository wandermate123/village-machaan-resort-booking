-- Fix unit assignment for existing bookings
-- Run this in your Supabase SQL editor

-- 1. First, let's manually assign units to recent bookings that don't have units assigned
WITH recent_bookings AS (
  SELECT 
    b.id,
    b.booking_id,
    b.villa_id,
    b.check_in,
    b.check_out,
    b.status,
    b.payment_status
  FROM bookings b
  LEFT JOIN booking_units bu ON b.booking_id = bu.booking_id
  WHERE bu.booking_id IS NULL
    AND b.status IN ('confirmed', 'checked_in')
    AND (b.payment_status = 'paid' OR b.payment_status = 'advance_paid')
    AND b.check_in >= CURRENT_DATE - INTERVAL '30 days'
  ORDER BY b.created_at DESC
),
available_units AS (
  SELECT 
    vi.id as unit_id,
    vi.villa_id,
    vi.unit_number,
    ROW_NUMBER() OVER (PARTITION BY vi.villa_id ORDER BY vi.unit_number) as unit_rank
  FROM villa_inventory vi
  WHERE vi.status = 'available'
)
INSERT INTO booking_units (booking_id, villa_inventory_id, check_in, check_out, status)
SELECT 
  rb.booking_id,
  au.unit_id,
  rb.check_in,
  rb.check_out,
  CASE 
    WHEN rb.status = 'checked_in' THEN 'occupied'
    ELSE 'reserved'
  END as status
FROM recent_bookings rb
JOIN available_units au ON rb.villa_id = au.villa_id
WHERE au.unit_rank = 1; -- Assign first available unit

-- 2. Update the trigger function to be more robust
CREATE OR REPLACE FUNCTION assign_unit_to_booking()
RETURNS TRIGGER AS $$
DECLARE
  available_unit_id UUID;
  villa_total_units INTEGER;
  existing_assignment INTEGER;
BEGIN
  -- Check if unit is already assigned
  SELECT COUNT(*) INTO existing_assignment
  FROM booking_units
  WHERE booking_id = NEW.booking_id;
  
  IF existing_assignment > 0 THEN
    RETURN NEW; -- Already assigned
  END IF;
  
  -- Get total units for this villa
  SELECT COUNT(*) INTO villa_total_units
  FROM villa_inventory
  WHERE villa_id = NEW.villa_id AND status = 'available';
  
  -- Find an available unit for the booking dates
  SELECT vi.id INTO available_unit_id
  FROM villa_inventory vi
  WHERE vi.villa_id = NEW.villa_id
    AND vi.status = 'available'
    AND vi.id NOT IN (
      SELECT bu.villa_inventory_id
      FROM booking_units bu
      WHERE bu.villa_inventory_id = vi.id
        AND bu.status IN ('reserved', 'occupied')
        AND (
          (bu.check_in <= NEW.check_in AND bu.check_out > NEW.check_in) OR
          (bu.check_in < NEW.check_out AND bu.check_out >= NEW.check_out) OR
          (bu.check_in >= NEW.check_in AND bu.check_out <= NEW.check_out)
        )
    )
  ORDER BY vi.unit_number
  LIMIT 1;
  
  -- If no unit available, log warning but don't fail
  IF available_unit_id IS NULL THEN
    RAISE WARNING 'No available units for booking % on dates % to %', NEW.booking_id, NEW.check_in, NEW.check_out;
    RETURN NEW;
  END IF;
  
  -- Assign the unit to the booking
  INSERT INTO booking_units (booking_id, villa_inventory_id, check_in, check_out, status)
  VALUES (NEW.booking_id, available_unit_id, NEW.check_in, NEW.check_out, 'reserved');
  
  RAISE NOTICE 'Assigned unit % to booking %', available_unit_id, NEW.booking_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Recreate the trigger
DROP TRIGGER IF EXISTS trigger_assign_unit_to_booking ON bookings;
CREATE TRIGGER trigger_assign_unit_to_booking
  AFTER INSERT ON bookings
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed' OR NEW.payment_status = 'paid' OR NEW.payment_status = 'advance_paid')
  EXECUTE FUNCTION assign_unit_to_booking();

-- 4. Test with a sample booking (uncomment to test)
-- INSERT INTO bookings (booking_id, villa_id, villa_name, guest_name, email, phone, check_in, check_out, guests, status, payment_status, total_amount)
-- VALUES ('TEST-' || extract(epoch from now()), 'glass-cottage', 'Glass Cottage', 'Test Guest', 'test@example.com', '1234567890', CURRENT_DATE + 1, CURRENT_DATE + 3, 2, 'confirmed', 'paid', 5000);
