/*
  # Recreate booking tables with correct schema

  1. New Tables
    - Drop and recreate `bookings` table with correct column names
    - Drop and recreate `booking_payments` table 
    - Drop and recreate `booking_activities` table
    - Drop and recreate `safari_bookings` table

  2. Security
    - Enable RLS on all tables
    - Add policies for public booking creation and admin management

  3. Changes
    - Fix column naming inconsistencies (email vs guest_email)
    - Remove advance payment complexity
    - Simplify payment status options
    - Add proper constraints and indexes
*/

-- Drop existing tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS booking_activities CASCADE;
DROP TABLE IF EXISTS safari_bookings CASCADE;
DROP TABLE IF EXISTS booking_payments CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;

-- Create bookings table with correct schema
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id text UNIQUE NOT NULL,
  session_id text,
  guest_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  check_in date NOT NULL,
  check_out date NOT NULL,
  guests integer NOT NULL CHECK (guests > 0),
  villa_id text NOT NULL REFERENCES villas(id) ON DELETE CASCADE,
  villa_name text NOT NULL,
  villa_price integer NOT NULL CHECK (villa_price > 0),
  package_id text REFERENCES packages(id) ON DELETE SET NULL,
  package_name text,
  package_price integer DEFAULT 0 CHECK (package_price >= 0),
  safari_requests jsonb DEFAULT '[]'::jsonb,
  safari_total integer DEFAULT 0 CHECK (safari_total >= 0),
  subtotal integer NOT NULL CHECK (subtotal > 0),
  taxes integer DEFAULT 0 CHECK (taxes >= 0),
  total_amount integer NOT NULL CHECK (total_amount > 0),
  payment_method text DEFAULT 'pending',
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'partial_refund')),
  razorpay_order_id text,
  razorpay_payment_id text,
  payment_reference text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show')),
  special_requests text,
  admin_notes text,
  booking_source text DEFAULT 'website',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create booking_payments table
CREATE TABLE IF NOT EXISTS booking_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  payment_type text NOT NULL CHECK (payment_type IN ('full', 'refund')),
  amount integer NOT NULL CHECK (amount > 0),
  currency text DEFAULT 'INR',
  gateway text DEFAULT 'razorpay',
  gateway_payment_id text,
  gateway_order_id text,
  gateway_response jsonb,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  payment_method text,
  processed_by uuid REFERENCES admin_users(id),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create booking_activities table
CREATE TABLE IF NOT EXISTS booking_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  activity_type text NOT NULL CHECK (activity_type IN ('created', 'updated', 'confirmed', 'cancelled', 'payment_received', 'checked_in', 'checked_out', 'note_added')),
  description text NOT NULL,
  old_values jsonb,
  new_values jsonb,
  performed_by uuid REFERENCES admin_users(id),
  performed_by_name text,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- Create safari_bookings table
CREATE TABLE IF NOT EXISTS safari_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  safari_option_id text NOT NULL REFERENCES safari_options(id) ON DELETE CASCADE,
  safari_date date NOT NULL,
  safari_timing text NOT NULL,
  persons integer NOT NULL CHECK (persons > 0),
  price_per_person integer DEFAULT 0 CHECK (price_per_person >= 0),
  total_price integer DEFAULT 0 CHECK (total_price >= 0),
  status text DEFAULT 'inquiry' CHECK (status IN ('inquiry', 'confirmed', 'cancelled', 'completed')),
  confirmation_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_booking_id ON bookings(booking_id);
CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(email);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_bookings_villa_id ON bookings(villa_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);

CREATE INDEX IF NOT EXISTS idx_booking_payments_booking_id ON booking_payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_payments_gateway_payment_id ON booking_payments(gateway_payment_id);
CREATE INDEX IF NOT EXISTS idx_booking_payments_status ON booking_payments(status);

CREATE INDEX IF NOT EXISTS idx_booking_activities_booking_id ON booking_activities(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_activities_created_at ON booking_activities(created_at);

CREATE INDEX IF NOT EXISTS idx_safari_bookings_booking_id ON safari_bookings(booking_id);
CREATE INDEX IF NOT EXISTS idx_safari_bookings_safari_date ON safari_bookings(safari_date);

-- Enable Row Level Security
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE safari_bookings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for bookings
CREATE POLICY "Anyone can create bookings"
  ON bookings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can view bookings"
  ON bookings
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage all bookings"
  ON bookings
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users
    WHERE id::text = auth.uid()::text AND is_active = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users
    WHERE id::text = auth.uid()::text AND is_active = true
  ));

-- Create RLS policies for booking_payments
CREATE POLICY "System can create payments"
  ON booking_payments
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can manage payments"
  ON booking_payments
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users
    WHERE id::text = auth.uid()::text AND is_active = true
  ));

-- Create RLS policies for booking_activities
CREATE POLICY "System can log activities"
  ON booking_activities
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view activities"
  ON booking_activities
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users
    WHERE id::text = auth.uid()::text AND is_active = true
  ));

-- Create RLS policies for safari_bookings
CREATE POLICY "Anyone can create safari bookings"
  ON safari_bookings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can manage safari bookings"
  ON safari_bookings
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users
    WHERE id::text = auth.uid()::text AND is_active = true
  ));

-- Create trigger function for updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger function for logging booking activities
CREATE OR REPLACE FUNCTION log_booking_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO booking_activities (booking_id, activity_type, description, new_values, performed_by_name)
    VALUES (NEW.id, 'created', 'Booking created', to_jsonb(NEW), 'System');
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO booking_activities (booking_id, activity_type, description, old_values, new_values, performed_by_name)
    VALUES (NEW.id, 'updated', 'Booking updated', to_jsonb(OLD), to_jsonb(NEW), 'System');
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_booking_payments_updated_at
  BEFORE UPDATE ON booking_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_safari_bookings_updated_at
  BEFORE UPDATE ON safari_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER log_booking_activity_trigger
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION log_booking_activity();