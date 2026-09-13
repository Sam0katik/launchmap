# Journal

Chronological work diary — one entry per session/batch. Newest first. Terse.
(Structured records live in [[Decisions Log]] and [[Changelog]]; this is the
running "what happened / what we were thinking" log.)

## 2026-09-13 (2)
- **Russian localization shipped.** Cookie-backed (`zf_lang`), not
  localStorage — the root layout reads it during render, so a reload comes back
  in the chosen language with no flash and `<html lang>` is right. Every route
  is per-request now; that is the accepted cost.
- Verified in a real build: Departure Mono renders Cyrillic natively (font
  unchanged), layout holds, the switcher persists across reload.
- Deliberately left English: scraped subreddit rules / best time / karma (real
  Reddit data), the admin panel, the legal pages.
- **Security re-check before the deploy**: invariant intact (all client UPDATE
  policies dropped by 0006/0008/0011), every route guarded, both webhooks
  timing-safe, no secrets in the repo. `npm audit` residual is Next 14.2.x —
  advisory-by-advisory it does not reach this app; the Next 15 migration stays
  the real fix.
- Handoff files written for moving to a new Claude account (see
  [[Account Handoff]]).

## 2026-09-13
- **Operator closed both blockers**: Reddit/Apify features **stay** (option A
  pivot rejected), and Platega needs no KYC on our side. See [[Decisions Log]] —
  the Reddit ToS exposure described in [[Reddit Compliance (BLOCKER)]] is
  unchanged, it is now an accepted risk rather than an open question.
- Landing: small language switcher pinned bottom-right (EN with a US flag,
  Russian revealed on hover). UI only — no localization behind it yet.

## 2026-09-13
- Work moves to **Claude Code running locally** — the cloud session had no
  network route to Supabase/Vercel APIs, so migrations, env vars and payment
  tests were all manual. See [[Local Setup (Claude Code)]].
- Last cloud commit: legal pages rewritten to match the real payment model,
  platform URLs (youtube.com etc.) refused before any spend.

## 2026-09-12
- Session resumed after a ~7-week gap. Operator restored Supabase + Vercel;
  working directly on `main` (Vercel auto-deploys) for quick visual tests.
- Shipped a pixel-art favicon; the background plane was tried in two versions
  and then removed on request.
- **Full security/bug audit** before wiring payments — found and fixed a
  privilege escalation (admin via `user_metadata`), a paywall bypass (locked
  map readable via REST), an open redirect, and lost-update races on credits.
  Details in [[Changelog]] / [[Security]].
- **Platega chosen** as the payment provider; Dodo/Cryptomus removed;
  integration written and env-gated. Merchant onboarding is on the operator.
- Second security pass after the operator confirmed 0016 live: black-box
  probe of the production site from the operator's own browser (all green),
  global budget caps, Apify run binding, thin-landing crawler, description
  field restored on the URL form, dead code removed. Migration 0017 pending.
- Merged the Reddit ToS blocker doc from the side branch into this vault.
  **Still undecided:** option A (compliant pivot: drop Apify-backed paid
  features) vs B (Reddit licence). Payments on Reddit-scraped features remain
  a legal exposure regardless of provider.

## 2026-07-14
- **Dodo Payments scaffold added** (`lib/dodo.ts`, `app/api/webhooks/dodo`,
  wired into `topup/create`, env-gated, off by default). Dodo chosen as the
  **USD card** fiat option (good fit; MoR + credit billing). Still needs
  adult-owner KYC + confirming Dodo's exact API field names. See
  [[Payments]].
- **Supabase was PAUSED** (Free tier auto-pause) — that was the real cause of
  the earlier 504 + broken login. Operator resumed it. Reminder: Free tier
  pauses after ~7 days idle; use the site regularly or upgrade to Pro (needs
  payment).
- **Site hotfix deployed**: auth middleware now fails open (3s cap) so a
  paused/slow Supabase can't 504 the whole site.
- **Sign-in button instant**: `AuthButton` reads `getSession()` (local) instead
  of network `getUser()`.
- **Landing card** made narrower + taller; inner elements scaled down.
- **Map rules UX** shipped: karma $0.30 + ≥1-unlock gate, real subreddit rules
  (collapsible), removed noise tags / pinned-by-mods, "Best time" one line.
- **Security batch** shipped earlier: `ensureProfile` on money paths, verified
  credits, daily analyze cap.
- **This vault** created and now delivered to the operator as files (was only in
  the repo before, so it wasn't visible).

## How to keep this updated
At the end of each batch: add a dated entry here + update [[Changelog]] and, if a
call was made, [[Decisions Log]]. Keep [[Open Questions & Next Steps]] current.
