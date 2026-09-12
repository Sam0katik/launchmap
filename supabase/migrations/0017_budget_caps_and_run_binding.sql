-- Budget caps + Apify run binding. Run in the Supabase SQL editor after 0016.
-- Idempotent.
--
-- 1) daily_counters + bump_daily_counter(): a GLOBAL per-day cap on the things
--    that cost money (Anthropic analyses, Apify actor runs). Per-account caps
--    already exist, but GitHub accounts are free, so an attacker (or a bot)
--    could farm accounts and burn the AI/Apify budget. The counter is bumped
--    atomically (upsert) and returns false when the limit would be exceeded.
--    Service-role only.
-- 2) Bind Apify run ids to the row that started them. The /result routes
--    previously accepted any run id from the client, so a user could attach a
--    run they never paid for (or poll another user's karma scrape) to their own
--    row. Now /start stores the id and /result only accepts that id.

-- ─── 1) global daily budget counters ───────────────────────────────────────
create table if not exists daily_counters (
  key   text not null,
  day   date not null default current_date,
  count integer not null default 0,
  primary key (key, day)
);

alter table daily_counters enable row level security;
-- no policies: service-role only.

create or replace function bump_daily_counter(p_key text, p_limit integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  insert into daily_counters (key, day, count)
  values (p_key, current_date, 1)
  on conflict (key, day) do update
    set count = daily_counters.count + 1
  returning count into v_count;
  return v_count <= p_limit;
end;
$$;

revoke all on function bump_daily_counter(text, integer) from public;
revoke all on function bump_daily_counter(text, integer) from anon;
revoke all on function bump_daily_counter(text, integer) from authenticated;
grant execute on function bump_daily_counter(text, integer) to service_role;

-- ─── 2) pending Apify run ids ──────────────────────────────────────────────
alter table runs
  add column if not exists opportunities_run_id text;

alter table profiles
  add column if not exists karma_run_id text;

-- Server-only, like the other paid columns (see 0016).
revoke select on table runs from anon;
revoke select on table runs from authenticated;
grant select (id, user_id, product_url, product_data, unlocked, title, created_at)
  on table runs to anon, authenticated;
