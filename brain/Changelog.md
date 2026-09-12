# Changelog

Per-batch summary of shipped changes. Newest first.

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
