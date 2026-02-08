
-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists btree_gist;

-- PROFILES (Users)
-- Links to Supabase Auth.users
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  role text check (role in ('guest', 'host')) default 'guest',
  first_name text,
  last_name text,
  username text unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  first_name text,
  last_name text,
  username text unique
);

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
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- AVAILABILITY (Blocked Dates)
-- Stores simple ranges where a listing is NOT available.
-- Ideally we check against this + bookings.
-- For MVP, successful bookings can insert into this same table or we query both.
-- Better approach: "Bookings" table drives availability.
-- Let's stick to PRD Table: Availability for "Listing Management" generally, but Bookings acts as source of truth for reservations.
-- PRD says: "Availability stores booked intervals only".
-- Let's treat valid "Bookings" as the source of unavailability.
-- Plus an explicit "Availability" table for host-blocked dates if needed, but PRD implies simple.
-- Let's follow PRD data model exactly.
-- Availability: listing_id, date_range (daterange)

create table public.availability (
  id uuid default uuid_generate_v4() primary key,
  listing_id uuid references public.listings(id) not null,
  date_range daterange not null,
  reason text -- 'booking', 'maintenance'
);

-- EXCLUSION CONSTRAINT to prevent overlapping availability blocks for the same listing
-- This prevents double booking at the DB level.
alter table public.availability
add constraint no_overlapping_availability
exclude using gist (
  listing_id with =,
  date_range with &&
);

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

-- PAYMENTS
create table public.payments (
  id uuid default uuid_generate_v4() primary key,
  booking_id uuid references public.bookings(id) not null,
  amount integer not null,
  status text check (status in ('succeeded', 'failed', 'pending')) not null,
  stripe_payment_id text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS POLICIES FOR PAYMENTS
alter table public.payments enable row level security;

-- Users can view their own payments (linked via booking)
create policy "Users can view own payments" on public.payments
  for select using (
    exists (
      select 1 from public.bookings
      where bookings.id = payments.booking_id
      and bookings.user_id = auth.uid()
    )
  );

-- Hosts can view payments for their listings
create policy "Hosts can view payments for their listings" on public.payments
  for select using (
    exists (
      select 1 from public.bookings
      join public.listings on listings.id = bookings.listing_id
      where bookings.id = payments.booking_id
      and listings.host_id = auth.uid()
    )
  );

-- RLS POLICIES (Basic Skeleton)
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.bookings enable row level security;

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

-- Users can insert their own profile
create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Users can view their own profile
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

-- Profiles are viewable by everyone ONLY if they are a 'host'
create policy "Public can view hosts" on public.profiles
  for select using (role = 'host');

-- RLS POLICIES FOR BOOKINGS

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

-- TRIGGER (Handle New User)
-- This triggers when a new user signs up via Supabase Auth.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role, first_name, last_name, username)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'guest'),
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'username'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- MESSAGES (Chat)
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  booking_id uuid references public.bookings(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  read_at timestamp with time zone
);

-- RLS POLICIES FOR MESSAGES
alter table public.messages enable row level security;

-- Participants (Guest & Host) can view messages
create policy "Participants can view messages" on public.messages
  for select using (
    exists (
      select 1 from public.bookings
      join public.listings on listings.id = bookings.listing_id
      where bookings.id = messages.booking_id
      and (
        bookings.user_id = auth.uid() -- Guest
        or listings.host_id = auth.uid() -- Host
      )
    )
  );

-- Participants can insert messages
create policy "Participants can insert messages" on public.messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.bookings
      join public.listings on listings.id = bookings.listing_id
      where bookings.id = booking_id
      and (
        bookings.user_id = auth.uid() -- Guest
        or listings.host_id = auth.uid() -- Host
      )
    )
  );

-- Participants can update messages (e.g. mark as read)
create policy "Participants can update messages" on public.messages
  for update using (
    exists (
      select 1 from public.bookings
      join public.listings on listings.id = bookings.listing_id
      where bookings.id = messages.booking_id
      and (
        bookings.user_id = auth.uid() -- Guest
        or listings.host_id = auth.uid() -- Host
      )
    )
  );
