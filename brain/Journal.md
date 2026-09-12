# Journal

Chronological work diary — one entry per session/batch. Newest first. Terse.
(Structured records live in [[Decisions Log]] and [[Changelog]]; this is the
running "what happened / what we were thinking" log.)

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
