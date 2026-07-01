-- Optional user-set display name for a launch map. Null = fall back to the name
-- derived from the product URL. Only the owner can rename (write goes through a
-- service-role route; runs has no client UPDATE policy).
--
-- Run in the Supabase SQL editor after 0001–0009. Idempotent.

alter table runs
  add column if not exists title text;
