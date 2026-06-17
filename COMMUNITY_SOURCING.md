# Community sourcing — step-by-step field guide

How to find new launch communities, judge them, find their rules + karma bar,
and add them to the DB. This is the moat work. Do it carefully; a wrong row
gets a user banned.

---

## A. Find candidate communities

**1. Search where makers already discuss launching.** Good queries:
- `best subreddits to launch [niche] 2026`
- `Product Hunt alternatives 2026`
- `where to post [SaaS / dev tool / AI app] for first users`
- `[niche] Discord communities` / `[niche] launch directory`

**2. Mine existing lists, then verify each yourself.** Aggregator blogs
(launchdirectories, smollaunch, uneed, oneup.today) list dozens — treat them as
*leads*, not truth. Every row still needs a live check (Section C).

**3. Use `/last30days`** for what makers are actually recommending this month,
not stale SEO lists.

**4. Keep the niche tight.** vibe-coders / indie SaaS / dev tools. ~20–30 high
quality rows beat a 500-row junk list. Precision is the product.

---

## B. Decide if it's worth adding

Add it only if a real maker would get value posting there. Quick filter:

- **Audience match** — are your ICP actually there? (devs, founders, early adopters)
- **Alive** — recent posts in the last few days? Dead sub = skip.
- **Promo-tolerant** — does it allow launches at all (even if only in threads)?
  A `banned` sub can still be listed as a warning, but deprioritize it.

---

## C. Find the rules (Reddit)

For each subreddit, open it logged in and read THREE places:

1. **Sidebar / "Community Guidelines"** (right rail on desktop, About tab on
   mobile) — the official rules list. Look for: self-promotion rule, the 9:1 /
   10:1 ratio, "no direct links", designated promo threads/days.
2. **The rules popup** — click "Rules" — numbered, the enforceable list. This is
   what mods remove on.
3. **The wiki / pinned posts** — many subs pin a "read before posting" or host a
   weekly megathread (Share Your SaaS, Feedback Friday, Showoff Saturday).

Map what you read to our fields:

| You see… | `self_promo_policy` |
|----------|---------------------|
| "Share your project anytime", showcase sub | `welcome` |
| "Self-promo only in the weekly thread / on Saturdays" | `megathread_only` |
| "Links only allowed in comments" | `comment_only` |
| "No self-promotion. Bans on sight." | `banned` |

Write `rules_summary` as 2–3 concrete bullets: **what gets removed** + **the
required format**. Write `self_promo_note` as the one specific caveat (e.g.
"use the Share Your SaaS thread, not the main feed").

---

## D. Gauge the karma / account bar

There's rarely a published number — infer it:

- Check the sidebar for an explicit "account must be X days old / Y karma".
- Read a few recent removed-post complaints or the mod pinned post.
- Heuristic:
  - `easy` — new accounts post fine (most showcase subs: r/SideProject, r/microsaas)
  - `medium` — brand-new accounts get auto-filtered; a few days of history needed
    (r/SaaS, r/startups)
  - `hard` — established account + real comment karma expected (r/Entrepreneur,
    Show HN)

Put the specifics in `karma_note` ("30+ comments of participation before posting").

When unsure, round UP (assume stricter) — safer to over-warn than get someone banned.

---

## E. Gauge activity + best time

- **Activity**: skim the front page. Many posts/day = `active`; a few/week =
  `moderate`; mostly dead = `low`. (Member count is NOT activity — ignore it.)
- **Best time**: when do top posts land? General default is Tue–Thu mornings ET
  for US-heavy subs; note the weekly thread day for megathread subs (Sat for
  Showoff Saturday, Fri for Feedback Friday).

---

## F. Directories / platforms (Product Hunt, BetaList, etc.)

Different shape — no karma. Capture:
- The **submit URL** (`url` field → the actual submit page).
- The **model**: 24h spike (PH), month-long (MicroLaunch), weekly (Peerlist),
  editorial waitlist (BetaList), dev-only (DevHunt).
- Free vs paid-skip, acceptance rate, audience. Put it in `self_promo_note`.
- `self_promo_policy` = `welcome` (they exist to be submitted to).

---

## G. Add the row

1. Open [`data/communities.json`](./data/communities.json), copy an existing
   object, fill every field. Use the **next free `id`**.
2. Reuse existing `niche_tags` (lowercase) so the matcher works — `saas`,
   `indie`, `launch`, `devtool`, `ai`, `beta`, `microsaas`, `buildinpublic`…
3. Set `verified_at` to **today** — the day you actually checked the live rules.
   Do not backdate or copy a date you didn't verify.
4. Generate + validate:
   ```bash
   npm run db:seed-gen
   ```
   Fix anything it rejects. Reload `/demo` to see the new row ranked.
5. When a Supabase project exists, load `supabase/seed.sql` into it.

---

## H. Keep it fresh (the recurring job)

- Re-verify the **top ~10** communities **monthly**. Rules change; stale = bans.
- The generator warns on any row whose `verified_at` is older than 45 days —
  that's your reminder.
- If a sub tightens its rules, update `self_promo_policy` + `self_promo_note`
  and bump `verified_at`.

---

## Division of labor

- **Claude** drafts rows from research + runs the generator.
- **You** do the final live-sidebar spot-check on high-traffic rows (you have the
  Reddit account + the judgment call on "is this still true"), and load the SQL.
