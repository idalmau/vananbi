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

-- Users can insert payments for their own bookings
create policy "Users can insert own payments" on public.payments
  for insert with check (
    exists (
      select 1 from public.bookings
      where bookings.id = payments.booking_id
      and bookings.user_id = auth.uid()
    )
  );
