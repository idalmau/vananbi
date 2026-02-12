-- VAN ASSETS & MIGRATION

-- 1. Create 'vans' table
CREATE TABLE IF NOT EXISTS public.vans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    host_id UUID REFERENCES public.profiles(id) NOT NULL,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    license_plate TEXT,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create 'van_photos' table
CREATE TABLE IF NOT EXISTS public.van_photos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    van_id UUID REFERENCES public.vans(id) ON DELETE CASCADE NOT NULL,
    url TEXT NOT NULL,
    type TEXT NOT NULL, -- 'registration', 'front', 'back', 'side', 'interior'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS
ALTER TABLE public.vans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.van_photos ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Vans: Hosts access own, Admin access all (implied by service role or specific admin policy later)
CREATE POLICY "Hosts can view own vans" ON public.vans FOR SELECT USING (auth.uid() = host_id);
CREATE POLICY "Hosts can insert own vans" ON public.vans FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Hosts can update own vans" ON public.vans FOR UPDATE USING (auth.uid() = host_id);

-- Van Photos: Similar
CREATE POLICY "Hosts can view own van photos" ON public.van_photos FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.vans WHERE id = van_photos.van_id AND host_id = auth.uid())
);
CREATE POLICY "Hosts can insert own van photos" ON public.van_photos FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.vans WHERE id = van_photos.van_id AND host_id = auth.uid())
);

-- 5. Update 'listings' table
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS van_id UUID REFERENCES public.vans(id);

-- 6. MIGRATION: Backfill existing listings with pseudo-vans
DO $$
DECLARE
    r RECORD;
    new_van_id UUID;
BEGIN
    -- Only migrate listings that don't have a van_id yet
    FOR r IN SELECT * FROM public.listings WHERE van_id IS NULL LOOP
        -- Generate a new Van ID
        new_van_id := uuid_generate_v4();
        
        -- Insert a new "Migrated Van" for this listing
        -- We use the listing title as the model logic for now
        INSERT INTO public.vans (id, host_id, make, model, year, license_plate, status)
        VALUES (
            new_van_id,
            r.host_id, 
            'Generic Make', 
            r.title, 
            2024, 
            'MIGRATED-' || substring(r.id::text, 1, 8),
            'approved' -- Auto-approve migrated vans so listings stay live
        );

        -- Link the listing to the new van
        UPDATE public.listings SET van_id = new_van_id WHERE id = r.id;
    END LOOP;
END $$;

-- 7. Add Constraints (Concurrent safety is tricky but this is DDL)
-- We need btree_gist for the exclusion constraint (uuid =)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Ensure Published listings have a van
-- We use a CHECK constraint that is only valid if status is 'published'
ALTER TABLE public.listings 
ADD CONSTRAINT require_van_for_published_listings 
CHECK (status != 'published' OR van_id IS NOT NULL);

-- Prevent Overlapping 'Published' Listings for same Van
-- "If two rows have the same van_id, and both are 'published', their date ranges must NOT overlap."
-- Note: we treat NULL available_from as '-infinity' and NULL available_to as 'infinity'
ALTER TABLE public.listings
ADD CONSTRAINT no_overlapping_published_van_bookings
EXCLUDE USING gist (
    van_id WITH =, 
    daterange(
        coalesce(available_from, '-infinity'::date), 
        coalesce(available_to, 'infinity'::date), 
        '[]'
    ) WITH &&
) WHERE (status = 'published');
