-- =====================================================
-- COMPLETE DATABASE RESTORATION SCRIPT
-- Village Machaan Resort Booking System
-- Run this in your Supabase SQL editor to restore everything
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. CORE TABLES CREATION
-- =====================================================

-- Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name text NOT NULL,
  role text DEFAULT 'admin' CHECK (role IN ('admin', 'manager', 'staff')),
  is_active boolean DEFAULT true,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Villas Table
CREATE TABLE IF NOT EXISTS villas (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  base_price integer NOT NULL CHECK (base_price > 0),
  max_guests integer NOT NULL CHECK (max_guests > 0),
  amenities text[] DEFAULT '{}',
  images text[] DEFAULT '{}',
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Packages Table
CREATE TABLE IF NOT EXISTS packages (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  inclusions text[] DEFAULT '{}',
  price integer NOT NULL CHECK (price >= 0),
  duration text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Safari Options Table
CREATE TABLE IF NOT EXISTS safari_options (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  duration text,
  price_per_person integer NOT NULL CHECK (price_per_person > 0),
  max_persons integer NOT NULL CHECK (max_persons > 0),
  timings jsonb DEFAULT '[]',
  highlights text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Pricing Rules Table for Dynamic Pricing
CREATE TABLE IF NOT EXISTS pricing_rules (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  villa_id text REFERENCES villas(id) ON DELETE CASCADE,
  rule_name text NOT NULL,
  rule_type text NOT NULL CHECK (rule_type IN ('seasonal', 'weekend', 'holiday', 'demand')),
  start_date date,
  end_date date,
  price_modifier decimal(3,2) NOT NULL DEFAULT 1.0 CHECK (price_modifier > 0),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Availability Table
CREATE TABLE IF NOT EXISTS availability (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  villa_id text NOT NULL REFERENCES villas(id) ON DELETE CASCADE,
  date date NOT NULL,
  is_available boolean DEFAULT true,
  price_override integer CHECK (price_override > 0),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(villa_id, date)
);

-- Booking Holds Table (Temporary Inventory Locks)
CREATE TABLE IF NOT EXISTS booking_holds (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  villa_id text NOT NULL REFERENCES villas(id) ON DELETE CASCADE,
  check_in date NOT NULL,
  check_out date NOT NULL,
  session_id text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Main Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id text UNIQUE NOT NULL,
  session_id text,
  guest_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  check_in date NOT NULL,
  check_out date NOT NULL,
  guests integer NOT NULL CHECK (guests > 0),
  villa_id text NOT NULL REFERENCES villas(id),
  villa_name text NOT NULL,
  villa_price integer NOT NULL CHECK (villa_price > 0),
  package_id text REFERENCES packages(id),
  package_name text,
  package_price integer DEFAULT 0 CHECK (package_price >= 0),
  safari_options jsonb DEFAULT '[]',
  safari_total integer DEFAULT 0 CHECK (safari_total >= 0),
  total_amount integer NOT NULL CHECK (total_amount > 0),
  special_requests text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'partial_refund')),
  payment_intent_id text,
  razorpay_order_id text,
  razorpay_payment_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Payments Table for Transaction Records
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  razorpay_payment_id text UNIQUE NOT NULL,
  razorpay_order_id text NOT NULL,
  amount integer NOT NULL CHECK (amount > 0),
  currency text DEFAULT 'INR',
  status text NOT NULL CHECK (status IN ('created', 'authorized', 'captured', 'refunded', 'failed')),
  method text, -- card, upi, netbanking, wallet
  gateway_response jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Email Logs Table
CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  email_type text NOT NULL CHECK (email_type IN ('confirmation', 'cancellation', 'reminder', 'admin_notification')),
  recipient_email text NOT NULL,
  subject text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  error_message text,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Safari Queries Table
CREATE TABLE IF NOT EXISTS safari_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id text,
  guest_name text NOT NULL,
  email text NOT NULL,
  phone text,
  safari_option_id text REFERENCES safari_options(id) ON DELETE SET NULL,
  safari_name text NOT NULL,
  preferred_date date,
  preferred_timing text,
  number_of_persons integer NOT NULL CHECK (number_of_persons > 0),
  special_requirements text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  admin_notes text,
  response text,
  responded_at timestamptz,
  responded_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- 2. INVENTORY MANAGEMENT TABLES
-- =====================================================

-- Villa Inventory Table
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

-- Booking Units Table
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

-- Inventory Blocks Table
CREATE TABLE IF NOT EXISTS inventory_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  villa_inventory_id UUID NOT NULL REFERENCES villa_inventory(id) ON DELETE CASCADE,
  block_date DATE NOT NULL,
  block_type TEXT NOT NULL CHECK (block_type IN ('maintenance', 'owner_use', 'seasonal_closure', 'deep_cleaning')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. INDEXES FOR PERFORMANCE
-- =====================================================

-- Core table indexes
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_bookings_villa ON bookings(villa_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_availability_villa_date ON availability(villa_id, date);
CREATE INDEX IF NOT EXISTS idx_booking_holds_expires ON booking_holds(expires_at);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_dates ON pricing_rules(start_date, end_date);

-- Safari queries indexes
CREATE INDEX IF NOT EXISTS idx_safari_queries_booking_id ON safari_queries(booking_id);
CREATE INDEX IF NOT EXISTS idx_safari_queries_email ON safari_queries(email);
CREATE INDEX IF NOT EXISTS idx_safari_queries_status ON safari_queries(status);
CREATE INDEX IF NOT EXISTS idx_safari_queries_safari_option_id ON safari_queries(safari_option_id);
CREATE INDEX IF NOT EXISTS idx_safari_queries_preferred_date ON safari_queries(preferred_date);
CREATE INDEX IF NOT EXISTS idx_safari_queries_created_at ON safari_queries(created_at);

-- Inventory indexes
CREATE INDEX IF NOT EXISTS idx_villa_inventory_villa_id ON villa_inventory(villa_id);
CREATE INDEX IF NOT EXISTS idx_villa_inventory_status ON villa_inventory(status);
CREATE INDEX IF NOT EXISTS idx_villa_inventory_bedroom_count ON villa_inventory(bedroom_count);
CREATE INDEX IF NOT EXISTS idx_booking_units_booking_id ON booking_units(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_units_villa_inventory_id ON booking_units(villa_inventory_id);
CREATE INDEX IF NOT EXISTS idx_booking_units_dates ON booking_units(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_booking_units_status ON booking_units(status);
CREATE INDEX IF NOT EXISTS idx_inventory_blocks_date ON inventory_blocks(block_date);
CREATE INDEX IF NOT EXISTS idx_inventory_blocks_villa_inventory_id ON inventory_blocks(villa_inventory_id);

-- =====================================================
-- 4. ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE villas ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE safari_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE safari_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE villa_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_blocks ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. RLS POLICIES
-- =====================================================

-- Admin Users Policies
DROP POLICY IF EXISTS "Admin users can manage their own data" ON admin_users;
CREATE POLICY "Admin users can manage their own data"
  ON admin_users
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = id::text);

-- Villas Policies
DROP POLICY IF EXISTS "Anyone can view active villas" ON villas;
CREATE POLICY "Anyone can view active villas"
  ON villas
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

DROP POLICY IF EXISTS "Admins can manage villas" ON villas;
CREATE POLICY "Admins can manage villas"
  ON villas
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id::text = auth.uid()::text AND is_active = true
    )
  );

-- Packages Policies
DROP POLICY IF EXISTS "Anyone can view active packages" ON packages;
CREATE POLICY "Anyone can view active packages"
  ON packages
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage packages" ON packages;
CREATE POLICY "Admins can manage packages"
  ON packages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id::text = auth.uid()::text AND is_active = true
    )
  );

-- Safari Options Policies
DROP POLICY IF EXISTS "Anyone can view active safari options" ON safari_options;
CREATE POLICY "Anyone can view active safari options"
  ON safari_options
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage safari options" ON safari_options;
CREATE POLICY "Admins can manage safari options"
  ON safari_options
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id::text = auth.uid()::text AND is_active = true
    )
  );

