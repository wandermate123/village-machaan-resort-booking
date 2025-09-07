/*
  # Update Package Pricing Structure

  1. Changes
    - Update breakfast package to show total cost including villa
    - Modify package pricing calculation to be per-person for breakfast
    - Update package descriptions to clarify total cost structure

  2. Package Updates
    - Breakfast Add-on: Now calculated as villa cost + (500 × guests × nights)
    - Other packages: Keep existing structure but clarify pricing
*/

-- Update the breakfast package to clarify it includes villa cost
UPDATE packages 
SET 
  name = 'Villa with Breakfast',
  description = 'Complete package including villa accommodation and delicious continental breakfast served daily. Total cost includes villa + breakfast for all guests.',
  price = 500,
  updated_at = now()
WHERE id = 'breakfast-addon';

-- Ensure we have the breakfast package if it doesn't exist
INSERT INTO packages (id, name, description, inclusions, price, duration, is_active)
VALUES (
  'breakfast-addon',
  'Villa with Breakfast', 
  'Complete package including villa accommodation and delicious continental breakfast served daily. Total cost includes villa + breakfast for all guests.',
  ARRAY[
    'Villa accommodation included',
    'Continental breakfast for all guests',
    'Fresh fruits and local specialties',
    'Tea/Coffee service',
    'Daily housekeeping'
  ],
  500,
  'Per person per day',
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  inclusions = EXCLUDED.inclusions,
  price = EXCLUDED.price,
  duration = EXCLUDED.duration,
  updated_at = now();