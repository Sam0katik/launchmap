# Changelog

Per-batch summary of shipped changes. Newest first.

## 2026-09-12 · Telegram: alerts for maps/unlocks/top-ups + query bot
- Alerts: 🆕 new user (first sign-in), 🗺 new map, 🔓 unlock, 💳 Platega top-up
  paid. Awaited (≤5 s, never throws) because serverless may freeze after the
  response.
- Query bot (`lib/telegram-commands.ts`, `api/telegram/webhook`): /stats,
  /users, /maps, /topups, /user, /block, /unblock, /help — service-role reads,
  only for the operator chat, webhook guarded by a token-derived secret header.
  Registered from the admin panel ("Enable bot commands").

## 2026-09-12 · Free first thread search removed
- Every thread search now charges $0.50 (confirm step first). `expectFree` /
  `not_free` logic dropped; unlock offer copy updated.

## 2026-09-12 · Blocking, signup alerts, lower caps
- **User blocking** (migration 0018, `profiles.blocked`): admin panel Block /
  Unblock per user; `lib/auth.ts#getActionUser` refuses blocked accounts on
  analyze / unlock / thread search / karma / rename / top-up (403 `blocked`);
  profile shows a banner. Admins can't block themselves.
- **Telegram alert on first sign-in** (`lib/telegram.ts`, `auth/callback`):
  once per account via `profiles.notified_at` claim. Env `TELEGRAM_BOT_TOKEN`,
  `TELEGRAM_CHAT_ID`; silent no-op when unset.
- **Caps**: 100 analyses/day global; Apify **20 runs per user per day** (paid
  per use, so per-profile is the right unit) + 500/day global circuit breaker;
  2 admin scans/day. Per-user counters reuse `daily_counters` (`apify:<uid>`).
- **User note is a hint, not truth**: the Haiku prompt now ignores a
  description that contradicts or is unrelated to the page; it only fills gaps.
- Favicon tilted 14° nose-up.

