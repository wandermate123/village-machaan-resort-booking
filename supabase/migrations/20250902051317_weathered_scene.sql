/*
  # Update Villa Pricing and Add Seasonal Rates

  1. Villa Price Updates
    - Glass Cottage: ₹7,500 (without breakfast), ₹8,000 (with breakfast)
    - Kingfisher Villa: ₹10,500 (without breakfast), ₹11,000 (with breakfast)
    - Hornbill Villa: ₹12,000 (without breakfast), ₹13,000 (with breakfast)

  2. Seasonal Pricing Rules
    - October 17-26: +₹1,000 increase for all villas
    - December 21-29: +₹2,000 increase for all villas

  3. Security
    - All existing RLS policies remain intact
*/

-- Update villa base prices (without breakfast rates)
UPDATE villas SET 
  base_price = 7500,
  updated_at = now()
WHERE id = 'glass-cottage';

UPDATE villas SET 
  base_price = 10500,
  updated_at = now()
WHERE id = 'kingfisher-villa';

UPDATE villas SET 
  base_price = 12000,
  updated_at = now()
WHERE id = 'hornbill-villa';

-- Add breakfast package options (if packages table exists)
DO $$
BEGIN
  -- Insert breakfast packages if they don't exist
  INSERT INTO packages (id, name, description, inclusions, price, duration, is_active)
  VALUES 
    ('breakfast-addon', 'Breakfast Add-on', 'Delicious continental breakfast served daily', 
     ARRAY['Continental breakfast', 'Fresh fruits', 'Local specialties', 'Tea/Coffee'], 
     500, 'Per day', true)
  ON CONFLICT (id) DO UPDATE SET
    price = 500,
    updated_at = now();
END $$;

-- Add seasonal pricing rules for October 17-26, 2024 (+₹1,000)
INSERT INTO pricing_rules (villa_id, rule_name, rule_type, start_date, end_date, price_modifier, is_active)
VALUES 
  (NULL, 'October Festival Season', 'seasonal', '2024-10-17', '2024-10-26', 1.133, true)
ON CONFLICT DO NOTHING;

-- Add seasonal pricing rules for December 21-29, 2024 (+₹2,000)
INSERT INTO pricing_rules (villa_id, rule_name, rule_type, start_date, end_date, price_modifier, is_active)
VALUES 
  (NULL, 'Christmas & New Year Season', 'holiday', '2024-12-21', '2024-12-29', 1.167, true)
ON CONFLICT DO NOTHING;

-- Update villa descriptions to mention breakfast options
UPDATE villas SET 
  description = 'A unique glass-walled cottage offering panoramic forest views. Experience nature up close with modern amenities. Breakfast available as add-on for ₹500/day.',
  updated_at = now()
WHERE id = 'glass-cottage';

UPDATE villas SET 
  description = 'Spacious villa with garden views and BBQ facilities. Perfect for families and groups. Breakfast available as add-on for ₹500/day.',
  updated_at = now()
WHERE id = 'kingfisher-villa';

UPDATE villas SET 
  description = 'Premium villa with lake views and private pool. Luxury accommodation with butler service. Breakfast available as add-on for ₹500/day.',
  updated_at = now()
WHERE id = 'hornbill-villa';