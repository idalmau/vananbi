-- LISTINGS
create table public.listings (
  id uuid default uuid_generate_v4() primary key,
  host_id uuid references public.profiles(id) not null,
  title text not null,
  description text,
  price_per_night integer not null, -- stored in cents
  location text not null,
  latitude double precision,
  longitude double precision,
  image_url text, -- simplified for MVP, single image or comma-separated
  vehicle_type text check (vehicle_type in ('camper', 'motorhome', 'caravan', 'minivan', 'other')) default 'other',
  handover_method text check (handover_method in ('in_person', 'automatic')) default 'in_person',
  rules jsonb default '[]'::jsonb,
  equipment jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS POLICIES FOR LISTINGS
alter table public.listings enable row level security;

-- Public listings are viewable by everyone
create policy "Listings are public" on public.listings
  for select using (true);

-- Hosts can insert their own listings
create policy "Hosts can insert own listings" on public.listings
  for insert with check (auth.uid() = host_id);

-- Hosts can update their own listings
create policy "Hosts can update own listings" on public.listings
  for update using (auth.uid() = host_id);

-- Hosts can delete their own listings
create policy "Hosts can delete own listings" on public.listings
  for delete using (auth.uid() = host_id);

-- STORAGE & IMAGES
-- Create the 'listings' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('listings', 'listings', true)
ON CONFLICT (id) DO NOTHING;

-- Create the listing_images table
CREATE TABLE IF NOT EXISTS public.listing_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
    storage_path TEXT NOT NULL,
    url TEXT NOT NULL,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.listing_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for listing_images

-- Everyone can view images
CREATE POLICY "Public can view listing images"
ON public.listing_images FOR SELECT
USING (true);

-- Hosts can insert images for their own listings
CREATE POLICY "Hosts can upload images for their listings"
ON public.listing_images FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.listings
        WHERE id = listing_images.listing_id
        AND host_id = auth.uid()
    )
);

-- Hosts can update images for their own listings (e.g. reorder)
CREATE POLICY "Hosts can update images for their listings"
ON public.listing_images FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.listings
        WHERE id = listing_images.listing_id
        AND host_id = auth.uid()
    )
);

-- Hosts can delete images for their listings
CREATE POLICY "Hosts can delete images for their listings"
ON public.listing_images FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.listings
        WHERE id = listing_images.listing_id
        AND host_id = auth.uid()
    )
);

-- Storage Policies (Requires 'listings' folder structure: {listing_id}/{filename})

-- Allow public access to files
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'listings' );

-- Allow authenticated hosts to upload to their own listing folder
CREATE POLICY "Hosts can upload to their listing folder"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'listings'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
        SELECT id::text FROM public.listings WHERE host_id = auth.uid()
    )
);

-- Allow hosts to update/delete their own files
CREATE POLICY "Hosts can update/delete their own files"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'listings'
    AND auth.uid() = owner
);

CREATE POLICY "Hosts can delete their own files"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'listings'
    AND auth.uid() = owner
);
