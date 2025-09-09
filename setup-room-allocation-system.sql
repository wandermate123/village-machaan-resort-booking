-- =====================================================
-- ROOM ALLOCATION SYSTEM SETUP
-- Run this in your Supabase SQL editor to enable room allocation
-- =====================================================

-- 1. Create Villa Inventory Table
CREATE TABLE IF NOT EXISTS villa_inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  villa_id TEXT NOT NULL,
  unit_number TEXT NOT NULL,
  room_type TEXT NOT NULL DEFAULT 'villa',
  floor INTEGER DEFAULT 1,
  view_type TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'maintenance', 'out_of_order')),
  amenities TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(villa_id, unit_number)
);

-- 2. Create Booking Units Table (tracks which unit is assigned to which booking)
CREATE TABLE IF NOT EXISTS booking_units (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id TEXT NOT NULL,
  villa_inventory_id UUID NOT NULL REFERENCES villa_inventory(id) ON DELETE CASCADE,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'occupied', 'checked_out', 'cancelled')),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Inventory Blocks Table (for maintenance, owner use, etc.)
CREATE TABLE IF NOT EXISTS inventory_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  villa_inventory_id UUID NOT NULL REFERENCES villa_inventory(id) ON DELETE CASCADE,
  block_date DATE NOT NULL,
  block_type TEXT NOT NULL CHECK (block_type IN ('maintenance', 'owner_use', 'seasonal_closure', 'deep_cleaning')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Indexes for Better Performance
CREATE INDEX IF NOT EXISTS idx_villa_inventory_villa_id ON villa_inventory(villa_id);
CREATE INDEX IF NOT EXISTS idx_villa_inventory_status ON villa_inventory(status);
CREATE INDEX IF NOT EXISTS idx_booking_units_booking_id ON booking_units(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_units_villa_inventory_id ON booking_units(villa_inventory_id);
CREATE INDEX IF NOT EXISTS idx_booking_units_dates ON booking_units(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_booking_units_status ON booking_units(status);
CREATE INDEX IF NOT EXISTS idx_inventory_blocks_date ON inventory_blocks(block_date);
CREATE INDEX IF NOT EXISTS idx_inventory_blocks_villa_inventory_id ON inventory_blocks(villa_inventory_id);

-- 5. Insert Initial Villa Inventory Data
INSERT INTO villa_inventory (villa_id, unit_number, room_type, floor, view_type, status, amenities) VALUES
-- Glass Cottage (14 units)
('glass-cottage', 'GC-01', 'cottage', 1, 'Forest View', 'available', '{"Air Conditioning", "WiFi", "Private Balcony"}'),
('glass-cottage', 'GC-02', 'cottage', 1, 'Garden View', 'available', '{"Air Conditioning", "WiFi", "Private Balcony"}'),
('glass-cottage', 'GC-03', 'cottage', 1, 'Forest View', 'available', '{"Air Conditioning", "WiFi", "Private Balcony"}'),
('glass-cottage', 'GC-04', 'cottage', 1, 'Garden View', 'available', '{"Air Conditioning", "WiFi", "Private Balcony"}'),
('glass-cottage', 'GC-05', 'cottage', 1, 'Forest View', 'available', '{"Air Conditioning", "WiFi", "Private Balcony"}'),
('glass-cottage', 'GC-06', 'cottage', 1, 'Garden View', 'available', '{"Air Conditioning", "WiFi", "Private Balcony"}'),
('glass-cottage', 'GC-07', 'cottage', 1, 'Forest View', 'available', '{"Air Conditioning", "WiFi", "Private Balcony"}'),
('glass-cottage', 'GC-08', 'cottage', 1, 'Garden View', 'available', '{"Air Conditioning", "WiFi", "Private Balcony"}'),
('glass-cottage', 'GC-09', 'cottage', 2, 'Forest View', 'available', '{"Air Conditioning", "WiFi", "Private Balcony"}'),
('glass-cottage', 'GC-10', 'cottage', 2, 'Garden View', 'available', '{"Air Conditioning", "WiFi", "Private Balcony"}'),
('glass-cottage', 'GC-11', 'cottage', 2, 'Forest View', 'available', '{"Air Conditioning", "WiFi", "Private Balcony"}'),
('glass-cottage', 'GC-12', 'cottage', 2, 'Garden View', 'available', '{"Air Conditioning", "WiFi", "Private Balcony"}'),
('glass-cottage', 'GC-13', 'cottage', 2, 'Forest View', 'available', '{"Air Conditioning", "WiFi", "Private Balcony"}'),
('glass-cottage', 'GC-14', 'cottage', 2, 'Garden View', 'available', '{"Air Conditioning", "WiFi", "Private Balcony"}'),

-- Hornbill Villa (4 units)
('hornbill-villa', 'HV-01', 'villa', 1, 'Forest View', 'available', '{"Air Conditioning", "WiFi", "Kitchen", "Living Room"}'),
('hornbill-villa', 'HV-02', 'villa', 1, 'Garden View', 'available', '{"Air Conditioning", "WiFi", "Kitchen", "Living Room"}'),
('hornbill-villa', 'HV-03', 'villa', 2, 'Forest View', 'available', '{"Air Conditioning", "WiFi", "Kitchen", "Living Room"}'),
('hornbill-villa', 'HV-04', 'villa', 2, 'Garden View', 'available', '{"Air Conditioning", "WiFi", "Kitchen", "Living Room"}'),

-- Kingfisher Villa (4 units)
('kingfisher-villa', 'KV-01', 'villa', 1, 'Forest View', 'available', '{"Air Conditioning", "WiFi", "Kitchen", "Living Room"}'),
('kingfisher-villa', 'KV-02', 'villa', 1, 'Garden View', 'available', '{"Air Conditioning", "WiFi", "Kitchen", "Living Room"}'),
('kingfisher-villa', 'KV-03', 'villa', 2, 'Forest View', 'available', '{"Air Conditioning", "WiFi", "Kitchen", "Living Room"}'),
('kingfisher-villa', 'KV-04', 'villa', 2, 'Garden View', 'available', '{"Air Conditioning", "WiFi", "Kitchen", "Living Room"}')
ON CONFLICT (villa_id, unit_number) DO NOTHING;

-- 6. Enable Row Level Security
ALTER TABLE villa_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_blocks ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS Policies (allow all for now, can be restricted later)
CREATE POLICY "Allow all operations on villa_inventory" ON villa_inventory FOR ALL USING (true);
CREATE POLICY "Allow all operations on booking_units" ON booking_units FOR ALL USING (true);
CREATE POLICY "Allow all operations on inventory_blocks" ON inventory_blocks FOR ALL USING (true);

-- 8. Create Function to Automatically Assign Units to Bookings
CREATE OR REPLACE FUNCTION assign_unit_to_booking()
RETURNS TRIGGER AS $$
DECLARE
  available_unit_id UUID;
  villa_total_units INTEGER;
BEGIN
  -- Get total units for the villa
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
  LIMIT 1;
  
  -- If no unit available, raise exception
  IF available_unit_id IS NULL THEN
    RAISE EXCEPTION 'No available units for the selected dates';
  END IF;
  
  -- Assign the unit to the booking
  INSERT INTO booking_units (booking_id, villa_inventory_id, check_in, check_out, status)
  VALUES (NEW.booking_id, available_unit_id, NEW.check_in, NEW.check_out, 'reserved');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create Trigger to Automatically Assign Units When Bookings Are Created
DROP TRIGGER IF EXISTS trigger_assign_unit_to_booking ON bookings;
CREATE TRIGGER trigger_assign_unit_to_booking
  AFTER INSERT ON bookings
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed' OR NEW.payment_status = 'paid' OR NEW.payment_status = 'advance_paid')
  EXECUTE FUNCTION assign_unit_to_booking();

-- 10. Create Function to Update Occupancy Statistics
CREATE OR REPLACE FUNCTION update_occupancy_stats()
RETURNS TABLE (
  villa_id TEXT,
  villa_name TEXT,
  total_units INTEGER,
  occupied_units INTEGER,
  available_units INTEGER,
  occupancy_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vi.villa_id,
    v.name as villa_name,
    COUNT(vi.id)::INTEGER as total_units,
    COUNT(CASE WHEN bu.id IS NOT NULL AND bu.status IN ('reserved', 'occupied') THEN 1 END)::INTEGER as occupied_units,
    COUNT(CASE WHEN bu.id IS NULL OR bu.status NOT IN ('reserved', 'occupied') THEN 1 END)::INTEGER as available_units,
    ROUND(
      (COUNT(CASE WHEN bu.id IS NOT NULL AND bu.status IN ('reserved', 'occupied') THEN 1 END)::NUMERIC / COUNT(vi.id)::NUMERIC) * 100, 
      2
    ) as occupancy_rate
  FROM villa_inventory vi
  LEFT JOIN villas v ON vi.villa_id = v.id
  LEFT JOIN booking_units bu ON vi.id = bu.villa_inventory_id 
    AND bu.check_in <= CURRENT_DATE 
    AND bu.check_out > CURRENT_DATE
  WHERE vi.status = 'available'
  GROUP BY vi.villa_id, v.name
  ORDER BY vi.villa_id;
END;
$$ LANGUAGE plpgsql;

-- 11. Create Function to Get Available Units for a Villa on Specific Dates
CREATE OR REPLACE FUNCTION get_available_units_for_villa(
  p_villa_id TEXT,
  p_check_in DATE,
  p_check_out DATE
)
RETURNS TABLE (
  id UUID,
  villa_id TEXT,
  unit_number TEXT,
  room_type TEXT,
  floor INTEGER,
  view_type TEXT,
  status TEXT,
  amenities TEXT[],
  notes TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vi.id,
    vi.villa_id,
    vi.unit_number,
    vi.room_type,
    vi.floor,
    vi.view_type,
    vi.status,
    vi.amenities,
    vi.notes
  FROM villa_inventory vi
  WHERE vi.villa_id = p_villa_id
    AND vi.status = 'available'
    AND vi.id NOT IN (
      SELECT bu.villa_inventory_id
      FROM booking_units bu
      WHERE bu.villa_inventory_id = vi.id
        AND bu.status IN ('reserved', 'occupied')
        AND (
          (bu.check_in <= p_check_in AND bu.check_out > p_check_in) OR
          (bu.check_in < p_check_out AND bu.check_out >= p_check_out) OR
          (bu.check_in >= p_check_in AND bu.check_out <= p_check_out)
        )
    )
  ORDER BY vi.unit_number;
END;
$$ LANGUAGE plpgsql;

-- 12. Create Function to Assign Specific Unit to Booking
CREATE OR REPLACE FUNCTION assign_specific_unit_to_booking(
  p_booking_id TEXT,
  p_villa_inventory_id UUID,
  p_check_in DATE,
  p_check_out DATE
)
RETURNS BOOLEAN AS $$
DECLARE
  unit_exists BOOLEAN;
  unit_available BOOLEAN;
BEGIN
  -- Check if unit exists
  SELECT EXISTS(
    SELECT 1 FROM villa_inventory 
    WHERE id = p_villa_inventory_id AND status = 'available'
  ) INTO unit_exists;
  
  IF NOT unit_exists THEN
    RETURN FALSE;
  END IF;
  
  -- Check if unit is available for the dates
  SELECT NOT EXISTS(
    SELECT 1 FROM booking_units 
    WHERE villa_inventory_id = p_villa_inventory_id
      AND status IN ('reserved', 'occupied')
      AND (
        (check_in <= p_check_in AND check_out > p_check_in) OR
        (check_in < p_check_out AND check_out >= p_check_out) OR
        (check_in >= p_check_in AND check_out <= p_check_out)
      )
  ) INTO unit_available;
  
  IF NOT unit_available THEN
    RETURN FALSE;
  END IF;
  
  -- Remove any existing assignment for this booking
  DELETE FROM booking_units WHERE booking_id = p_booking_id;
  
  -- Assign the unit to the booking
  INSERT INTO booking_units (booking_id, villa_inventory_id, check_in, check_out, status)
  VALUES (p_booking_id, p_villa_inventory_id, p_check_in, p_check_out, 'reserved');
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 13. Create View for Easy Occupancy Queries
CREATE OR REPLACE VIEW occupancy_view AS
SELECT 
  bu.booking_id,
  bu.check_in,
  bu.check_out,
  bu.status as unit_status,
  vi.unit_number,
  vi.room_type,
  vi.floor,
  vi.view_type,
  vi.villa_id,
  v.name as villa_name,
  b.guest_name,
  b.email,
  b.phone,
  b.guests,
  b.status as booking_status
FROM booking_units bu
JOIN villa_inventory vi ON bu.villa_inventory_id = vi.id
JOIN villas v ON vi.villa_id = v.id
JOIN bookings b ON bu.booking_id = b.booking_id
WHERE bu.status IN ('reserved', 'occupied');

-- 14. Add Comments for Documentation
COMMENT ON TABLE villa_inventory IS 'Stores all available villa units/rooms';
COMMENT ON TABLE booking_units IS 'Tracks which unit is assigned to which booking';
COMMENT ON TABLE inventory_blocks IS 'Blocks units for maintenance, owner use, etc.';
COMMENT ON FUNCTION assign_unit_to_booking() IS 'Automatically assigns available units to new bookings';
COMMENT ON FUNCTION get_available_units_for_villa(TEXT, DATE, DATE) IS 'Returns available units for a villa on specific dates';
COMMENT ON FUNCTION assign_specific_unit_to_booking(TEXT, UUID, DATE, DATE) IS 'Assigns a specific unit to a booking';

-- 15. Verify Setup
DO $$
BEGIN
  RAISE NOTICE 'Room allocation system setup completed successfully!';
  RAISE NOTICE 'Created tables: villa_inventory, booking_units, inventory_blocks';
  RAISE NOTICE 'Created functions: assign_unit_to_booking, get_available_units_for_villa, assign_specific_unit_to_booking';
  RAISE NOTICE 'Created view: occupancy_view';
  RAISE NOTICE 'Inserted sample data for all villas';
END $$;
