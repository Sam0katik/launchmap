# Reddit & Apify

## Why Apify at all
Reddit blocks Vercel/datacenter IPs; public relays fail; the commercial API now
needs a paid license (Nov 2025 "Responsible Builder Policy" — killed GummySearch).
The **only** working path is an Apify **actor** scraping from Apify's own infra.

- Actor: `harshmaur~reddit-scraper` (env `APIFY_REDDIT_ACTOR` to override).
- Token: env `APIFY_TOKEN` (Vercel only).
- Pattern: **async start + poll** (runs exceed Vercel's function limit).

## Functions (`lib/apify.ts`)
- `startRedditSearch(terms)` / `getRedditSearchResult` — global keyword search.
- `startSubredditsScrape(subs)` — scrape the map's own matched subs (on-topic).
- `startUserScrape` / `getUserScrapeResult` — karma/age for a profile.
- `startCommunityScan` / `getCommunityScanResult` — admin scan over all subs.
- `rankThreads(...)` — dedupe, drop spam/dead/stale, whole-word keyword match,
  per-sub cap 3, freshness scoring. "Alive" gate: drop 0-comment/≤1-upvote or
  >45-day-old threads.

## Community scan → real data
- `subredditSubscribers` (on every post) = **real member count** → `members`.
- **Rules**: now captured **only** from the subreddit's own rules widget
  (`subredditRules`/`communityRules`/`rules`) via `parseRules()` — never
  pinned-post titles (those aren't rules). If absent → `scraped_rules` stays
  empty and the brief falls back to the curated summary.

## ⚠️ OPEN verification
Could not confirm from the dev environment which field the actor exposes rules
under (proxy blocks Apify). The admin scan now returns **`sampleKeys`** (raw
field names of the first item) and `AdminRefreshReddit` prints them.
**Action:** run Admin → Scan Reddit data, read `fields: ...`, then lock the
exact rules field (or switch source to `about/rules.json`). See
[[Open Questions & Next Steps]].

## Cost notes
- `maxPostsCount` bills **per start URL** — keep tight (≈5 subs × 6 posts).
- Per-sub cap in ranking keeps one busy sub from filling the list.
