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
