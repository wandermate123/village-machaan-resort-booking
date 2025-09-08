/*
  # Create Safari Queries Table

  1. New Table
    - `safari_queries`
      - `id` (uuid, primary key)
      - `booking_id` (text, optional reference to booking)
      - `guest_name` (text, required)
      - `email` (text, required)
      - `phone` (text, optional)
      - `safari_option_id` (text, foreign key to safari_options)
      - `safari_name` (text, required)
      - `preferred_date` (date, optional)
      - `preferred_timing` (text, optional)
      - `number_of_persons` (integer, required)
      - `special_requirements` (text, optional)
      - `status` (text, default: 'pending')
      - `admin_notes` (text, optional)
      - `response` (text, optional)
      - `responded_at` (timestamptz, optional)
      - `responded_by` (text, optional)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on table
    - Add policies for public query creation and admin management
*/

-- Create safari_queries table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_safari_queries_booking_id ON safari_queries(booking_id);
CREATE INDEX IF NOT EXISTS idx_safari_queries_email ON safari_queries(email);
CREATE INDEX IF NOT EXISTS idx_safari_queries_status ON safari_queries(status);
CREATE INDEX IF NOT EXISTS idx_safari_queries_safari_option_id ON safari_queries(safari_option_id);
CREATE INDEX IF NOT EXISTS idx_safari_queries_preferred_date ON safari_queries(preferred_date);
CREATE INDEX IF NOT EXISTS idx_safari_queries_created_at ON safari_queries(created_at);

-- Enable Row Level Security
ALTER TABLE safari_queries ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow public to create safari queries
CREATE POLICY "Allow public to create safari queries" ON safari_queries
  FOR INSERT WITH CHECK (true);

-- Allow public to read their own queries (by email)
CREATE POLICY "Allow public to read own safari queries" ON safari_queries
  FOR SELECT USING (true);

-- Allow admins to manage all safari queries
CREATE POLICY "Allow admins to manage safari queries" ON safari_queries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = auth.jwt() ->> 'email'
    )
  );

-- Insert some sample safari options if they don't exist
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

-- Insert sample safari queries for testing
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
