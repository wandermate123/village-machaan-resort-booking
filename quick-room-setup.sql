-- =====================================================
-- QUICK ROOM ALLOCATION SETUP
-- Run this in your Supabase SQL editor for basic room allocation
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

-- 3. Enable RLS
ALTER TABLE villa_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_units ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
CREATE POLICY "Allow all operations on villa_inventory" ON villa_inventory FOR ALL USING (true);
CREATE POLICY "Allow all operations on booking_units" ON booking_units FOR ALL USING (true);

-- 5. Insert Sample Data
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

-- 6. Create Indexes
CREATE INDEX IF NOT EXISTS idx_villa_inventory_villa_id ON villa_inventory(villa_id);
CREATE INDEX IF NOT EXISTS idx_booking_units_booking_id ON booking_units(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_units_dates ON booking_units(check_in, check_out);

-- Success message
SELECT 'Room allocation system setup completed! You can now use the room allocation features.' as message;
