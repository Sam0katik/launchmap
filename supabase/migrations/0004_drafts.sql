-- Stage 5 — tailored post drafts, generated lazily (Sonnet) per community and
-- cached so re-opening a map never re-spends. One draft per (run, community).
--
-- Run this in the Supabase SQL editor after 0001–0003.

create table if not exists drafts (
  id           uuid primary key default gen_random_uuid(),
  run_id       uuid not null references runs (id) on delete cascade,
  community_id int  not null references communities (id) on delete cascade,
  title        text not null,
  body         text not null,
  created_at   timestamptz not null default now(),
  unique (run_id, community_id)
);

create index if not exists drafts_run_idx on drafts (run_id);

alter table drafts enable row level security;

-- A user may read/insert a draft only for a run they own.
create policy "drafts read own"
  on drafts for select
  using (
    exists (
      select 1 from runs
      where runs.id = drafts.run_id and runs.user_id = auth.uid()
    )
  );

create policy "drafts insert own"
  on drafts for insert
  with check (
    exists (
      select 1 from runs
      where runs.id = drafts.run_id and runs.user_id = auth.uid()
    )
  );
