-- =====================================================
-- SIMPLE INVENTORY SETUP (Works with existing table)
-- Run this after adding the missing columns
-- =====================================================

-- 1. First, add missing columns if they don't exist
ALTER TABLE villa_inventory 
ADD COLUMN IF NOT EXISTS bedroom_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_occupancy INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS check_in_time TIME DEFAULT '13:30:00',
ADD COLUMN IF NOT EXISTS check_out_time TIME DEFAULT '11:30:00';

-- 2. Update existing records
UPDATE villa_inventory 
SET 
  bedroom_count = 1,
  max_occupancy = 2,
  check_in_time = '13:30:00',
  check_out_time = '11:30:00'
WHERE bedroom_count IS NULL OR max_occupancy IS NULL OR check_in_time IS NULL OR check_out_time IS NULL;

-- 3. Clear existing data and insert accurate inventory
DELETE FROM villa_inventory;

-- 4. Insert Accurate Villa Inventory Data
INSERT INTO villa_inventory (villa_id, unit_number, room_type, view_type, bedroom_count, max_occupancy, check_in_time, check_out_time, status, amenities, notes) VALUES

-- HORNBILL VILLA (4 units - All 1 bedroom)
('hornbill-villa', 'HV-01', 'villa', 'Forest View', 1, 2, '13:30:00', '11:30:00', 'available', 
 '{"Air Conditioning", "WiFi", "Kitchen", "Living Room", "Private Bathroom", "Balcony", "Mini Fridge", "Coffee Maker"}', 
 'Forest view villa with private entrance'),

('hornbill-villa', 'HV-02', 'villa', 'Garden View', 1, 2, '13:30:00', '11:30:00', 'available', 
 '{"Air Conditioning", "WiFi", "Kitchen", "Living Room", "Private Bathroom", "Balcony", "Mini Fridge", "Coffee Maker"}', 
 'Garden view villa with private entrance'),

('hornbill-villa', 'HV-03', 'villa', 'Forest View', 1, 2, '13:30:00', '11:30:00', 'available', 
 '{"Air Conditioning", "WiFi", "Kitchen", "Living Room", "Private Bathroom", "Balcony", "Mini Fridge", "Coffee Maker"}', 
 'Forest view villa with balcony'),

('hornbill-villa', 'HV-04', 'villa', 'Garden View', 1, 2, '13:30:00', '11:30:00', 'available', 
 '{"Air Conditioning", "WiFi", "Kitchen", "Living Room", "Private Bathroom", "Balcony", "Mini Fridge", "Coffee Maker"}', 
 'Garden view villa with balcony'),

-- KINGFISHER VILLA (4 units - All 1 bedroom)
('kingfisher-villa', 'KF-01', 'villa', 'Forest View', 1, 2, '13:30:00', '11:30:00', 'available', 
 '{"Air Conditioning", "WiFi", "Kitchen", "Living Room", "Private Bathroom", "Balcony", "Mini Fridge", "Coffee Maker"}', 
 'Forest view villa with private entrance'),

('kingfisher-villa', 'KF-02', 'villa', 'Garden View', 1, 2, '13:30:00', '11:30:00', 'available', 
 '{"Air Conditioning", "WiFi", "Kitchen", "Living Room", "Private Bathroom", "Balcony", "Mini Fridge", "Coffee Maker"}', 
 'Garden view villa with private entrance'),

('kingfisher-villa', 'KF-03', 'villa', 'Forest View', 1, 2, '13:30:00', '11:30:00', 'available', 
 '{"Air Conditioning", "WiFi", "Kitchen", "Living Room", "Private Bathroom", "Balcony", "Mini Fridge", "Coffee Maker"}', 
 'Forest view villa with balcony'),

('kingfisher-villa', 'KF-04', 'villa', 'Garden View', 1, 2, '13:30:00', '11:30:00', 'available', 
 '{"Air Conditioning", "WiFi", "Kitchen", "Living Room", "Private Bathroom", "Balcony", "Mini Fridge", "Coffee Maker"}', 
 'Garden view villa with balcony'),

-- GLASS COTTAGES (14 units - All 1 bedroom)
('glass-cottage', 'GC-01', 'cottage', 'Forest View', 1, 2, '13:30:00', '11:30:00', 'available', 
 '{"Air Conditioning", "WiFi", "Private Bathroom", "Glass Walls", "Nature View", "Mini Fridge", "Coffee Maker", "Reading Chair"}', 
 'Forest view glass cottage with panoramic nature views'),

('glass-cottage', 'GC-02', 'cottage', 'Garden View', 1, 2, '13:30:00', '11:30:00', 'available', 
 '{"Air Conditioning", "WiFi", "Private Bathroom", "Glass Walls", "Garden View", "Mini Fridge", "Coffee Maker", "Reading Chair"}', 
 'Garden view glass cottage with landscaped garden views'),

('glass-cottage', 'GC-03', 'cottage', 'Forest View', 1, 2, '13:30:00', '11:30:00', 'available', 
 '{"Air Conditioning", "WiFi", "Private Bathroom", "Glass Walls", "Nature View", "Mini Fridge", "Coffee Maker", "Reading Chair"}', 
 'Forest view glass cottage with panoramic nature views'),

('glass-cottage', 'GC-04', 'cottage', 'Garden View', 1, 2, '13:30:00', '11:30:00', 'available', 
 '{"Air Conditioning", "WiFi", "Private Bathroom", "Glass Walls", "Garden View", "Mini Fridge", "Coffee Maker", "Reading Chair"}', 
 'Garden view glass cottage with landscaped garden views'),

