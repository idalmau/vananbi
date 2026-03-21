-- CONVERSATIONS
create table public.conversations (
  id uuid default uuid_generate_v4() primary key,
  listing_id uuid references public.listings(id) on delete cascade not null,
  guest_id uuid references public.profiles(id) not null,
  host_id uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(listing_id, guest_id, host_id)
);

-- MESSAGES (Chat)
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  booking_id uuid references public.bookings(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete cascade,
  sender_id uuid references public.profiles(id) not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  read_at timestamp with time zone
);

-- RLS POLICIES FOR CONVERSATIONS
alter table public.conversations enable row level security;

create policy "Users can view their own conversations" on public.conversations
  for select using (auth.uid() = guest_id or auth.uid() = host_id);

create policy "Users can insert their own conversations" on public.conversations
  for insert with check (auth.uid() = guest_id);

-- RLS POLICIES FOR MESSAGES
alter table public.messages enable row level security;

-- Legacy Booking Policies (can be kept or phased out)
create policy "Participants can view booking messages" on public.messages
  for select using (
    exists (
      select 1 from public.bookings
      join public.listings on listings.id = bookings.listing_id
      where bookings.id = messages.booking_id
      and (bookings.user_id = auth.uid() or listings.host_id = auth.uid())
    )
  );

-- Conversation Policies
create policy "Participants can view conversation messages" on public.messages
  for select using (
    exists (
      select 1 from public.conversations
      where conversations.id = messages.conversation_id
      and (conversations.guest_id = auth.uid() or conversations.host_id = auth.uid())
    )
  );

create policy "Participants can insert messages" on public.messages
  for insert with check (
    auth.uid() = sender_id
    and (
      -- Case 1: Booking linked message
      exists (
        select 1 from public.bookings
        join public.listings on listings.id = bookings.listing_id
        where bookings.id = booking_id
        and (bookings.user_id = auth.uid() or listings.host_id = auth.uid())
      )
      or
      -- Case 2: Conversation linked message
      exists (
        select 1 from public.conversations
        where conversations.id = conversation_id
        and (conversations.guest_id = auth.uid() or conversations.host_id = auth.uid())
      )
    )
  );

-- Participants can update messages (e.g. mark as read)
create policy "Participants can update messages" on public.messages
  for update using (
    exists (
      select 1 from public.conversations
      where conversations.id = messages.conversation_id
      and (conversations.guest_id = auth.uid() or conversations.host_id = auth.uid())
    )
    or
    exists (
      select 1 from public.bookings
      join public.listings on listings.id = bookings.listing_id
      where bookings.id = messages.booking_id
      and (bookings.user_id = auth.uid() or listings.host_id = auth.uid())
    )
  );
