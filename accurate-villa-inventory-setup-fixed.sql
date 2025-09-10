-- =====================================================
-- ACCURATE VILLA INVENTORY SETUP (FIXED)
-- Handles existing policies and tables gracefully
-- =====================================================

-- 1. Create Villa Inventory Table
CREATE TABLE IF NOT EXISTS villa_inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  villa_id TEXT NOT NULL,
  unit_number TEXT NOT NULL,
  room_type TEXT NOT NULL DEFAULT 'villa',
  floor INTEGER DEFAULT 1,
  view_type TEXT,
  bedroom_count INTEGER DEFAULT 1,
  max_occupancy INTEGER DEFAULT 2,
  check_in_time TIME DEFAULT '13:30:00',
  check_out_time TIME DEFAULT '11:30:00',
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'maintenance', 'out_of_order')),
  amenities TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(villa_id, unit_number)
);

-- 2. Create Booking Units Table
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

-- 3. Create Inventory Blocks Table
CREATE TABLE IF NOT EXISTS inventory_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  villa_inventory_id UUID NOT NULL REFERENCES villa_inventory(id) ON DELETE CASCADE,
  block_date DATE NOT NULL,
  block_type TEXT NOT NULL CHECK (block_type IN ('maintenance', 'owner_use', 'seasonal_closure', 'deep_cleaning')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable Row Level Security (only if not already enabled)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'villa_inventory' AND n.nspname = 'public'
    AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE villa_inventory ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'booking_units' AND n.nspname = 'public'
    AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE booking_units ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'inventory_blocks' AND n.nspname = 'public'
    AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE inventory_blocks ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- 5. Create RLS Policies (only if they don't exist)
DO $$
BEGIN
  -- Villa Inventory Policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'villa_inventory' 
    AND policyname = 'Allow all operations on villa_inventory'
  ) THEN
    CREATE POLICY "Allow all operations on villa_inventory" ON villa_inventory FOR ALL USING (true);
  END IF;
  
  -- Booking Units Policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'booking_units' 
    AND policyname = 'Allow all operations on booking_units'
  ) THEN
    CREATE POLICY "Allow all operations on booking_units" ON booking_units FOR ALL USING (true);
  END IF;
  
  -- Inventory Blocks Policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'inventory_blocks' 
    AND policyname = 'Allow all operations on inventory_blocks'
  ) THEN
    CREATE POLICY "Allow all operations on inventory_blocks" ON inventory_blocks FOR ALL USING (true);
  END IF;
END $$;

-- 6. Insert Accurate Villa Inventory Data
INSERT INTO villa_inventory (villa_id, unit_number, room_type, floor, view_type, bedroom_count, max_occupancy, check_in_time, check_out_time, status, amenities, notes) VALUES

-- HORNBILL VILLA (4 units - All 1 bedroom)
('hornbill-villa', 'HV-01', 'villa', 1, 'Forest View', 1, 2, '13:30:00', '11:30:00', 'available', 
 '{"Air Conditioning", "WiFi", "Kitchen", "Living Room", "Private Bathroom", "Balcony", "Mini Fridge", "Coffee Maker"}', 
 'Ground floor forest view villa with private entrance'),

('hornbill-villa', 'HV-02', 'villa', 1, 'Garden View', 1, 2, '13:30:00', '11:30:00', 'available', 
 '{"Air Conditioning", "WiFi", "Kitchen", "Living Room", "Private Bathroom", "Balcony", "Mini Fridge", "Coffee Maker"}', 
 'Ground floor garden view villa with private entrance'),

('hornbill-villa', 'HV-03', 'villa', 2, 'Forest View', 1, 2, '13:30:00', '11:30:00', 'available', 
 '{"Air Conditioning", "WiFi", "Kitchen", "Living Room", "Private Bathroom", "Balcony", "Mini Fridge", "Coffee Maker"}', 
 'First floor forest view villa with balcony'),

('hornbill-villa', 'HV-04', 'villa', 2, 'Garden View', 1, 2, '13:30:00', '11:30:00', 'available', 
 '{"Air Conditioning", "WiFi", "Kitchen", "Living Room", "Private Bathroom", "Balcony", "Mini Fridge", "Coffee Maker"}', 
 'First floor garden view villa with balcony'),