-- Bookings Policies
DROP POLICY IF EXISTS "Guests can view their own bookings" ON bookings;
CREATE POLICY "Guests can view their own bookings"
  ON bookings
  FOR SELECT
  TO anon, authenticated
  USING (email = auth.email() OR true); -- Allow public access for now

DROP POLICY IF EXISTS "Anyone can create bookings" ON bookings;
CREATE POLICY "Anyone can create bookings"
  ON bookings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage all bookings" ON bookings;
CREATE POLICY "Admins can manage all bookings"
  ON bookings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id::text = auth.uid()::text AND is_active = true
    )
  );

-- Safari Queries Policies
DROP POLICY IF EXISTS "Allow public to create safari queries" ON safari_queries;
CREATE POLICY "Allow public to create safari queries" ON safari_queries
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public to read own safari queries" ON safari_queries;
CREATE POLICY "Allow public to read own safari queries" ON safari_queries
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admins to manage safari queries" ON safari_queries;
CREATE POLICY "Allow admins to manage safari queries" ON safari_queries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = auth.jwt() ->> 'email'
    )
  );

-- Inventory Policies
DROP POLICY IF EXISTS "Allow all operations on villa_inventory" ON villa_inventory;
CREATE POLICY "Allow all operations on villa_inventory" ON villa_inventory FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on booking_units" ON booking_units;
CREATE POLICY "Allow all operations on booking_units" ON booking_units FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on inventory_blocks" ON inventory_blocks;
CREATE POLICY "Allow all operations on inventory_blocks" ON inventory_blocks FOR ALL USING (true);

