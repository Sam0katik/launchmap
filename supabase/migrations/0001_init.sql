-- LaunchMap initial schema.
-- communities = the curated, hand-verified core dataset (the product's moat).
-- runs        = one analysis run per user + URL, with cached AI output.

create table if not exists communities (
  id                serial primary key,
  platform          text not null,        -- reddit | discord | x | hackernews | directory
  name              text not null,        -- 'r/SideProject'
  url               text not null,
  niche_tags        text[] not null default '{}',  -- '{saas,vibecoders,ai}'
  self_promo_policy text not null,        -- welcome | megathread_only | comment_only | banned
  self_promo_note   text,
  rules_summary     text,                 -- 2-3 bullets: what gets removed + required format
  karma_tier        text,                 -- easy | medium | hard
  karma_note        text,
  activity_level    text,                 -- active | moderate | low
  best_time         text,                 -- 'Tue-Thu 9-12 ET'
  submit_template   text,                 -- optional submit-link template ({title}/{body})
  verified_at       date not null default current_date,
  created_at        timestamptz not null default now()
);

-- Tag matching scans niche_tags constantly; GIN index keeps it fast as the
-- dataset grows past the initial ~20 rows.
create index if not exists communities_niche_tags_idx
  on communities using gin (niche_tags);

create table if not exists runs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  product_url  text not null,
  product_data jsonb,                     -- ProductAnalysis from the landing analysis
  result       jsonb,                     -- ranked list + relevance scores
  unlocked     boolean not null default false,  -- has the map been paid for?
  created_at   timestamptz not null default now()
);

create index if not exists runs_user_created_idx
  on runs (user_id, created_at desc);

-- Abuse guard: look up "did this user already run this URL recently?"
create index if not exists runs_user_url_idx
  on runs (user_id, product_url, created_at desc);

-- ─── Row Level Security ──────────────────────────────────────
-- communities: world-readable (the catalog), no client writes.
alter table communities enable row level security;

create policy "communities are readable by anyone"
  on communities for select
  using (true);

-- runs: each user sees and creates only their own.
alter table runs enable row level security;

create policy "users read own runs"
  on runs for select
  using (auth.uid() = user_id);

create policy "users insert own runs"
  on runs for insert
  with check (auth.uid() = user_id);

create policy "users update own runs"
  on runs for update
  using (auth.uid() = user_id);
