-- Real community size (subscriber/member count) — a reach signal shown on the
-- map. Populated by scripts/reddit-verify.mjs (live Reddit API) for subreddits.
--
-- Run in the Supabase SQL editor before re-loading seed.sql. Idempotent.

alter table communities
  add column if not exists members int;
