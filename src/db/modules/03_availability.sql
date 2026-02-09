-- AVAILABILITY (Blocked Dates)
create table public.availability (
  id uuid default uuid_generate_v4() primary key,
  listing_id uuid references public.listings(id) not null,
  date_range daterange not null,
  reason text -- 'booking', 'maintenance'
);

-- EXCLUSION CONSTRAINT to prevent overlapping availability blocks for the same listing
alter table public.availability
add constraint no_overlapping_availability
exclude using gist (
  listing_id with =,
  date_range with &&
);

-- RLS POLICIES FOR AVAILABILITY
alter table public.availability enable row level security;

-- Public can view all availability
create policy "Availability is public" on public.availability
  for select using (true);

-- Hosts can insert/update/delete availability for their own listings
create policy "Hosts can manage availability" on public.availability
  for all using (
    exists (
      select 1 from public.listings
      where listings.id = availability.listing_id
      and listings.host_id = auth.uid()
    )
  );
