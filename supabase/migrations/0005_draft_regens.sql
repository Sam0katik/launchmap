-- Track how many times each saved draft has been regenerated, so the app can
-- cap regenerations per (run, community) and bound Anthropic spend. Also adds
-- the UPDATE RLS policy that regeneration needs (0004 only had SELECT/INSERT,
-- so without this an UPDATE is silently blocked and regen never persists).
--
-- Run this in the Supabase SQL editor after 0001–0004. Idempotent.

alter table drafts
  add column if not exists regen_count int not null default 0;

-- A user may update a draft only for a run they own (needed for regeneration).
drop policy if exists "drafts update own" on drafts;
create policy "drafts update own"
  on drafts for update
  using (
    exists (
      select 1 from runs
      where runs.id = drafts.run_id and runs.user_id = auth.uid()
    )
  );
