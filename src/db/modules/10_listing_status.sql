-- LISTING STATUS

-- Add status column to listings
-- Default to 'draft'
-- Check constraint to ensure valid values

ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published'));

-- Update existing listings to 'published' so we don't hide them
UPDATE public.listings SET status = 'published' WHERE status = 'draft'; -- Actually, default is draft, but for existing ones we want them visible?
-- Wait, if I add the column with default 'draft', all existing rows will get 'draft'.
-- I should probably set existing rows to 'published' to preserve current behavior.

UPDATE public.listings SET status = 'published';

-- Reset default to 'draft' for *future* inserts
ALTER TABLE public.listings ALTER COLUMN status SET DEFAULT 'draft';
