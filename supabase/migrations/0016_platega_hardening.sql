-- Platega top-ups + money-safety hardening. Run in the Supabase SQL editor
-- after 0001–0015. Idempotent.
--
-- 1) topups: provider fields for Platega (RUB rails). The callback carries the
--    provider's transaction id, so we match on it (fallback: our order_id sent
--    as `payload`). amount_rub is what the payer is charged; amount_cents is
--    what the USD balance is credited.
-- 2) topups survive account deletion (payment records are needed for refunds /
--    disputes / accounting) — user_id becomes nullable, FK set null instead of
--    cascade.
-- 3) credit_balance(): atomic `balance = balance + n`. Read-add-write from the
--    app could lose a concurrent CAS deduction (or a refund could clobber a
--    top-up that landed in between). Service-role only — clients can't call it.
-- 4) runs.result / runs.opportunities become server-only columns. They hold
--    the FULL ranked map (locked entries too) and the paid thread search; with
--    the previous table-wide SELECT grant any signed-in user could read them
--    straight from the REST API with the public anon key and bypass the unlock.
--    RLS is per-row, so this needs column privileges. Server code reads these
--    two columns through the service-role client after an RLS ownership check.

-- ─── 1) topups provider fields ─────────────────────────────────────────────
alter table topups
  add column if not exists provider        text not null default 'platega',
  add column if not exists provider_txn_id text,
  add column if not exists provider_status text,
  add column if not exists amount_rub      integer,
  add column if not exists currency        text not null default 'RUB',
  add column if not exists paid_at         timestamptz;

create unique index if not exists topups_provider_txn_idx
  on topups (provider, provider_txn_id)
  where provider_txn_id is not null;

create index if not exists topups_user_idx on topups (user_id, created_at desc);

-- ─── 2) keep payment records after account deletion ────────────────────────
alter table topups alter column user_id drop not null;
alter table topups drop constraint if exists topups_user_id_fkey;
alter table topups
  add constraint topups_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete set null;

-- ─── 3) atomic balance credit ──────────────────────────────────────────────
create or replace function credit_balance(p_user_id uuid, p_cents integer)
returns integer
language sql
security definer
set search_path = public
as $$
  update profiles
     set balance_cents = balance_cents + p_cents
   where id = p_user_id
  returning balance_cents;
$$;

revoke all on function credit_balance(uuid, integer) from public;
revoke all on function credit_balance(uuid, integer) from anon;
revoke all on function credit_balance(uuid, integer) from authenticated;
grant execute on function credit_balance(uuid, integer) to service_role;

-- ─── 4) runs: hide paid columns from the client roles ──────────────────────
revoke select on table runs from anon;
revoke select on table runs from authenticated;
grant select (id, user_id, product_url, product_data, unlocked, title, created_at)
  on table runs to anon, authenticated;
-- (insert/delete/update grants are unchanged: inserts go through the owner
-- policy, there is no client UPDATE/DELETE policy — those stay server-side.)
