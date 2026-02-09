-- AVAILABILITY WINDOW

-- Add availability window configuration to listings
-- If null, it means "Available Indefinitely"
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS available_from DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS available_to DATE DEFAULT NULL;