## 2026-09-12 · Security pass 2: budget caps, run binding, thin-landing reader
- **Live black-box check** (from the operator's browser): security headers on,
  old webhooks 404, image optimizer 404, every API 401 without a session,
  `runs.result`/`opportunities` and `credit_balance()` denied to the anon key
  (42501), anon writes to profiles/communities/runs/topups blocked,
  `/auth/callback?next=@evil.com` → `/auth/auth-error`.
- **Global daily budget caps** (`lib/budget.ts`, migration 0017): analyses
  300/day, Apify runs 150/day, admin scans 5/day across all accounts — stops
  account-farming from burning the Anthropic/Apify bill. Fail-open with a loud
  log if the counter is missing.
- **Apify run ids bound to their row**: `/start` stores the id
  (`runs.opportunities_run_id`, `profiles.karma_run_id`); `/result` refuses any
  other id (403 `run_mismatch`). Apify token moved from URL query to the
  Authorization header.
- **Thin landing pages** (`lib/landing.ts`): meta/OG/JSON-LD extraction; when
  the body is under 1 200 chars, up to 4 same-origin pages (about/pricing/docs…)
  are read in parallel, all SSRF-guarded. `analyze` `maxDuration = 30`.
- **URL form**: optional one-line description restored (was referenced by the
  `empty_landing` error but had no field); opens automatically on that error.
  Community count in the scan steps now comes from the data file.
- Dead `lib/reddit.ts` (public CORS proxies) removed; stale "$3" comments → $2;
  `ANTHROPIC_MODEL_DRAFT` dropped from `.env.example`.
- Local load test (keyless build, 50 concurrent, 15 s): `/` 540 req/s p99
  166 ms, `/communities` 292 req/s, `/demo` 126 req/s, zero errors. DB/AI/Apify
  paths can't be load-tested from the sandbox (egress policy).

## 2026-09-12 · Stale "free thread search" fix
- Root cause: Next's client router cache served a stale map page (30 s), so
  the OpportunityFinder rendered "Find live threads · free" on a map whose free
  search was already used — and a click would have charged $0.50 silently.
- `experimental.staleTimes.dynamic = 0` (no client cache for dynamic pages);
  `/api/opportunities/start` refuses `expectFree` clicks with 409 `not_free`
  instead of charging; the component refreshes server props after a search.

## 2026-09-12 · Security audit + Platega scaffold (pushed to main)
- **Platega** top-ups: `lib/platega.ts`, `api/topup/create` (rewritten),
  `api/webhooks/platega`; migration `0016` (topups provider fields,
  `credit_balance()` RPC, `runs` column privileges, topups survive account
  deletion). Env-gated; off until `PLATEGA_*` are set.
- **Removed** Dodo, Cryptomus and the generic `webhooks/payment` (libs, routes,
  env, docs). Legal/privacy wording now names Platega.
- **Fixed — privilege escalation**: admin check read the GitHub login from
  user-editable `user_metadata`; now from the OAuth identity / `ADMIN_USER_IDS`.
- **Fixed — paywall bypass**: full ranked map was client-readable via REST.
- **Fixed — open redirect** in `/auth/callback?next=`.
- **Fixed — lost-update races**: refunds and admin credits now atomic.
- **Hardened** landing fetch (DNS-resolved SSRF guard, 1 MB cap), security
  headers, image optimizer off, Next 14.2.15 → 14.2.35, undici/postcss bumps.
- Background plane removed; favicon enlarged (24×24 tile).
- Brain: [[Payments]] rewritten, [[Reddit Compliance (BLOCKER)]] merged from
  the side branch, [[Security]] posture updated.

## 2026-09-12 · Pixel-art plane + favicon (pushed to main)
- New `components/PixelPlane.tsx`: the mascot as a 24×14 pixel sprite (ink
  outline, cream wing, shaded underside, keel facet, orange nose), rendered as
  SVG rects with `crispEdges`.
- `app/icon.svg` (favicon) now carries the same sprite.
- `FlyingPlane` uses the sprite: glides along a gentle wave without rotating
  (pixels stay crisp), 2-frame stepped bob, pixel-dash trail. ~58px wide.

## 2026-09-12 · New background paper plane (pushed to main)
- `FlyingPlane` rebuilt: origami dart in the site's print-zine language (cream
  facets, 2px ink outlines, orange nose), rides a swooping flight path with a
  loop (SMIL `animateMotion`, nose follows the curve) and draws a faint dashed
  trail behind it. Replaces the old white sliding plane. No JS; reduced-motion
  hides it. Used on `/map/[id]`. Second pass: smaller (~68px), thinner
  strokes, no shadow/highlight, fainter trail.

## 2026-07-14 · Site-down hotfix + deploy (merged to main, PR #43)
- **Fixed site-wide 504 `MIDDLEWARE_INVOCATION_TIMEOUT`**: auth middleware
  called `supabase.auth.getUser()` with no timeout on ~every request; a slow
  Supabase hung the whole site. Now fails open (3s cap + swallow errors).
- Deployed everything that was pending on the branch (Map rules UX + brain).

## 2026-07-14 · Map rules UX (merged to main, PR #43)
- Karma check $0.30 + gated on ≥1 unlocked map (server-enforced).
- "Before you post" account-age step links to profile karma check.
- Community card: dropped "Welcome"/"Comments only" face tags.
- Posting brief: removed "Pinned by mods"; "Best time" no longer wraps; rules
  render as the subreddit's own list (collapsible past 4).
- Scan captures real subreddit rules only; admin scan reports `sampleKeys`.

## 2026-07-14 · Landing/brief trim + plane (merged to main, PR #42)
- Removed landing barcode footer.
- Posting brief reduced to facts (first pass).
- Background plane: bigger up/down soar.

## 2026-07-14 · Security hardening (merged to main, PR #42)
- `ensureProfile` on all money paths; verified credits.
- Daily analyze cap (migration 0015).

## Migrations to run (Supabase SQL editor, in order)
- `0014_reddit_accounts.sql` — `profiles.reddit_accounts`,
  `communities.scraped_rules`.
- `0015_analyze_limit.sql` — `profiles.analyze_count` / `analyze_date`.
