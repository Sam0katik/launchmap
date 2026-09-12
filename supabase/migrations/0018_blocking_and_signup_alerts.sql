-- User blocking + signup-alert bookkeeping. Run after 0017. Idempotent.
--
-- profiles.blocked     — set by the admin panel (/api/admin/block). Blocked
--                        users can still sign in and read, but every action
--                        route (analyze, unlock, thread search, karma check,
--                        rename, top-up) answers 403 `blocked`.
-- profiles.notified_at — when the "new user" Telegram alert was sent, so the
--                        OAuth callback sends it exactly once per account.
alter table profiles
  add column if not exists blocked      boolean not null default false,
  add column if not exists blocked_at   timestamptz,
  add column if not exists notified_at  timestamptz;
