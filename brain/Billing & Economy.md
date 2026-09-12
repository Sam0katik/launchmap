# Billing & Economy

Internal USD balance economy, all amounts in **cents**. Config in `lib/billing.ts`.

## Prices (source of truth = `lib/billing.ts`)
| Item | Const | Value |
|---|---|---|
| Map unlock (one-time) | `UNLOCK_PRICE_CENTS` | **200** ($2) |
| Thread search (every run) | `THREAD_SEARCH_PRICE_CENTS` | **50** ($0.50) |
| Karma check | `KARMA_CHECK_PRICE_CENTS` | **30** ($0.30) — needs ≥1 unlock |
| Max Reddit accounts | `MAX_REDDIT_ACCOUNTS` | 3 |
| Max maps/account | `MAX_MAPS_PER_ACCOUNT` | 2 |
| Analyses/day | (in `analyze/route.ts`) | 15 |

## Flows
- **Unlock**: read balance → CAS `update ... where balance_cents = old` → on
  success flip `runs.unlocked`. CAS prevents double-spend on concurrent calls.
- **Thread search**: every search charges $0.50 via the same CAS, refunds if
  the Apify run fails to start. (Free first search removed 2026-09-12.)
  Results are cached on `runs.opportunities` until the next paid refresh; an
  uncollected run is resumed free via `runs.opportunities_run_id`.
- **Karma check**: charges $0.30 via CAS; refunds if scrape fails to start;
  gated on ≥1 unlocked run.
- **Top-up (credit in)**: `topup/create` → Platega transaction (RUB, rate =
  `PLATEGA_RUB_PER_USD`, rounded up) → hosted checkout → `webhooks/platega`
  re-reads the transaction server-to-server → idempotent claim
  (`credited false→true`) → `credit_balance()` atomic RPC. See [[Payments]].
- **Refunds of failed spends** (unlock/thread search/karma) and admin credits
  also go through `credit_balance()` — never a snapshot write.

## Money-safety invariants — see [[Security]]
- All balance/unlock writes go through **service-role** server routes.
- **Never** re-add client UPDATE policies on `profiles`/`runs` for balance or
  `unlocked`.
- Every money path calls `ensureProfile*` first so a missing profile row can't
  make a credit silently hit 0 rows.

Related: [[Payments]] · [[Overview]]
