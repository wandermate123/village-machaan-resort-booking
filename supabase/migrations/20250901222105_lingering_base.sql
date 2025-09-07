/*
  # Insert Default Data for Village Machaan Resort

  1. Default Data
    - Admin user account
    - Villa configurations
    - Package offerings
    - Sample pricing rules

  2. Configuration
    - Set up default admin credentials
    - Configure villa amenities and pricing
    - Create experience packages
    - Set seasonal pricing rules
*/

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
  'sunrise-escape',
  'The Sunrise Escape',
  'Enjoy an unforgettable early morning safari experience with our Sunrise Escape package',
  ARRAY['Early morning safari', 'Professional guide', 'Breakfast in wilderness', 'Photography assistance', 'Safari equipment'],
  7500,
  '4 Days / 3 Nights',
  true
),
(
  'taste-of-wild',
  'Taste of the Wild',
  'Immerse yourself in nature with authentic jungle cuisine and traditional cooking methods',
  ARRAY['Traditional cooking experience', 'Ingredient foraging tour', 'Tribal cuisine tasting', 'Cooking class', 'Farm-to-table dining'],
  8500,
  '3 Days / 2 Nights',
  true
),
(
  'eternal-romance',
  'Eternal Romance',
  'A romantic getaway designed for couples seeking intimacy in nature',
  ARRAY['Private candlelit dinner', 'Couples spa treatment', 'Romantic sunset safari', 'Champagne service', 'Private villa access'],
  9500,
  '2 Days / 1 Night',
  true
),
(
  'wings-in-wild',
  'Wings in the Wild',
  'Perfect for bird watching enthusiasts with expert ornithologists',
  ARRAY['Expert ornithologist guide', 'Early morning bird watching', 'High-quality binoculars', 'Photography workshops', 'Species documentation'],
  6500,
  '5 Days / 4 Nights',
  true
) ON CONFLICT (id) DO NOTHING;

-- Insert Default Pricing Rules
INSERT INTO pricing_rules (villa_id, rule_name, rule_type, start_date, end_date, price_modifier, is_active) VALUES 
(
  'glass-cottage',
  'Weekend Premium',
  'weekend',
  '2024-01-01',
  '2024-12-31',
  1.3,
  true
),
(
  'hornbill-villa',
  'Weekend Premium',
  'weekend',
  '2024-01-01',
  '2024-12-31',
  1.3,
  true
),
(
  'kingfisher-villa',
  'Weekend Premium',
  'weekend',
  '2024-01-01',
  '2024-12-31',
  1.3,
  true
),
(
  'glass-cottage',
  'Holiday Season',
  'holiday',
  '2024-12-20',
  '2025-01-05',
  1.8,
  true
),
(
  'hornbill-villa',
  'Holiday Season',
  'holiday',
  '2024-12-20',
  '2025-01-05',
  1.8,
  true
),
(
  'kingfisher-villa',
  'Holiday Season',
  'holiday',
  '2024-12-20',
  '2025-01-05',
  1.8,
  true
) ON CONFLICT DO NOTHING;

-- Insert Sample Availability (Next 90 days)
INSERT INTO availability (villa_id, date, is_available)
SELECT 
  v.id,
  generate_series(
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '90 days',
    INTERVAL '1 day'
  )::date,
  true
FROM villas v
ON CONFLICT (villa_id, date) DO NOTHING;