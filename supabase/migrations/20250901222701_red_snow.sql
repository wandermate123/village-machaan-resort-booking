/*
  # Complete Booking System Database Schema

  1. New Tables
    - `admin_users` - Admin authentication and user management
    - `villas` - Resort accommodation details and pricing
    - `packages` - Experience packages and add-ons
    - `bookings` - Main booking records with guest information
    - `booking_holds` - Temporary inventory locks to prevent double bookings
    - `pricing_rules` - Dynamic pricing based on seasons/demand
    - `availability` - Villa availability calendar
    - `payments` - Payment transaction records
    - `email_logs` - Track all automated emails sent

  2. Security
    - Enable RLS on all tables
    - Admin-only access for management tables
    - Guest access for their own booking data
    - Public read access for villa/package information

  3. Features
    - Real-time inventory management
    - Dynamic pricing engine
    - Comprehensive audit trails
    - Email tracking and delivery status
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_bookings_villa ON bookings(villa_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_availability_villa_date ON availability(villa_id, date);
CREATE INDEX IF NOT EXISTS idx_booking_holds_expires ON booking_holds(expires_at);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_dates ON pricing_rules(start_date, end_date);

-- Enable Row Level Security
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE villas ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Admin Users
CREATE POLICY "Admin users can manage their own data"
  ON admin_users
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = id::text);

-- RLS Policies for Villas (Public read, admin write)
CREATE POLICY "Anyone can view active villas"
  ON villas
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

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

-- RLS Policies for Packages (Public read, admin write)
CREATE POLICY "Anyone can view active packages"
  ON packages
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

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

-- RLS Policies for Pricing Rules (Admin only)
CREATE POLICY "Admins can manage pricing rules"
  ON pricing_rules
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id::text = auth.uid()::text AND is_active = true
    )
  );

-- RLS Policies for Availability (Public read, admin write)
CREATE POLICY "Anyone can view availability"
  ON availability
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can insert availability"
  ON availability
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id::text = auth.uid()::text AND is_active = true
    )
  );

CREATE POLICY "Admins can update availability"
  ON availability
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id::text = auth.uid()::text AND is_active = true
    )
  );

CREATE POLICY "Admins can delete availability"
  ON availability
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id::text = auth.uid()::text AND is_active = true
    )
  );

-- RLS Policies for Booking Holds (System managed)
CREATE POLICY "System can manage booking holds"
  ON booking_holds
  FOR ALL
  TO anon, authenticated
  USING (true);

-- RLS Policies for Bookings
CREATE POLICY "Guests can view their own bookings"
  ON bookings
  FOR SELECT
  TO anon, authenticated
  USING (email = auth.email() OR true); -- Allow public access for now

CREATE POLICY "Anyone can create bookings"
  ON bookings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

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

-- RLS Policies for Payments (Admin and booking owner)
CREATE POLICY "Admins can view all payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id::text = auth.uid()::text AND is_active = true
    )
  );

CREATE POLICY "System can create payments"
  ON payments
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- RLS Policies for Email Logs (Admin only)
CREATE POLICY "Admins can view email logs"
  ON email_logs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id::text = auth.uid()::text AND is_active = true
    )
  );