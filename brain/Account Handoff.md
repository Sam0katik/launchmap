# ZeroFans — full project handoff

**Paste this whole file as your first message in a new Claude chat.** It is
written to be self-contained: after reading it, an assistant with no prior
context knows the product, the money model, every integration, the database,
the security rules that must not break, and what to do next.

- **Repo:** `https://github.com/Sam0katik/launchmap` (branch `main` = production)
- **Written:** 2026-09-13 · **Last commit covered:** `26f631b`
- **The repo also carries `brain/`** — an Obsidian vault with the same
  knowledge in more detail. If you have the repo, read `brain/README.md` and
  follow its index; this file is the version that survives without the repo.

> ⚠️ **No API keys or secrets are in this file, and none should ever be pasted
> into a chat.** Every key below is listed by *name* with *where to get it* and
> *where to put it*. A key pasted into a conversation is considered compromised
> and must be rotated. This is a standing rule of this project.

---

## 1. What the product is

**ZeroFans** (formerly LaunchMap). Paste a product URL → get a ranked **map** of
where an indie maker should launch: Reddit communities + directories, each with
its rules, a karma bar, the best time to post, and a rule-based posting brief.

- **Audience:** solo/indie makers looking for first users without getting banned.
- **Operator:** sole developer, Russian-speaking, iterates fast, ships straight
  to production.

## 2. Money model (do not change without being asked)

All amounts are **US cents** in the code. Source of truth: `lib/billing.ts`.

| Item | Constant | Price |
|---|---|---|
| Map unlock (one-time, per map) | `UNLOCK_PRICE_CENTS` | **$2** |
| Thread search (every run) | `THREAD_SEARCH_PRICE_CENTS` | **$0.50** |
| Karma check | `KARMA_CHECK_PRICE_CENTS` | **$0.30** (needs ≥1 unlocked map) |
| Max saved Reddit accounts | `MAX_REDDIT_ACCOUNTS` | 3 |
| Max maps per account | `MAX_MAPS_PER_ACCOUNT` | 2 |
| Analyses per day per user | in `app/api/analyze/route.ts` | 15 |

- **No subscriptions.** Prepaid internal USD balance only.
- Analysis (making a map) is **free**; the unlock is what is paid for.
- Top-ups go through **Platega** (hosted checkout, RUB rails). Billing is
  **off** until the `PLATEGA_*` env vars are set; until then balance is granted
  by the admin panel as test credit.

## 3. Where the project stands (2026-09-13)

- **Live on Vercel**, deployed from `main` on every push.
- Migrations **0001–0019 all applied** to the production Supabase project.
- Platega integration is **written and switched off** (no merchant credentials
  yet). The operator reports no KYC obstacle; what is left is setting the env
  vars and running the go-live checklist.
- Reddit/Apify paid features **stay** — see Decisions.
- Russian localization shipped; language switcher bottom-right, cookie-backed.

## 4. Stack

- **Next.js 14.2.35**, App Router, server components, TypeScript, Tailwind.
- **Vercel** (Hobby: ~10 s function limit → long jobs use async start + poll).
- **Supabase**: Postgres + RLS + **GitHub OAuth**. Project ref
  `fotagddmaninlcpgjlxb` (this is public, it is in the API URL).
- **Anthropic Claude Haiku** — landing-page analysis only.
- **Apify** actor `harshmaur~reddit-scraper` — the only working Reddit source.
- Font: **Departure Mono** (self-hosted, SIL OFL), renders Cyrillic natively.

## 5. Every integration and env var

**Values live in Vercel (production) and in a local `.env.local` (gitignored).
Never in the repo, never in a chat.**

### Supabase — database, auth, storage of everything
| Var | What it is | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project API URL (public) | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key, safe in the browser | same page |
| `SUPABASE_SERVICE_ROLE_KEY` | **Full bypass of RLS. Server only.** Used exclusively by `lib/supabase/admin.ts` | same page |

### Anthropic — the landing-page analysis
| Var | What it is | Where to get it |
|---|---|---|
| `ANTHROPIC_API_KEY` | API key for the analyze call | console.anthropic.com |
| `ANTHROPIC_MODEL_ANALYZE` | Optional model override (default is a Haiku model) | — |

