-- Fix hornbill villa image path from .jpg to .png
-- This migration corrects the image file extension to match the actual file

-- Update hornbill villa images
UPDATE villas 
SET images = ARRAY[
  '/images/hornbill/main.png',
  '/images/hornbill/exterior.jpg', 
  '/images/hornbill/garden.jpg'
]
WHERE id = 'hornbill-villa';

-- Update breakfast package image to use correct hornbill image
UPDATE packages 
SET images = ARRAY['/images/hornbill/main.png']
WHERE id = 'breakfast-package';

-- Verify the updates
SELECT id, name, images FROM villas WHERE id = 'hornbill-villa';
SELECT id, name, images FROM packages WHERE id = 'breakfast-package';
