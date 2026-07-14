# Billing & Economy

Internal USD balance economy, all amounts in **cents**. Config in `lib/billing.ts`.

## Prices (source of truth = `lib/billing.ts`)
| Item | Const | Value |
|---|---|---|
| Map unlock (one-time) | `UNLOCK_PRICE_CENTS` | **200** ($2) |
| Thread search refresh | `THREAD_SEARCH_PRICE_CENTS` | **50** ($0.50) — first free |
| Karma check | `KARMA_CHECK_PRICE_CENTS` | **30** ($0.30) — needs ≥1 unlock |
| Max Reddit accounts | `MAX_REDDIT_ACCOUNTS` | 3 |
| Max maps/account | `MAX_MAPS_PER_ACCOUNT` | 2 |
| Analyses/day | (in `analyze/route.ts`) | 15 |

## Flows
- **Unlock**: read balance → CAS `update ... where balance_cents = old` → on
  success flip `runs.unlocked`. CAS prevents double-spend on concurrent calls.
- **Thread search**: first search on a map free (`run.opportunities == null`);
  refresh charges $0.50 via same CAS, refunds if the Apify run fails to start.
- **Karma check**: charges $0.30 via CAS; refunds if scrape fails to start;
  gated on ≥1 unlocked run.
- **Top-up (credit in)**: `topup/create` → provider invoice → provider webhook
  → `webhooks/cryptomus` re-verifies status → idempotent claim
  (`credited false→true`) → credit balance (verified to hit a row).

## Money-safety invariants — see [[Security]]
- All balance/unlock writes go through **service-role** server routes.
- **Never** re-add client UPDATE policies on `profiles`/`runs` for balance or
  `unlocked`.
- Every money path calls `ensureProfile*` first so a missing profile row can't
  make a credit silently hit 0 rows.

Related: [[Payments (TODO)]] · [[Overview]]
