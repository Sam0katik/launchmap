# Architecture

## Stack
- **Next.js 14** App Router, server components. Deploys on **Vercel** from
  `main` (Hobby plan — ~10s serverless function limit → long jobs use async
  start+poll).
- **Supabase**: Postgres + RLS + **GitHub OAuth**. Service-role key used only in
  server routes for money/unlock writes.
- **Anthropic Claude Haiku** (`claude-haiku-4-5-...`) — landing-page analysis
  only.
- **Apify actor** `harshmaur~reddit-scraper` — the only working Reddit data
  source. See [[Reddit & Apify]].

## Key API routes (`app/api/`)
- `analyze` — auth → SSRF-guarded landing read (`lib/landing.ts`: meta +
  body; thin pages get up to 4 same-origin pages crawled) → Haiku → rank →
  persist run. Caps: 2 maps/account, **15 analyses/day**, 300/day global.
- `unlock` — CAS deduct $2 from balance, flip run.unlocked. Service-role.
- `opportunities/start` + `/result` — Apify thread search (first free, refresh
  $0.50). CAS deduct.
- `reddit/karma/start` + `/result` — Apify user scrape ($0.30, needs ≥1 unlock).
- `topup/create` — creates a `topups` row + Platega transaction, returns the
  hosted-checkout URL. See [[Payments]].
- `webhooks/platega` — header-authenticated callback → server-to-server
  re-check → idempotent atomic credit (`credit_balance()` RPC).
- `admin/topup` — grant test credit (admin only).
- `admin/refresh-reddit/start` + `/result` — one Apify scan over all reddit subs
  → writes real members + `scraped_rules`.

## Data model (Supabase) — migrations in `supabase/migrations/`
- `communities` — curated catalog (58 rows: 35 reddit, 21 directory, 1 HN, 1
  Discord). World-readable, no client writes. Live fields: `members`,
  `scraped_rules` (from the scan).
- `runs` — a user's maps. RLS: read/insert own; no client update/delete
  (server routes). **`result` and `opportunities` are server-only columns**
  (column privileges, migration 0016): pages/routes verify ownership via RLS,
  then read them with the service role.
- `profiles` — one per auth user (created by `handle_new_user` trigger). Fields:
  `balance_cents`, `reddit_accounts` (jsonb, ≤3), `analyze_count`/`analyze_date`.
- `daily_counters` — global per-day budget counters (`bump_daily_counter()`).
- `topups` — pending/paid balance top-ups, idempotent via `order_id` +
  `credited`; Platega fields (`provider_txn_id`, `amount_rub`, …); rows are
  kept after account deletion.

## Notable components
- `UrlForm` (home), `CommunityCard`, `PostingBrief`, `AccountGuidePanel`,
  `RedditKarmaCheck`, `OpportunityFinder`, `AdminRefreshReddit`, `FlyingPlane`.

See also: [[Security]] · [[Billing & Economy]]
