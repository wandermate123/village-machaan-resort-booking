/*
  # Update Package Pricing Structure

  1. Changes
    - Update breakfast package to show total cost (villa + breakfast)
    - Modify package pricing to be per-person for breakfast
    - Update package descriptions to clarify total pricing

  2. Security
    - Maintain existing RLS policies
    - No changes to security structure
*/

-- Update breakfast package to reflect total pricing structure
UPDATE packages 
SET 
  name = 'Villa Stay with Breakfast',
  description = 'Complete villa stay including delicious continental breakfast served daily. Total price includes villa accommodation plus breakfast for all guests.',
  price = 500,
  duration = 'Per person per day',
  updated_at = now()
WHERE id = 'breakfast-addon';

-- Ensure the breakfast package exists with correct structure
INSERT INTO packages (id, name, description, inclusions, price, duration, is_active)
VALUES (
  'villa-with-breakfast',
  'Villa Stay with Breakfast',
  'Complete villa stay including delicious continental breakfast served daily. Price shown is total cost including villa and breakfast.',
  ARRAY[
    'Villa accommodation for selected dates',
    'Continental breakfast for all guests',
    'Fresh fruits and local specialties',
    'Tea/Coffee throughout the day',
    'All villa amenities included'
  ],
  500,
  'Per person per day (added to villa cost)',
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  inclusions = EXCLUDED.inclusions,
  price = EXCLUDED.price,
  duration = EXCLUDED.duration,
  updated_at = now();