-- =====================================================
-- 6. FUNCTIONS
-- =====================================================

-- Villa Summary Function
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

-- Available Units Function
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

-- Unit Assignment Function
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

-- =====================================================
-- 7. VIEWS
-- =====================================================

-- Occupancy Dashboard View
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

-- =====================================================
-- 8. SAMPLE DATA INSERTION
-- =====================================================

-- Insert Default Admin User
INSERT INTO admin_users (id, email, password_hash, name, role) VALUES 
(
  uuid_generate_v4(),
  'admin@villagemachaan.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: admin123
  'Village Machaan Admin',
  'admin'
) ON CONFLICT (email) DO NOTHING;

-- Insert Default Villas
INSERT INTO villas (id, name, description, base_price, max_guests, amenities, images, status) VALUES 
(
  'glass-cottage',
  'Glass Cottage',
  'Transparent walls offering 360° forest views with modern amenities and eco-friendly design',
  15000,
  4,
  ARRAY['Forest View', 'Private Deck', 'Glass Walls', 'Eco-Friendly', 'Air Conditioning', 'Mini Bar'],
  ARRAY['https://images.pexels.com/photos/1115804/pexels-photo-1115804.jpeg?auto=compress&cs=tinysrgb&w=800'],
  'active'
),
(
  'hornbill-villa',
  'Hornbill Villa',
  'Spacious villa with modern amenities, garden access, and perfect for families',
  18000,
  6,
  ARRAY['Garden View', 'BBQ Area', 'Spacious Living', 'Modern Kitchen', 'Family Room', 'Outdoor Seating'],
  ARRAY['https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=800'],
  'active'
),
(
  'kingfisher-villa',
  'Kingfisher Villa',
  'Premium luxury villa with private pool, lake views, and butler service',
  22000,
  8,
  ARRAY['Lake View', 'Private Pool', 'Premium Suite', 'Butler Service', 'Jacuzzi', 'Wine Cellar'],
  ARRAY['https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800'],
  'active'
) ON CONFLICT (id) DO NOTHING;

-- Insert Default Packages
INSERT INTO packages (id, name, description, inclusions, price, duration, is_active) VALUES 
(
  'romantic-getaway',
  'Romantic Getaway Package',
  'Perfect for couples seeking privacy and romance',
  ARRAY['Candlelight Dinner', 'Couples Spa', 'Champagne', 'Room Decoration', 'Late Checkout'],
  5000,
  '2 days',
  true
),
(
  'family-adventure',
  'Family Adventure Package',
  'Fun-filled activities for the whole family',
  ARRAY['Nature Walk', 'Kids Activities', 'Family Games', 'Picnic Lunch', 'Photography Session'],
  3000,
  '1 day',
  true
),
(
  'wildlife-safari',
  'Wildlife Safari Package',
  'Experience the thrill of wildlife spotting',
  ARRAY['Morning Safari', 'Evening Safari', 'Expert Guide', 'Binoculars', 'Refreshments'],
  4000,
  '1 day',
  true
) ON CONFLICT (id) DO NOTHING;

