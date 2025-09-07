/*
  # Inventory Management System

  1. New Tables
    - `villa_inventory`
      - `id` (uuid, primary key)
      - `villa_id` (text, foreign key to villas)
      - `unit_number` (text, unique identifier for each physical unit)
      - `room_type` (text, e.g., 'Studio Cottage', 'One Bedroom Villa')
      - `floor` (integer, optional for multi-story properties)
      - `view_type` (text, e.g., 'Forest View', 'Lake View')
      - `status` (text, 'available', 'maintenance', 'out_of_order')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `booking_units`
      - `id` (uuid, primary key)
      - `booking_id` (uuid, foreign key to bookings)
      - `villa_inventory_id` (uuid, foreign key to villa_inventory)
      - `check_in` (date)
      - `check_out` (date)
      - `status` (text, 'reserved', 'occupied', 'checked_out')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `inventory_blocks`
      - `id` (uuid, primary key)
      - `villa_inventory_id` (uuid, foreign key to villa_inventory)
      - `block_date` (date)
      - `block_type` (text, 'maintenance', 'owner_use', 'seasonal_closure')
      - `notes` (text, optional)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for admin management and public read access

  3. Indexes
    - Add indexes for efficient availability queries
    - Composite indexes for date range queries
*/

-- Villa Inventory Table (Physical Units)
CREATE TABLE IF NOT EXISTS villa_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  villa_id text NOT NULL REFERENCES villas(id) ON DELETE CASCADE,
  unit_number text NOT NULL,
  room_type text NOT NULL,
  floor integer DEFAULT 1,
  view_type text,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'maintenance', 'out_of_order')),
  amenities text[] DEFAULT '{}',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(villa_id, unit_number)
);

-- Booking Units (Links bookings to specific physical units)
CREATE TABLE IF NOT EXISTS booking_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  villa_inventory_id uuid NOT NULL REFERENCES villa_inventory(id) ON DELETE CASCADE,
  check_in date NOT NULL,
  check_out date NOT NULL,
  status text NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'occupied', 'checked_out', 'cancelled')),
  assigned_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Inventory Blocks (For maintenance, owner use, etc.)
CREATE TABLE IF NOT EXISTS inventory_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  villa_inventory_id uuid NOT NULL REFERENCES villa_inventory(id) ON DELETE CASCADE,
  block_date date NOT NULL,
  block_type text NOT NULL CHECK (block_type IN ('maintenance', 'owner_use', 'seasonal_closure', 'deep_cleaning')),
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(villa_inventory_id, block_date)
);

-- Enable Row Level Security
ALTER TABLE villa_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_blocks ENABLE ROW LEVEL SECURITY;

-- Policies for villa_inventory
CREATE POLICY "Anyone can view available inventory"
  ON villa_inventory
  FOR SELECT
  TO anon, authenticated
  USING (status = 'available');

CREATE POLICY "Admins can manage inventory"
  ON villa_inventory
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id::text = auth.uid()::text AND is_active = true
  ));

-- Policies for booking_units
CREATE POLICY "Admins can manage booking units"
  ON booking_units
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id::text = auth.uid()::text AND is_active = true
  ));

CREATE POLICY "System can create booking units"
  ON booking_units
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policies for inventory_blocks
CREATE POLICY "Anyone can view inventory blocks"
  ON inventory_blocks
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage inventory blocks"
  ON inventory_blocks
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id::text = auth.uid()::text AND is_active = true
  ));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_villa_inventory_villa_id ON villa_inventory(villa_id);
CREATE INDEX IF NOT EXISTS idx_villa_inventory_status ON villa_inventory(status);
CREATE INDEX IF NOT EXISTS idx_booking_units_booking_id ON booking_units(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_units_villa_inventory_id ON booking_units(villa_inventory_id);
CREATE INDEX IF NOT EXISTS idx_booking_units_dates ON booking_units(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_booking_units_status ON booking_units(status);
CREATE INDEX IF NOT EXISTS idx_inventory_blocks_villa_inventory_id ON inventory_blocks(villa_inventory_id);
CREATE INDEX IF NOT EXISTS idx_inventory_blocks_date ON inventory_blocks(block_date);

-- Insert initial inventory data
INSERT INTO villa_inventory (villa_id, unit_number, room_type, view_type) VALUES
-- Glass Cottage Units (14 total)
('glass-cottage', 'GC-001', 'Studio Cottage', 'Forest View'),
('glass-cottage', 'GC-002', 'Studio Cottage', 'Forest View'),
('glass-cottage', 'GC-003', 'Studio Cottage', 'Forest View'),
('glass-cottage', 'GC-004', 'Studio Cottage', 'Forest View'),
('glass-cottage', 'GC-005', 'Studio Cottage', 'Forest View'),
('glass-cottage', 'GC-006', 'Studio Cottage', 'Forest View'),
('glass-cottage', 'GC-007', 'Studio Cottage', 'Forest View'),
('glass-cottage', 'GC-008', 'Studio Cottage', 'Forest View'),
('glass-cottage', 'GC-009', 'Studio Cottage', 'Forest View'),
('glass-cottage', 'GC-010', 'Studio Cottage', 'Forest View'),
('glass-cottage', 'GC-011', 'Studio Cottage', 'Forest View'),
('glass-cottage', 'GC-012', 'Studio Cottage', 'Forest View'),
('glass-cottage', 'GC-013', 'Studio Cottage', 'Forest View'),
('glass-cottage', 'GC-014', 'Studio Cottage', 'Forest View'),

-- Hornbill Villa Units (4 total)
('hornbill-villa', 'HV-001', 'One Bedroom Villa', 'Garden View'),
('hornbill-villa', 'HV-002', 'One Bedroom Villa', 'Garden View'),
('hornbill-villa', 'HV-003', 'One Bedroom Villa', 'Garden View'),
('hornbill-villa', 'HV-004', 'One Bedroom Villa', 'Garden View'),

-- Kingfisher Villa Units (4 total)
('kingfisher-villa', 'KV-001', 'One Bedroom Villa', 'Lake View'),
('kingfisher-villa', 'KV-002', 'One Bedroom Villa', 'Lake View'),
('kingfisher-villa', 'KV-003', 'One Bedroom Villa', 'Lake View'),
('kingfisher-villa', 'KV-004', 'One Bedroom Villa', 'Lake View')

ON CONFLICT (villa_id, unit_number) DO NOTHING;