# Decisions Log

Newest first. Each: what we decided + why.

- **2026-09-12 — No free first thread search.** Every Apify search is $0.50;
  the unlock ($2) covers the map + briefs only. Simpler accounting, no
  stale-state edge case, cost always covered by the payer.

- **2026-09-12 — Payment provider = Platega (platega.io).** Operator's call;
  all Dodo / Cryptomus / generic-webhook code and docs removed. USD stays the
  unit of account; RUB price = fixed `PLATEGA_RUB_PER_USD`. See [[Payments]].
- **2026-09-12 — `runs.result` / `runs.opportunities` are server-only columns.**
  Paywall integrity: the client roles could read the whole locked map via REST.
- **2026-09-12 — Admin allowlist keyed on identity data / user id, never
  `user_metadata`** (user-editable → privilege escalation).
- **2026-09-12 — Payment records outlive accounts** (`topups.user_id` set null
  on delete) — needed for refunds/disputes.
- **2026-09-12 — Background paper plane removed; pixel favicon kept.**

- **2026-07-14 — Payments go on the legit path only: a real adult owns the
  merchant account and passes their own KYC.** We (site side) wire the
  integration; the adult handles account/KYC/payouts. No setup on a minor/false
  identity. See [[Payments]].
- **2026-07-14 — Karma check repriced $0.50 → $0.30, gated on ≥1 unlocked map.**
  It's an add-on to a real launch, not a standalone tool.
- **2026-07-14 — Posting brief = facts only.** Show link-allowed, best time,
  karma, and the subreddit's *own* rules. Removed the fill-in skeleton (it told
  users to attach a link even where links are banned), "Lead with" advice, and
  where/length/title advice.
- **2026-07-14 — Community rules must come from the subreddit itself** (scan),
  not pinned-post titles and not only our curated summary. Verification pending.
- **2026-07-14 — Removed landing "scan to launch · see a sample map" barcode.**
- **2026-07-14 — Security backstop `ensureProfile`** on every money path;
  webhook/admin credits must verify they hit a row.
- **2026-07-14 — Daily analyze cap = 15** to stop delete→create budget burn.
- **Earlier — No subscriptions.** One-time $2 per-map unlock from internal USD
  balance; keep max 2 maps.
- **Earlier — Apify `harshmaur~reddit-scraper` is the Reddit data source.**
  Reddit blocks all reachable IPs; commercial API needs a paid license.
- **Earlier — Do NOT help evade KYC/age for payments** (operator is a minor);
  legit path only = adult owner with real KYC.
- **Earlier — r/SaaS bans promotional-SaaS posts (June 2026 mod rule)** — do not
  recommend posting ZeroFans there.
