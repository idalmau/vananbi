-- REVIEWS
create table public.reviews (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  booking_id uuid not null,
  listing_id uuid not null,
  guest_id uuid not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text null,
  constraint reviews_pkey primary key (id),
  constraint reviews_booking_id_fkey foreign key (booking_id) references bookings (id) on delete cascade,
  constraint reviews_listing_id_fkey foreign key (listing_id) references listings (id) on delete cascade,
  constraint reviews_guest_id_fkey foreign key (guest_id) references profiles (id) on delete cascade,
  constraint reviews_booking_id_key unique (booking_id)
);

-- Enable RLS
alter table public.reviews enable row level security;

-- Policies
-- Everyone can read reviews
create policy "Reviews are viewable by everyone" on public.reviews
  for select using (true);

-- Guests can create reviews for their own bookings
create policy "Guests can create reviews for their own bookings" on public.reviews
  for insert with check (auth.uid() = guest_id);

-- Guests can update their own reviews (optional, but good)
create policy "Guests can update their own reviews" on public.reviews
  for update using (auth.uid() = guest_id);

-- Guests can delete their own reviews
create policy "Guests can delete their own reviews" on public.reviews
  for delete using (auth.uid() = guest_id);
