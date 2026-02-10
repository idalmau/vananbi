-- PROFILES AVATAR & STORAGE

-- Add avatar_url to profiles if not exists
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- STORAGE BUCKET
-- Create 'avatars' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- RLS POLICIES FOR STORAGE

-- 1. Public Read Access
CREATE POLICY "Public Access Avatars"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- 2. Authenticated Users can upload their own avatar
CREATE POLICY "Users can upload own avatar to avatars"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid() = owner AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Users can update their own avatar
CREATE POLICY "Users can update own avatar in avatars"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'avatars' AND
    auth.uid() = owner AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Users can delete their own avatar
CREATE POLICY "Users can delete own avatar from avatars"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'avatars' AND
    auth.uid() = owner AND
    (storage.foldername(name))[1] = auth.uid()::text
);
