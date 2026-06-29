-- Launch checklist: which communities the user has already posted in, stored as
-- a JSON array of community ids on the run. Also tightens security — drop the
-- broad client UPDATE policy on runs so a user can't set `unlocked` themselves
-- (unlock is money now; it must go through the server). Reads/inserts stay.
--
-- Run in the Supabase SQL editor after 0001–0007. Idempotent.

alter table runs
  add column if not exists checklist jsonb not null default '[]'::jsonb;

drop policy if exists "users update own runs" on runs;
