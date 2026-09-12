# Journal

Chronological work diary — one entry per session/batch. Newest first. Terse.
(Structured records live in [[Decisions Log]] and [[Changelog]]; this is the
running "what happened / what we were thinking" log.)

## 2026-09-12
- Session resumed after a ~7-week gap. Operator restored Supabase + Vercel;
  working directly on `main` (Vercel auto-deploys) for quick visual tests.
- Shipped the redesigned background paper plane, then reworked it (per
  operator reference) into a pixel-art sprite shared with the favicon (see
  [[Changelog]]).
- **Not yet acted on:** the Reddit ToS / Dodo-rejection blocker documented on
  branch `claude/trusting-franklin-2c3hl3` (`brain/Reddit Compliance
  (BLOCKER).md`) is still unmerged; the "Next steps" below it in
  [[Open Questions & Next Steps]] are stale until the operator picks
  option A (compliant pivot) or B (Reddit licence).

## 2026-07-14
- **Dodo Payments scaffold added** (`lib/dodo.ts`, `app/api/webhooks/dodo`,
  wired into `topup/create`, env-gated, off by default). Dodo chosen as the
  **USD card** fiat option (good fit; MoR + credit billing). Still needs
  adult-owner KYC + confirming Dodo's exact API field names. See
  [[Payments (TODO)]].
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
