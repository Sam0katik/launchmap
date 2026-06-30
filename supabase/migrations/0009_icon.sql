-- Subreddit / community avatar URL (from Reddit's public about.json
-- community_icon, or a directory's favicon). Optional; null = card shows the
-- monogram fallback. Populated by scripts/reddit-fetch.mjs → db:seed-gen.
--
-- Run in the Supabase SQL editor after 0001–0008. Idempotent.

alter table communities
  add column if not exists icon text;
