-- Create safari queries table for admin management
-- Run this in your Supabase SQL editor

-- 1. Safari Queries Table
CREATE TABLE IF NOT EXISTS safari_queries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id TEXT,
  guest_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  safari_option_id TEXT NOT NULL,
  safari_name TEXT NOT NULL,
  preferred_date DATE,
  preferred_timing TEXT,
  number_of_persons INTEGER DEFAULT 1,
  special_requirements TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  admin_notes TEXT,
  response TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  responded_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_safari_queries_booking_id ON safari_queries(booking_id);
CREATE INDEX IF NOT EXISTS idx_safari_queries_status ON safari_queries(status);
CREATE INDEX IF NOT EXISTS idx_safari_queries_created_at ON safari_queries(created_at);
CREATE INDEX IF NOT EXISTS idx_safari_queries_safari_option_id ON safari_queries(safari_option_id);

-- 3. Enable Row Level Security
ALTER TABLE safari_queries ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies (allow all for now, can be restricted later)
CREATE POLICY "Allow all operations on safari_queries" ON safari_queries FOR ALL USING (true);

-- 5. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_safari_queries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_safari_queries_updated_at
  BEFORE UPDATE ON safari_queries
  FOR EACH ROW
  EXECUTE FUNCTION update_safari_queries_updated_at();

-- 7. Insert some sample data for testing
INSERT INTO safari_queries (booking_id, guest_name, email, phone, safari_option_id, safari_name, preferred_date, preferred_timing, number_of_persons, special_requirements, status) VALUES
('BK001', 'John Smith', 'john.smith@email.com', '+91-9876543210', 'morning-wildlife-safari', 'Morning Wildlife Safari', '2024-01-15', 'early-morning', 2, 'Vegetarian meals preferred', 'pending'),
('BK002', 'Sarah Johnson', 'sarah.j@email.com', '+91-9876543211', 'evening-wildlife-safari', 'Evening Wildlife Safari', '2024-01-16', 'evening', 4, 'Wheelchair accessible vehicle needed', 'confirmed'),
('BK003', 'Mike Wilson', 'mike.w@email.com', '+91-9876543212', 'morning-wildlife-safari', 'Morning Wildlife Safari', '2024-01-17', 'morning', 1, 'Photography equipment allowed?', 'pending'),
('BK004', 'Emma Davis', 'emma.d@email.com', '+91-9876543213', 'evening-wildlife-safari', 'Evening Wildlife Safari', '2024-01-18', 'afternoon', 3, 'Children aged 8 and 10', 'confirmed'),
('BK005', 'David Brown', 'david.b@email.com', '+91-9876543214', 'morning-wildlife-safari', 'Morning Wildlife Safari', '2024-01-19', 'early-morning', 2, 'Bird watching focus', 'completed')
ON CONFLICT (id) DO NOTHING;
