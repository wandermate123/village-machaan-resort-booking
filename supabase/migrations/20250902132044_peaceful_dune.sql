/*
  # Update image paths for villas, packages, and safari options

  1. Updates
    - Update `villas` table with correct image paths
    - Update `packages` table with correct image paths  
    - Update `safari_options` table with correct image paths

  2. Changes
    - Fix all image paths to match actual files in public/images/
    - Add multiple images for better gallery display
    - Ensure all images use correct file names
*/

-- Update villa images with correct paths
UPDATE villas SET images = ARRAY[
  '/images/glass-cottage/main.jpg',
  '/images/whatsapp-image-1.jpg'
] WHERE id = 'glass-cottage';

UPDATE villas SET images = ARRAY[
  '/images/hornbill/main.jpg',
  '/images/hornbill/exterior.jpg',
  '/images/hornbill/interior.jpg',
  '/images/hornbill/garden.jpg',
  '/images/whatsapp-image-2.jpg'
] WHERE id = 'hornbill-villa';

UPDATE villas SET images = ARRAY[
  '/images/kingfisher/main.jpg',
  '/images/whatsapp-image-1.jpg',
  '/images/whatsapp-image-2.jpg'
] WHERE id = 'kingfisher-villa';

-- Update package images with correct paths
UPDATE packages SET images = ARRAY[
  '/images/glass-cottage/main.jpg',
  '/images/whatsapp-image-1.jpg'
] WHERE id = 'basic-stay';

UPDATE packages SET images = ARRAY[
  '/images/hornbill/main.jpg',
  '/images/whatsapp-image-2.jpg'
] WHERE id = 'breakfast-package';

-- Update safari option images with correct paths
UPDATE safari_options SET images = ARRAY[
  '/images/safari/tiger-safari-img-2.jpg',
  '/images/safari/screenshot-2025-08-27-morning.png'
] WHERE id = 'morning-wildlife-safari';

UPDATE safari_options SET images = ARRAY[
  '/images/safari/screenshot-2025-08-27-afternoon.png',
  '/images/safari/screenshot-2025-08-27-late.png'
] WHERE id = 'evening-wildlife-safari';

UPDATE safari_options SET images = ARRAY[
  '/images/safari/screenshot-2025-08-27-early.png',
  '/images/safari/tiger-safari-img-2.jpg'
] WHERE id = 'night-wildlife-safari';

-- Insert villas if they don't exist (for demo mode compatibility)
INSERT INTO villas (id, name, description, base_price, max_guests, amenities, images, status) 
VALUES 
  (
    'glass-cottage',
    'Glass Cottage',
    'A unique glass-walled cottage offering panoramic forest views with modern amenities.',
    15000,
    4,
    ARRAY['Glass walls', 'Forest view', 'Private deck', 'Eco-friendly', 'Air conditioning'],
    ARRAY['/images/glass-cottage/main.jpg', '/images/whatsapp-image-1.jpg'],
    'active'
  ),
  (
    'hornbill-villa',
    'Hornbill Villa', 
    'Spacious villa with garden views and BBQ area, perfect for families.',
    18000,
    6,
    ARRAY['Spacious living', 'Garden view', 'BBQ area', 'Family room', 'Modern kitchen'],
    ARRAY['/images/hornbill/main.jpg', '/images/hornbill/exterior.jpg', '/images/hornbill/interior.jpg', '/images/hornbill/garden.jpg', '/images/whatsapp-image-2.jpg'],
    'active'
  ),
  (
    'kingfisher-villa',
    'Kingfisher Villa',
    'Premium suite with lake views and private pool for the ultimate luxury experience.',
    22000,
    8,
    ARRAY['Premium suite', 'Lake view', 'Private pool', 'Butler service', 'Jacuzzi'],
    ARRAY['/images/kingfisher/main.jpg', '/images/whatsapp-image-1.jpg', '/images/whatsapp-image-2.jpg'],
    'active'
  )
ON CONFLICT (id) DO UPDATE SET
  images = EXCLUDED.images,
  updated_at = now();

-- Insert packages if they don't exist
INSERT INTO packages (id, name, description, inclusions, price, duration, images, is_active)
VALUES
  (
    'basic-stay',
    'Basic Stay Package',
    'Comfortable accommodation with essential amenities. Perfect for guests who prefer to explore dining options outside the resort.',
    ARRAY[
      'Comfortable villa accommodation',
      'Daily housekeeping service', 
      'Welcome refreshments on arrival',
      'Access to resort facilities',
      'Complimentary WiFi',
      '24/7 front desk assistance'
    ],
    0,
    'Per night',
    ARRAY['/images/glass-cottage/main.jpg', '/images/whatsapp-image-1.jpg'],
    true
  ),
  (
    'breakfast-package',
    'Breakfast Package',
    'Includes daily breakfast with your stay. Start your day with a delicious meal featuring local and continental options.',
    ARRAY[
      'All Basic Stay Package amenities',
      'Daily breakfast for all guests',
      'Fresh local and continental options', 
      'Special dietary accommodations',
      'Early morning tea/coffee service',
      'Seasonal fruit platter'
    ],
    500,
    'Per night',
    ARRAY['/images/hornbill/main.jpg', '/images/whatsapp-image-2.jpg'],
    true
  )
ON CONFLICT (id) DO UPDATE SET
  images = EXCLUDED.images,
  updated_at = now();

-- Insert safari options if they don't exist
INSERT INTO safari_options (id, name, description, duration, price_per_person, max_persons, images, timings, highlights, is_active)
VALUES
  (
    'morning-wildlife-safari',
    'Morning Wildlife Safari',
    'An early morning safari with the first light of day, a memorable journey through the wild landscape where you will get to see the diverse fauna and flora of the region.',
    '4 hours',
    0,
    6,
    ARRAY['/images/safari/tiger-safari-img-2.jpg', '/images/safari/screenshot-2025-08-27-morning.png'],
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
    ARRAY['/images/safari/screenshot-2025-08-27-afternoon.png', '/images/safari/screenshot-2025-08-27-late.png'],
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
    ARRAY['/images/safari/screenshot-2025-08-27-early.png', '/images/safari/tiger-safari-img-2.jpg'],
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
  )
ON CONFLICT (id) DO UPDATE SET
  images = EXCLUDED.images,
  updated_at = now();