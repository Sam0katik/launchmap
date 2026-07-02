-- 1) Saved Reddit account checks: up to 3 accounts a user has verified, stored
--    as a JSON array of { username, totalKarma, linkKarma, commentKarma,
--    createdUtc, checkedAt } on the profile. Written server-side only.
-- 2) Live-scraped subreddit rules (from the Apify community scan), kept in a
--    SEPARATE column so the curated rules_summary is never overwritten.
--
-- Run in the Supabase SQL editor after 0001–0013. Idempotent.

alter table profiles
  add column if not exists reddit_accounts jsonb not null default '[]'::jsonb;

alter table communities
  add column if not exists scraped_rules jsonb;