### Platega — balance top-ups (RUB rails: SBP, RU cards, Sberpay, crypto, intl card)
| Var | What it is | Where to get it |
|---|---|---|
| `PLATEGA_MERCHANT_ID` | Merchant id | Platega dashboard → Settings |
| `PLATEGA_SECRET` | API key / secret; also the callback header check | same |
| `PLATEGA_RUB_PER_USD` | RUB charged per $1 — set **above** market to cover the 1–5% fee and FX drift | operator decision |
| `PLATEGA_PAYMENT_METHOD` | Optional: force one method (2 SBP, 11 RU card, 12 international, 13 crypto, 14 Sberpay) | — |
| `PLATEGA_API_BASE` | Optional API base override (default `https://app.platega.io`) | — |

Callback URL to register in their dashboard:
`https://<your-domain>/api/webhooks/platega`

### Apify — all Reddit data
| Var | What it is | Where to get it |
|---|---|---|
| `APIFY_TOKEN` | API token. **Removing this instantly disables every scraping feature — it is the kill switch.** | Apify → Settings → Integrations |
| `APIFY_REDDIT_ACTOR` | Optional actor override (default `harshmaur~reddit-scraper`) | — |

### Telegram — operator alerts + query bot
| Var | What it is | Where to get it |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | Bot token; the webhook secret is derived from it | @BotFather |
| `TELEGRAM_CHAT_ID` | The operator's chat id — the only chat the bot answers | getUpdates |

### Budget caps (all optional, sane defaults in code)
`ANALYZE_GLOBAL_PER_DAY` (100) · `APIFY_PER_USER_PER_DAY` (20) ·
`APIFY_GLOBAL_PER_DAY` (500) · `APIFY_SCANS_PER_DAY` (2)

### App
| Var | What it is |
|---|---|
| `ADMIN_USER_IDS` | Preferred admin allowlist — Supabase auth user ids |
| `ADMIN_USERNAMES` | GitHub logins, matched against the **OAuth identity**, never `user_metadata` |
| `ADMIN_EMAILS` | Emails (GitHub only exposes public ones) |
| `URL_CACHE_HOURS` | Hours an identical URL is reused before spending new AI calls |
| `NEXT_PUBLIC_SITE_URL` | Public origin for payment return URLs (`http://localhost:3000` locally) |

### Public contact (already on the site)
Email `1awqfes@gmail.com` · Telegram `@rasfikus`

## 6. API routes (`app/api/`)

- `analyze` — auth → SSRF-guarded landing read (`lib/landing.ts`) → Haiku →
  rank → persist run. Caps: 2 maps/account, 15 analyses/day/user, global cap.
  Refuses platform URLs (youtube/github/marketplaces) as `not_a_product`.
- `unlock` — CAS-deduct $2, flip `runs.unlocked`. Service role.
- `opportunities/start` + `/result` — Apify thread search, $0.50 per run.
- `reddit/karma/start` + `/result` — Apify user scrape, $0.30, needs ≥1 unlock.
- `topup/create` — pending `topups` row + Platega transaction → checkout URL.
- `webhooks/platega` — header auth → re-read transaction server-to-server →
  require CONFIRMED + exact RUB → idempotent claim → `credit_balance()` RPC.
- `telegram/webhook` — operator bot; timing-safe secret header + chat-id gate.
- `admin/topup`, `admin/block`, `admin/telegram-test`,
  `admin/telegram-webhook`, `admin/refresh-reddit/{start,result}` — admin only.
- `runs/delete`, `runs/rename`, `account/delete`, `auth/callback`.

## 7. Database

