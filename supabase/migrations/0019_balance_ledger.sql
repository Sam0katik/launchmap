-- Balance ledger: one row per balance change, so the operator can see every
-- movement (top-ups, admin credits, unlocks, searches, karma checks, refunds)
-- and revenue can be computed from REAL payments only. Run after 0018.
-- Idempotent. Service-role only (RLS on, no policies).

create table if not exists balance_events (
  id          bigserial primary key,
  user_id     uuid references auth.users (id) on delete set null,
  delta_cents integer not null,               -- + credit, − debit
  kind        text not null,                  -- topup | admin_credit | unlock | thread_search | karma_check | refund
  ref         text,                           -- run id / order id / apify run id
  note        text,
  created_at  timestamptz not null default now()
);

create index if not exists balance_events_user_idx on balance_events (user_id, created_at desc);
create index if not exists balance_events_created_idx on balance_events (created_at desc);

alter table balance_events enable row level security;
