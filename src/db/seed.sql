-- SEED DATA FOR LISTINGS
-- Instructions: 
-- 1. Go to your Supabase Dashboard -> Authentication -> Users.
-- 2. Copy the UUID of your user (the "host").
-- 3. Replace '12db962c-0735-430b-bea7-e2d36aee3cbd' lower down with that real UUID.
-- 4. Run this script in the Supabase SQL Editor.

INSERT INTO public.listings (title, description, price_per_night, location, image_url, host_id)
VALUES
(
    'VW T2 Roja Clásica',
    'Viaja al pasado con esta joya vintage. Ideal para amantes de la fotografía.',
    9000,
    'Costa Brava, España',
    'https://images.unsplash.com/photo-1583797227225-4233106c5a2a?auto=format&fit=crop&q=80&w=1000',
    '12db962c-0735-430b-bea7-e2d36aee3cbd'
),
(
    'Aventura Peps',
    'Espaciosa y minimalista. Diseñada para la libertad total y la pernocta salvaje.',
    8000,
    'Cubas de la Sagra, Madrid',
    'https://images.unsplash.com/photo-1654068472234-00f7df704a83?auto=format&fit=crop&q=80&w=1000',
    '12db962c-0735-430b-bea7-e2d36aee3cbd'
),
(
    'Vintage Van',
    'Furgoneta bicolor totalmente equipada. Perfecta para amaneceres frente al mar.',
    6500,
    'Santander, Cantabria',
    'https://images.unsplash.com/photo-1464851707681-f9d5fdaccea8?auto=format&fit=crop&q=80&w=1000',
    '12db962c-0735-430b-bea7-e2d36aee3cbd'
),
(
    'Caravana Picos',
    'Preparada para noches frías en el bosque. Incluye calefacción.',
    9000,
    'Picos de Europa, Asturias',
    'https://images.unsplash.com/photo-1597685204565-110abf469a1e?auto=format&fit=crop&q=80&w=1000',
    '12db962c-0735-430b-bea7-e2d36aee3cbd'
);
