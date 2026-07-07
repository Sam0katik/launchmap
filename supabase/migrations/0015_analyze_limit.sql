-- Daily analyze rate limit. The 2-map account cap alone is bypassable with a
-- delete→create loop, letting one account burn unbounded AI + fetch budget.
-- Track analyses per user per day (server-role writes only).
--
-- Run in the Supabase SQL editor after 0001–0014. Idempotent.

alter table profiles
  add column if not exists analyze_count int not null default 0,
  add column if not exists analyze_date date not null default current_date;