Tables: `communities` (curated catalog, 58 rows, world-readable) · `runs` (the
user's maps) · `profiles` (balance, reddit accounts, blocked flag) ·
`topups` · `balance_events` (ledger) · `daily_counters` (global budget caps).

Migrations live in `supabase/migrations/`, applied in order, all idempotent:

| # | What it does |
|---|---|
| 0001–0005 | initial schema, profiles, catalog, drafts (later dropped) |
| 0006 | `balance_cents`; **drops the client UPDATE policy on profiles** |
| 0007–0010 | members, checklist, icon, run title |
| 0011 | drops legacy columns + the drafts tables (destructive, already run) |
| 0012 | `topups` |
| 0013 | `opportunities` |
| 0014 | `reddit_accounts`, `scraped_rules` |
| 0015 | daily analyze limit |
| 0016 | Platega fields; `credit_balance()` RPC; **`runs.result` / `runs.opportunities` revoked from client roles**; topups survive account deletion |
| 0017 | `daily_counters` + `bump_daily_counter()`; Apify run-id binding |
| 0018 | `profiles.blocked`, `blocked_at`, `notified_at` |
| 0019 | `balance_events` ledger |

## 8. Security invariants — never break these

1. **Service role only for money.** All `profiles`/`runs` writes touching
   balance or `unlocked` go through server routes with the service-role key.
   **Never add a client UPDATE RLS policy for them.** (0001/0002/0005 created
   such policies; 0006/0008/0011 dropped them. Keep it that way.)
2. **Real data only.** Never invent member counts, karma, or subreddit rules.
   Unverified → leave empty. This is why scraped rules are **not translated**.
3. **Secrets only in host env.** Never commit, never paste in chat. A leaked
   key is rotated, not reused.
4. `runs.result` and `runs.opportunities` are **server-only columns** — they
   hold the full paid map. Ownership is checked, then they are read with the
   service role.
5. Admin check reads the GitHub login from the **OAuth identity**, never from
   `user_metadata` (a user can rewrite their own → privilege escalation).
6. Balance deductions use **compare-and-swap**; credits use the atomic
   `credit_balance()` SQL function — never a read-modify-write snapshot.
7. Every money path calls `ensureProfile*` first.
8. The Platega callback is only a **trigger**: the transaction is re-read
   server-to-server before any credit.

**Known residual:** Next.js 14.2.x is past its security-backport window.
Advisory by advisory, none currently reaches this app (image optimizer
disabled, App Router not Pages, no Server Actions, Linux not Windows), but the
real fix is the Next 15 migration — an open task.

## 9. Decisions already made (do not relitigate)

- **2026-09-13 — Ship straight to `main`, no confirmation step.** Every edit
  deploys as it lands. `npm run build` before each push is the only gate.
- **2026-09-13 — Reddit/Apify features stay.** The compliant-pivot option was
  rejected. Reddit's terms forbid commercializing scraped data without written
  approval, and Dodo Payments already refused onboarding over it; the operator
  has accepted that risk knowingly. `APIFY_TOKEN` is the kill switch.
- **2026-09-13 — Localization is cookie-backed**, UI copy only; real Reddit
  data, the admin panel and the legal pages stay English.
- **2026-09-12 — Platega is the payment provider.** Dodo/Cryptomus removed.
- **2026-09-12 — No free first thread search.** Every search is $0.50.
- **2026-09-12 — Payment records outlive accounts** (`topups.user_id` set null).
- **2026-07-14 — Payments go the legit path only:** a real adult owns the
  merchant account and passes their own KYC. Do not help evade KYC/age checks.
- **2026-07-14 — Posting brief = facts only.** No invented advice.
- **Earlier — r/SaaS bans promotional-SaaS posts**; never recommend posting
  ZeroFans there.

## 10. What is open

1. **Platega go-live**: set the three env vars + callback URL, then fake
   callback CONFIRMED → send it twice (second must answer `already: true`) →
   real ₽ top-up → CANCELED path → mismatched amount (must record
   `AMOUNT_MISMATCH`, not credit).
2. Verify method 12 ("international card") with a non-Russian card before
   advertising it, or the paying audience is RU-only.
3. **Next.js 15.5 migration** (React 19, async `cookies()`/`params`).
4. Catalog growth: log unmatched niche tags to find coverage gaps. Never
   bulk-add unverified subreddits — accuracy is the product.
5. Legal gaps: no governing-law clause, no named legal entity, no self-serve
   data export (deletion is self-serve, which covers the main obligation).
6. Supabase Free tier auto-pauses after ~7 days idle — that once looked like a
   site-wide 504.

## 11. How to work on this project

- **Verify before claiming done:** `npm run build`, plus `npm run typecheck`
  when types changed. Say so honestly if something fails.
- **Be surgical:** change only what the request needs; match the existing
  style; do not refactor what is not broken; mention dead code, do not delete
  it unasked.
- **Simplicity first:** the minimum code that solves the problem, nothing
  speculative.
- **Surface assumptions** and ask when two readings would lead to different
  work — but do not block on questions you can answer yourself.
- Update `brain/Journal.md`, `brain/Changelog.md`, `brain/Decisions Log.md`
  and `brain/Open Questions & Next Steps.md` at the end of each batch.
- Adding UI copy? It goes in `lib/i18n.ts` **in both languages** — the types
  will not compile otherwise.

## 12. Network note for cloud sessions

A Claude Code **web/cloud** session reaches GitHub only; `supabase.co`,
`api.vercel.com` and `api.telegram.org` are blocked by the egress policy, so
migrations, env vars and payment tests cannot be run from there. Options: run
Claude Code locally, widen the environment's network policy, or connect the
official **Supabase connector** (its traffic goes through Anthropic's MCP
proxy, which is not affected by that block).
