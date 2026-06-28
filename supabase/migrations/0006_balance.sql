-- Internal USD balance (in cents). Users top up the site, then spend the
-- balance on per-map unlocks ($3). Balance is money, so ONLY the server
-- (service-role) may change a profile — we drop the broad client UPDATE policy
-- so a user can't edit their own balance via the anon key. Reads stay allowed.
--
-- Run in the Supabase SQL editor after 0001–0005. Idempotent.

alter table profiles
  add column if not exists balance_cents int not null default 0;

drop policy if exists "users update own profile" on profiles;
