-- BOOKINGS
create table public.bookings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  listing_id uuid references public.listings(id) not null,
  start_date date not null,
  end_date date not null,
  total_price integer not null, -- cents
  status text check (status in ('pending', 'confirmed', 'cancelled', 'rejected')) default 'pending',
  payment_intent_id text, -- stripe
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- FUNCTION to auto-update updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- TRIGGER for bookings updated_at
create trigger update_bookings_updated_at
before update on public.bookings
for each row execute procedure public.update_updated_at_column();

-- RLS POLICIES FOR BOOKINGS
alter table public.bookings enable row level security;

-- Users can create bookings for themselves
create policy "Users can insert own bookings" on public.bookings
  for insert with check (auth.uid() = user_id);

-- Users can view their own bookings
create policy "Users can view own bookings" on public.bookings
  for select using (auth.uid() = user_id);

-- Hosts can view bookings for their own listings
create policy "Hosts can view bookings for their listings" on public.bookings
  for select using (
    exists (
      select 1 from public.listings
      where listings.id = bookings.listing_id
      and listings.host_id = auth.uid()
    )
  );

-- Users can update their own bookings (e.g., to cancel)
create policy "Users can update own bookings" on public.bookings
  for update using (auth.uid() = user_id);

-- Hosts can update bookings for their listings (e.g. confirm/reject)
create policy "Hosts can update bookings for their listings" on public.bookings
  for update using (
    exists (
      select 1 from public.listings
      where listings.id = bookings.listing_id
      and listings.host_id = auth.uid()
    )
  );