-- KINGFISHER VILLA (4 units - All 1 bedroom)
('kingfisher-villa', 'KF-01', 'villa', 1, 'Forest View', 1, 2, '13:30:00', '11:30:00', 'available', 
 '{"Air Conditioning", "WiFi", "Kitchen", "Living Room", "Private Bathroom", "Balcony", "Mini Fridge", "Coffee Maker"}', 
 'Ground floor forest view villa with private entrance'),

('kingfisher-villa', 'KF-02', 'villa', 1, 'Garden View', 1, 2, '13:30:00', '11:30:00', 'available', 
 '{"Air Conditioning", "WiFi", "Kitchen", "Living Room", "Private Bathroom", "Balcony", "Mini Fridge", "Coffee Maker"}', 
 'Ground floor garden view villa with private entrance'),

('kingfisher-villa', 'KF-03', 'villa', 2, 'Forest View', 1, 2, '13:30:00', '11:30:00', 'available', 
 '{"Air Conditioning", "WiFi", "Kitchen", "Living Room", "Private Bathroom", "Balcony", "Mini Fridge", "Coffee Maker"}', 
 'First floor forest view villa with balcony'),

('kingfisher-villa', 'KF-04', 'villa', 2, 'Garden View', 1, 2, '13:30:00', '11:30:00', 'available', 
 '{"Air Conditioning", "WiFi", "Kitchen", "Living Room", "Private Bathroom", "Balcony", "Mini Fridge", "Coffee Maker"}', 
 'First floor garden view villa with balcony'),

-- GLASS COTTAGES (14 units - All 1 bedroom)
('glass-cottage', 'GC-01', 'cottage', 1, 'Forest View', 1, 2, '13:30:00', '11:30:00', 'available', 
 '{"Air Conditioning", "WiFi", "Private Bathroom", "Glass Walls", "Nature View", "Mini Fridge", "Coffee Maker", "Reading Chair"}', 
 'Ground floor forest view glass cottage with panoramic nature views'),

('glass-cottage', 'GC-02', 'cottage', 1, 'Garden View', 1, 2, '13:30:00', '11:30:00', 'available', 
 '{"Air Conditioning", "WiFi", "Private Bathroom", "Glass Walls", "Garden View", "Mini Fridge", "Coffee Maker", "Reading Chair"}', 
 'Ground floor garden view glass cottage with landscaped garden views'),

('glass-cottage', 'GC-03', 'cottage', 1, 'Forest View', 1, 2, '13:30:00', '11:30:00', 'available', 
 '{"Air Conditioning", "WiFi", "Private Bathroom", "Glass Walls", "Nature View", "Mini Fridge", "Coffee Maker", "Reading Chair"}', 
 'Ground floor forest view glass cottage with panoramic nature views'),

('glass-cottage', 'GC-04', 'cottage', 1, 'Garden View', 1, 2, '13:30:00', '11:30:00', 'available', 
 '{"Air Conditioning", "WiFi", "Private Bathroom", "Glass Walls", "Garden View", "Mini Fridge", "Coffee Maker", "Reading Chair"}', 
 'Ground floor garden view glass cottage with landscaped garden views'),

('glass-cottage', 'GC-05', 'cottage', 1, 'Forest View', 1, 2, '13:30:00', '11:30:00', 'available', 
 '{"Air Conditioning", "WiFi", "Private Bathroom", "Glass Walls", "Nature View", "Mini Fridge", "Coffee Maker", "Reading Chair"}', 
 'Ground floor forest view glass cottage with panoramic nature views'),

('glass-cottage', 'GC-06', 'cottage', 1, 'Garden View', 1, 2, '13:30:00', '11:30:00', 'available', 
 '{"Air Conditioning", "WiFi", "Private Bathroom", "Glass Walls", "Garden View", "Mini Fridge", "Coffee Maker", "Reading Chair"}', 
 'Ground floor garden view glass cottage with landscaped garden views'),

('glass-cottage', 'GC-07', 'cottage', 1, 'Forest View', 1, 2, '13:30:00', '11:30:00', 'available', 
 '{"Air Conditioning", "WiFi", "Private Bathroom", "Glass Walls", "Nature View", "Mini Fridge", "Coffee Maker", "Reading Chair"}', 
 'Ground floor forest view glass cottage with panoramic nature views'),

