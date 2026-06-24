-- Track how many times each saved draft has been regenerated, so the app can
-- cap regenerations per (run, community) and bound Anthropic spend.
--
-- Run this in the Supabase SQL editor after 0001–0004. Idempotent.

alter table drafts
  add column if not exists regen_count int not null default 0;
