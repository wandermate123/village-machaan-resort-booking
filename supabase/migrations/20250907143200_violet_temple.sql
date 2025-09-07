/*
  # Create booking_holds table

  1. New Tables
    - `booking_holds`
      - `id` (uuid, primary key)
      - `villa_id` (text, references villas)
      - `check_in` (date)
      - `check_out` (date)
      - `session_id` (text)
      - `expires_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `booking_holds` table
    - Add policies for managing booking holds

  3. Indexes
    - Index on session_id and expires_at for performance
*/

CREATE TABLE IF NOT EXISTS public.booking_holds (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    villa_id text NOT NULL,
    check_in date NOT NULL,
    check_out date NOT NULL,
    session_id text NOT NULL,
    expires_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Add foreign key constraint to villas table
ALTER TABLE public.booking_holds 
ADD CONSTRAINT booking_holds_villa_id_fkey 
FOREIGN KEY (villa_id) REFERENCES public.villas(id) ON DELETE CASCADE;

-- Add index for faster lookups on session_id and expires_at
CREATE INDEX IF NOT EXISTS idx_booking_holds_session_expires 
ON public.booking_holds (session_id, expires_at);

-- Add index for villa_id lookups
CREATE INDEX IF NOT EXISTS idx_booking_holds_villa_id 
ON public.booking_holds (villa_id);

-- Enable Row Level Security
ALTER TABLE public.booking_holds ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Anyone can create booking holds"
  ON public.booking_holds
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can view booking holds"
  ON public.booking_holds
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "System can delete expired holds"
  ON public.booking_holds
  FOR DELETE
  TO anon, authenticated
  USING (expires_at < now());