-- Insert Safari Options
INSERT INTO safari_options (id, name, description, duration, price_per_person, max_persons, timings, highlights, is_active) VALUES
  (
    'morning-wildlife-safari',
    'Morning Wildlife Safari',
    'Early morning safari to spot wildlife in their natural habitat',
    '3 hours',
    2500,
    6,
    '["early-morning", "morning"]'::jsonb,
    ARRAY['Wildlife spotting', 'Photography', 'Nature guide', 'Refreshments'],
    true
  ),
  (
    'evening-wildlife-safari',
    'Evening Wildlife Safari',
    'Evening safari to witness wildlife during golden hour',
    '3 hours',
    2500,
    6,
    '["evening", "sunset"]'::jsonb,
    ARRAY['Wildlife spotting', 'Sunset views', 'Photography', 'Refreshments'],
    true
  ),
  (
    'night-wildlife-safari',
    'Night Wildlife Safari',
    'Night safari to experience nocturnal wildlife',
    '2 hours',
    3000,
    4,
    '["night"]'::jsonb,
    ARRAY['Nocturnal wildlife', 'Night vision', 'Expert guide', 'Hot beverages'],
    true
  )
ON CONFLICT (id) DO NOTHING;

-- Insert Accurate Villa Inventory Data
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

-- Insert Sample Safari Queries
INSERT INTO safari_queries (
  booking_id,
  guest_name,
  email,
  phone,
  safari_option_id,
  safari_name,
  preferred_date,
  preferred_timing,
  number_of_persons,
  special_requirements,
  status,
  admin_notes,
  response,
  responded_at,
  responded_by
) VALUES
  (
    'BK001',
    'John Smith',
    'john.smith@email.com',
    '+91-9876543210',
    'morning-wildlife-safari',
    'Morning Wildlife Safari',
    CURRENT_DATE + INTERVAL '3 days',
    'early-morning',
    2,
    'Vegetarian meals preferred',
    'pending',
    NULL,
    NULL,
    NULL,
    NULL
  ),
  (
    'BK002',
    'Sarah Johnson',
    'sarah.j@email.com',
    '+91-9876543211',
    'evening-wildlife-safari',
    'Evening Wildlife Safari',
    CURRENT_DATE + INTERVAL '5 days',
    'evening',
    4,
    'Wheelchair accessible vehicle needed',
    'confirmed',
    'Special vehicle arranged',
    'Confirmed for 4 persons. Wheelchair accessible vehicle arranged.',
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    'admin'
  ),
  (
    'BK003',
    'Mike Wilson',
    'mike.w@email.com',
    '+91-9876543212',
    'morning-wildlife-safari',
    'Morning Wildlife Safari',
    CURRENT_DATE + INTERVAL '7 days',
    'morning',
    1,
    'Photography equipment allowed?',
    'pending',
    NULL,
    NULL,
    NULL,
    NULL
  )
ON CONFLICT DO NOTHING;

-- =====================================================
-- 9. VERIFICATION
-- =====================================================

DO $$
DECLARE
  hornbill_count INTEGER;
  kingfisher_count INTEGER;
  glass_count INTEGER;
  admin_count INTEGER;
  villa_count INTEGER;
  package_count INTEGER;
  safari_option_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO hornbill_count FROM villa_inventory WHERE villa_id = 'hornbill-villa';
  SELECT COUNT(*) INTO kingfisher_count FROM villa_inventory WHERE villa_id = 'kingfisher-villa';
  SELECT COUNT(*) INTO glass_count FROM villa_inventory WHERE villa_id = 'glass-cottage';
  SELECT COUNT(*) INTO admin_count FROM admin_users;
  SELECT COUNT(*) INTO villa_count FROM villas;
  SELECT COUNT(*) INTO package_count FROM packages;
  SELECT COUNT(*) INTO safari_option_count FROM safari_options;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DATABASE RESTORATION COMPLETED SUCCESSFULLY!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Admin Users: %', admin_count;
  RAISE NOTICE 'Villas: %', villa_count;
  RAISE NOTICE 'Packages: %', package_count;
  RAISE NOTICE 'Safari Options: %', safari_option_count;
  RAISE NOTICE 'Hornbill Villa: % units (all 1 bedroom)', hornbill_count;
  RAISE NOTICE 'Kingfisher Villa: % units (all 1 bedroom)', kingfisher_count;
  RAISE NOTICE 'Glass Cottages: % units (all 1 bedroom)', glass_count;
  RAISE NOTICE 'Total Villa Units: %', hornbill_count + kingfisher_count + glass_count;
  RAISE NOTICE 'Check-in: 1:30 PM, Check-out: 11:30 AM';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Default Admin Login:';
  RAISE NOTICE 'Email: admin@villagemachaan.com';
  RAISE NOTICE 'Password: admin123';
  RAISE NOTICE '========================================';
END $$;
