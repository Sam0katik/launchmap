-- Balance top-ups via a crypto payment provider (Cryptomus). One row per
-- checkout, keyed by our order_id, so a webhook can credit the balance exactly
-- once (idempotent). Access is service-role only — RLS on, no policies.
--
-- Run in the Supabase SQL editor after 0001–0011. Idempotent.

create table if not exists topups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id text not null unique,
  amount_cents integer not null,
  status text not null default 'pending',
  credited boolean not null default false,
  created_at timestamptz not null default now()
);

alter table topups enable row level security;