('glass-cottage', 'GC-08', 'cottage', 1, 'Garden View', 1, 2, '13:30:00', '11:30:00', 'available', 
 '{"Air Conditioning", "WiFi", "Private Bathroom", "Glass Walls", "Garden View", "Mini Fridge", "Coffee Maker", "Reading Chair"}', 
 'Ground floor garden view glass cottage with landscaped garden views'),

('glass-cottage', 'GC-09', 'cottage', 2, 'Forest View', 1, 2, '13:30:00', '11:30:00', 'available', 
 '{"Air Conditioning", "WiFi", "Private Bathroom", "Glass Walls", "Nature View", "Mini Fridge", "Coffee Maker", "Reading Chair"}', 
 'First floor forest view glass cottage with elevated nature views'),

('glass-cottage', 'GC-10', 'cottage', 2, 'Garden View', 1, 2, '13:30:00', '11:30:00', 'available', 
 '{"Air Conditioning", "WiFi", "Private Bathroom", "Glass Walls", "Garden View", "Mini Fridge", "Coffee Maker", "Reading Chair"}', 
 'First floor garden view glass cottage with elevated garden views'),

('glass-cottage', 'GC-11', 'cottage', 2, 'Forest View', 1, 2, '13:30:00', '11:30:00', 'available', 
 '{"Air Conditioning", "WiFi", "Private Bathroom", "Glass Walls", "Nature View", "Mini Fridge", "Coffee Maker", "Reading Chair"}', 
 'First floor forest view glass cottage with elevated nature views'),

('glass-cottage', 'GC-12', 'cottage', 2, 'Garden View', 1, 2, '13:30:00', '11:30:00', 'available', 
 '{"Air Conditioning", "WiFi", "Private Bathroom", "Glass Walls", "Garden View", "Mini Fridge", "Coffee Maker", "Reading Chair"}', 
 'First floor garden view glass cottage with elevated garden views'),

('glass-cottage', 'GC-13', 'cottage', 2, 'Forest View', 1, 2, '13:30:00', '11:30:00', 'available', 
 '{"Air Conditioning", "WiFi", "Private Bathroom", "Glass Walls", "Nature View", "Mini Fridge", "Coffee Maker", "Reading Chair"}', 
 'First floor forest view glass cottage with elevated nature views'),

('glass-cottage', 'GC-14', 'cottage', 2, 'Garden View', 1, 2, '13:30:00', '11:30:00', 'available', 
 '{"Air Conditioning", "WiFi", "Private Bathroom", "Glass Walls", "Garden View", "Mini Fridge", "Coffee Maker", "Reading Chair"}', 
 'First floor garden view glass cottage with elevated garden views')

ON CONFLICT (villa_id, unit_number) DO NOTHING;

