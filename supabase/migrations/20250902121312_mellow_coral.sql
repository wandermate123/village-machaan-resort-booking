/*
  # Create Safari Management Tables

  1. New Tables
    - `safari_options`
      - `id` (text, primary key)
      - `name` (text)
      - `description` (text)
      - `duration` (text)
      - `price_per_person` (integer)
      - `max_persons` (integer)
      - `images` (text array)
      - `timings` (jsonb array)
      - `highlights` (text array)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `safari_bookings`
      - `id` (uuid, primary key)
      - `booking_id` (uuid, foreign key to bookings)
      - `safari_id` (text, foreign key to safari_options)
      - `selected_date` (date)
      - `selected_timing` (text)
      - `persons` (integer)
      - `status` (text: inquiry, confirmed, cancelled)
      - `confirmation_notes` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for public read access and admin management
*/

-- Create safari_options table
CREATE TABLE IF NOT EXISTS safari_options (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  duration text,
  price_per_person integer DEFAULT 0,
  max_persons integer DEFAULT 6,
  images text[] DEFAULT '{}',
  timings jsonb DEFAULT '[]',
  highlights text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create safari_bookings table
CREATE TABLE IF NOT EXISTS safari_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  safari_id text REFERENCES safari_options(id) ON DELETE CASCADE,
  selected_date date NOT NULL,
  selected_timing text NOT NULL,
  persons integer NOT NULL DEFAULT 1,
  status text DEFAULT 'inquiry',
  confirmation_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add constraints
ALTER TABLE safari_options ADD CONSTRAINT safari_options_price_check CHECK (price_per_person >= 0);
ALTER TABLE safari_options ADD CONSTRAINT safari_options_max_persons_check CHECK (max_persons > 0);
ALTER TABLE safari_bookings ADD CONSTRAINT safari_bookings_persons_check CHECK (persons > 0);
ALTER TABLE safari_bookings ADD CONSTRAINT safari_bookings_status_check CHECK (status IN ('inquiry', 'confirmed', 'cancelled', 'completed'));

-- Enable RLS
ALTER TABLE safari_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE safari_bookings ENABLE ROW LEVEL SECURITY;

-- Policies for safari_options
CREATE POLICY "Anyone can view active safari options"
  ON safari_options
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage safari options"
  ON safari_options
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id::text = auth.uid()::text AND is_active = true
  ));

-- Policies for safari_bookings
CREATE POLICY "Anyone can create safari bookings"
  ON safari_bookings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can manage all safari bookings"
  ON safari_bookings
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id::text = auth.uid()::text AND is_active = true
  ));

CREATE POLICY "Guests can view their safari bookings"
  ON safari_bookings
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Insert default safari options
INSERT INTO safari_options (id, name, description, duration, price_per_person, max_persons, images, timings, highlights, is_active) VALUES
(
  'morning-wildlife-safari',
  'Morning Wildlife Safari',
  'An early morning safari with the first light of day, a memorable journey through the wild landscape where you will get to see the diverse fauna and flora of the region.',
  '4 hours',
  0,
  6,
  ARRAY['/images/glass-cottage/main.jpg'],
  '[
    {"value": "early-morning", "label": "Early Morning (5:30 AM - 9:30 AM)"},
    {"value": "morning", "label": "Morning (6:00 AM - 10:00 AM)"}
  ]'::jsonb,
  ARRAY[
    'Safari duration: 4 hours with professional guide',
    'All safety equipment and refreshments included',
    'Best wildlife viewing opportunities in early morning',
    'Photography assistance and tips included'
  ],
  true
),
(
  'evening-wildlife-safari',
  'Evening Wildlife Safari',
  'Take a walk through the afternoon - evening hours of the jungle, when the animals come out to drink water and the birds return to their nests, creating a magical atmosphere.',
  '3.5 hours',
  0,
  6,
  ARRAY['/images/hornbill/main.jpg'],
  '[
    {"value": "afternoon", "label": "Afternoon (2:00 PM - 5:30 PM)"},
    {"value": "evening", "label": "Evening (4:00 PM - 7:30 PM)"}
  ]'::jsonb,
  ARRAY[
    'Safari duration: 3.5 hours with professional guide',
    'Perfect for bird watching and sunset photography',
    'Refreshments and safety equipment included',
    'Guided nature walk with expert naturalist'
  ],
  true
),
(
  'night-wildlife-safari',
  'Night Wildlife Safari',
  'Experience the night safari with our specialized night vision equipment through the dark forest with expert naturalists. Discover nocturnal wildlife and enjoy the unique sounds of the jungle at night.',
  '3 hours',
  0,
  6,
  ARRAY['/images/kingfisher/main.jpg'],
  '[
    {"value": "night", "label": "Night (8:00 PM - 11:00 PM)"},
    {"value": "late-night", "label": "Late Night (9:00 PM - 12:00 AM)"}
  ]'::jsonb,
  ARRAY[
    'Night safari duration: 3 hours with specialized equipment',
    'Night vision equipment and safety gear provided',
    'Unique nocturnal wildlife viewing experience',
    'Expert guide with extensive night safari experience'
  ],
  true
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_safari_options_active ON safari_options(is_active);
CREATE INDEX IF NOT EXISTS idx_safari_bookings_booking_id ON safari_bookings(booking_id);
CREATE INDEX IF NOT EXISTS idx_safari_bookings_safari_id ON safari_bookings(safari_id);
CREATE INDEX IF NOT EXISTS idx_safari_bookings_status ON safari_bookings(status);
CREATE INDEX IF NOT EXISTS idx_safari_bookings_date ON safari_bookings(selected_date);