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
  stripe_customer_id text,
  stripe_account_id text,
  onboarding_complete boolean default false,
  stripe_requirements_due text[] default '{}'::text[],
  payouts_enabled boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS POLICIES
alter table public.profiles enable row level security;

-- Users can insert their own profile
create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Users can view their own profile
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

-- Profiles are viewable by everyone ONLY if they are a 'host'
create policy "Public can view hosts" on public.profiles
  for select using (role = 'host');

-- Allow hosts to view profiles of guests who have booked their listings
create policy "Hosts can view booking guests" on public.profiles
  for select using (
    exists (
      select 1 from public.bookings
      join public.listings on listings.id = bookings.listing_id
      where bookings.user_id = profiles.id
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
