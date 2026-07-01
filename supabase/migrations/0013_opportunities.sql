-- Cache the "where to jump in" results (recent Reddit threads to engage) on the
-- run, so we don't re-run the paid Apify actor on every visit. Written by the
-- server (service role); runs has no client UPDATE policy.
--
-- Run in the Supabase SQL editor after 0001–0012. Idempotent.

alter table runs
  add column if not exists opportunities jsonb,
  add column if not exists opportunities_at timestamptz;