-- 7. Create Indexes for Better Performance
CREATE INDEX IF NOT EXISTS idx_villa_inventory_villa_id ON villa_inventory(villa_id);
CREATE INDEX IF NOT EXISTS idx_villa_inventory_status ON villa_inventory(status);
CREATE INDEX IF NOT EXISTS idx_villa_inventory_bedroom_count ON villa_inventory(bedroom_count);
CREATE INDEX IF NOT EXISTS idx_booking_units_booking_id ON booking_units(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_units_villa_inventory_id ON booking_units(villa_inventory_id);
CREATE INDEX IF NOT EXISTS idx_booking_units_dates ON booking_units(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_booking_units_status ON booking_units(status);
CREATE INDEX IF NOT EXISTS idx_inventory_blocks_date ON inventory_blocks(block_date);
CREATE INDEX IF NOT EXISTS idx_inventory_blocks_villa_inventory_id ON inventory_blocks(villa_inventory_id);

-- 8. Create or Replace Functions
CREATE OR REPLACE FUNCTION get_villa_summary()
RETURNS TABLE (
  villa_id TEXT,
  villa_name TEXT,
  total_units INTEGER,
  available_units INTEGER,
  occupied_units INTEGER,
  bedroom_count INTEGER,
  max_occupancy INTEGER,
  check_in_time TIME,
  check_out_time TIME
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vi.villa_id,
    CASE 
      WHEN vi.villa_id = 'hornbill-villa' THEN 'Hornbill Villa'
      WHEN vi.villa_id = 'kingfisher-villa' THEN 'Kingfisher Villa'
      WHEN vi.villa_id = 'glass-cottage' THEN 'Glass Cottages'
      ELSE vi.villa_id
    END as villa_name,
    COUNT(vi.id)::INTEGER as total_units,
    COUNT(CASE WHEN vi.status = 'available' THEN 1 END)::INTEGER as available_units,
    COUNT(CASE WHEN vi.status = 'maintenance' OR vi.status = 'out_of_order' THEN 1 END)::INTEGER as occupied_units,
    vi.bedroom_count,
    vi.max_occupancy,
    vi.check_in_time,
    vi.check_out_time
  FROM villa_inventory vi
  GROUP BY vi.villa_id, vi.bedroom_count, vi.max_occupancy, vi.check_in_time, vi.check_out_time
  ORDER BY vi.villa_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_available_units_for_dates(
  p_villa_id TEXT,
  p_check_in DATE,
  p_check_out DATE
)
RETURNS TABLE (
  id UUID,
  unit_number TEXT,
  room_type TEXT,
  floor INTEGER,
  view_type TEXT,
  bedroom_count INTEGER,
  max_occupancy INTEGER,
  amenities TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vi.id,
    vi.unit_number,
    vi.room_type,
    vi.floor,
    vi.view_type,
    vi.bedroom_count,
    vi.max_occupancy,
    vi.amenities
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
  ORDER BY vi.floor, vi.unit_number;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION assign_unit_to_booking(
  p_booking_id TEXT,
  p_villa_inventory_id UUID,
  p_check_in DATE,
  p_check_out DATE
)
RETURNS BOOLEAN AS $$
DECLARE
  unit_available BOOLEAN;
BEGIN
  -- Check if unit is available for the dates
  SELECT NOT EXISTS(
    SELECT 1 FROM booking_units 
    WHERE villa_inventory_id = p_villa_inventory_id
      AND status IN ('reserved', 'occupied')
      AND (
        (check_in <= p_check_in AND bu.check_out > p_check_in) OR
        (check_in < p_check_out AND bu.check_out >= p_check_out) OR
        (check_in >= p_check_in AND bu.check_out <= p_check_out)
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

-- 9. Create or Replace View
CREATE OR REPLACE VIEW occupancy_dashboard AS
SELECT 
  bu.booking_id,
  bu.check_in,
  bu.check_out,
  bu.status as unit_status,
  vi.unit_number,
  vi.room_type,
  vi.floor,
  vi.view_type,
  vi.bedroom_count,
  vi.max_occupancy,
  vi.villa_id,
  CASE 
    WHEN vi.villa_id = 'hornbill-villa' THEN 'Hornbill Villa'
    WHEN vi.villa_id = 'kingfisher-villa' THEN 'Kingfisher Villa'
    WHEN vi.villa_id = 'glass-cottage' THEN 'Glass Cottages'
    ELSE vi.villa_id
  END as villa_name,
  b.guest_name,
  b.email,
  b.phone,
  b.guests,
  b.status as booking_status,
  vi.check_in_time,
  vi.check_out_time
FROM booking_units bu
JOIN villa_inventory vi ON bu.villa_inventory_id = vi.id
LEFT JOIN bookings b ON bu.booking_id = b.booking_id
WHERE bu.status IN ('reserved', 'occupied');

-- 10. Verify Setup
DO $$
DECLARE
  hornbill_count INTEGER;
  kingfisher_count INTEGER;
  glass_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO hornbill_count FROM villa_inventory WHERE villa_id = 'hornbill-villa';
  SELECT COUNT(*) INTO kingfisher_count FROM villa_inventory WHERE villa_id = 'kingfisher-villa';
  SELECT COUNT(*) INTO glass_count FROM villa_inventory WHERE villa_id = 'glass-cottage';
  
  RAISE NOTICE 'Accurate villa inventory setup completed successfully!';
  RAISE NOTICE 'Hornbill Villa: % units (all 1 bedroom)', hornbill_count;
  RAISE NOTICE 'Kingfisher Villa: % units (all 1 bedroom)', kingfisher_count;
  RAISE NOTICE 'Glass Cottages: % units (all 1 bedroom)', glass_count;
  RAISE NOTICE 'Total: % units across 3 villas', hornbill_count + kingfisher_count + glass_count;
  RAISE NOTICE 'Check-in: 1:30 PM, Check-out: 11:30 AM';
END $$;