('glass-cottage', 'GC-05', 'cottage', 'Forest View', 1, 2, '13:30:00', '11:30:00', 'available', 
 '{"Air Conditioning", "WiFi", "Private Bathroom", "Glass Walls", "Nature View", "Mini Fridge", "Coffee Maker", "Reading Chair"}', 
 'Forest view glass cottage with panoramic nature views'),

('glass-cottage', 'GC-06', 'cottage', 'Garden View', 1, 2, '13:30:00', '11:30:00', 'available', 
 '{"Air Conditioning", "WiFi", "Private Bathroom", "Glass Walls", "Garden View", "Mini Fridge", "Coffee Maker", "Reading Chair"}', 
 'Garden view glass cottage with landscaped garden views'),

('glass-cottage', 'GC-07', 'cottage', 'Forest View', 1, 2, '13:30:00', '11:30:00', 'available', 
 '{"Air Conditioning", "WiFi", "Private Bathroom", "Glass Walls", "Nature View", "Mini Fridge", "Coffee Maker", "Reading Chair"}', 
 'Forest view glass cottage with panoramic nature views'),

('glass-cottage', 'GC-08', 'cottage', 'Garden View', 1, 2, '13:30:00', '11:30:00', 'available', 
 '{"Air Conditioning", "WiFi", "Private Bathroom", "Glass Walls", "Garden View", "Mini Fridge", "Coffee Maker", "Reading Chair"}', 
 'Garden view glass cottage with landscaped garden views'),

('glass-cottage', 'GC-09', 'cottage', 'Forest View', 1, 2, '13:30:00', '11:30:00', 'available', 
 '{"Air Conditioning", "WiFi", "Private Bathroom", "Glass Walls", "Nature View", "Mini Fridge", "Coffee Maker", "Reading Chair"}', 
 'Forest view glass cottage with elevated nature views'),

('glass-cottage', 'GC-10', 'cottage', 'Garden View', 1, 2, '13:30:00', '11:30:00', 'available', 
 '{"Air Conditioning", "WiFi", "Private Bathroom", "Glass Walls", "Garden View", "Mini Fridge", "Coffee Maker", "Reading Chair"}', 
 'Garden view glass cottage with elevated garden views'),

('glass-cottage', 'GC-11', 'cottage', 'Forest View', 1, 2, '13:30:00', '11:30:00', 'available', 
 '{"Air Conditioning", "WiFi", "Private Bathroom", "Glass Walls", "Nature View", "Mini Fridge", "Coffee Maker", "Reading Chair"}', 
 'Forest view glass cottage with elevated nature views'),

('glass-cottage', 'GC-12', 'cottage', 'Garden View', 1, 2, '13:30:00', '11:30:00', 'available', 
 '{"Air Conditioning", "WiFi", "Private Bathroom", "Glass Walls", "Garden View", "Mini Fridge", "Coffee Maker", "Reading Chair"}', 
 'Garden view glass cottage with elevated garden views'),

('glass-cottage', 'GC-13', 'cottage', 'Forest View', 1, 2, '13:30:00', '11:30:00', 'available', 
 '{"Air Conditioning", "WiFi", "Private Bathroom", "Glass Walls", "Nature View", "Mini Fridge", "Coffee Maker", "Reading Chair"}', 
 'Forest view glass cottage with elevated nature views'),

('glass-cottage', 'GC-14', 'cottage', 'Garden View', 1, 2, '13:30:00', '11:30:00', 'available', 
 '{"Air Conditioning", "WiFi", "Private Bathroom", "Glass Walls", "Garden View", "Mini Fridge", "Coffee Maker", "Reading Chair"}', 
 'Garden view glass cottage with elevated garden views');

-- 5. Create booking_units table if it doesn't exist
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

-- 6. Enable RLS and create policies
ALTER TABLE villa_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_units ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'villa_inventory' 
    AND policyname = 'Allow all operations on villa_inventory'
  ) THEN
    CREATE POLICY "Allow all operations on villa_inventory" ON villa_inventory FOR ALL USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'booking_units' 
    AND policyname = 'Allow all operations on booking_units'
  ) THEN
    CREATE POLICY "Allow all operations on booking_units" ON booking_units FOR ALL USING (true);
  END IF;
END $$;

-- 7. Create indexes
CREATE INDEX IF NOT EXISTS idx_villa_inventory_villa_id ON villa_inventory(villa_id);
CREATE INDEX IF NOT EXISTS idx_villa_inventory_status ON villa_inventory(status);
CREATE INDEX IF NOT EXISTS idx_booking_units_booking_id ON booking_units(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_units_dates ON booking_units(check_in, check_out);

-- 8. Verify setup
DO $$
DECLARE
  hornbill_count INTEGER;
  kingfisher_count INTEGER;
  glass_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO hornbill_count FROM villa_inventory WHERE villa_id = 'hornbill-villa';
  SELECT COUNT(*) INTO kingfisher_count FROM villa_inventory WHERE villa_id = 'kingfisher-villa';
  SELECT COUNT(*) INTO glass_count FROM villa_inventory WHERE villa_id = 'glass-cottage';
  
  RAISE NOTICE 'Villa inventory setup completed successfully!';
  RAISE NOTICE 'Hornbill Villa: % units (all 1 bedroom)', hornbill_count;
  RAISE NOTICE 'Kingfisher Villa: % units (all 1 bedroom)', kingfisher_count;
  RAISE NOTICE 'Glass Cottages: % units (all 1 bedroom)', glass_count;
  RAISE NOTICE 'Total: % units across 3 villas', hornbill_count + kingfisher_count + glass_count;
  RAISE NOTICE 'Check-in: 1:30 PM, Check-out: 11:30 AM';
END $$;
