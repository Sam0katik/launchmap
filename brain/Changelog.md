# Changelog

Per-batch summary of shipped changes. Newest first.

## 2026-07-14 · Map rules UX (branch, not yet merged)
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
