-- CANCELLATION POLICY

-- Add cancellation policy configuration to listings (default 7 days)
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS cancellation_policy_days INTEGER DEFAULT 7 NOT NULL;

-- Add snapshot of policy to bookings (to respect conditions at time of booking)
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS cancellation_policy_snapshot INTEGER;
