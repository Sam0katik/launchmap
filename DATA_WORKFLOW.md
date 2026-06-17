# How we fill & maintain the community DB

The community catalog is the product's moat. Accuracy > volume. This is the
exact workflow for filling it and keeping it fresh.

## Single source of truth

```
data/communities.json   ← edit THIS (human-friendly, one object per community)
        │
        ├─ /demo + the app read it directly (instant in dev)
        │
        └─ npm run db:seed-gen  →  supabase/seed.sql  →  load into Supabase
```

You never hand-edit `supabase/seed.sql` — it's generated. Edit the JSON.

## Adding / editing a community

1. Open `data/communities.json`. Copy an existing object, change the fields.
2. Required fields (the generator rejects bad data):

| Field | Rule |
|-------|------|
| `id` | unique number |
| `platform` | `reddit` \| `discord` \| `x` \| `hackernews` \| `directory` |
| `name`, `url` | url must be `http(s)://…` |
| `niche_tags` | non-empty array, lowercase |
| `self_promo_policy` | `welcome` \| `megathread_only` \| `comment_only` \| `banned` |
| `karma_tier` | `easy` \| `medium` \| `hard` \| null |
| `activity_level` | `active` \| `moderate` \| `low` \| null |
| `verified_at` | `YYYY-MM-DD` — the day you last checked the live rules |

3. Run the generator:
   ```bash
   npm run db:seed-gen
   ```
   It validates every row, writes `supabase/seed.sql`, and warns on rows whose
   `verified_at` is older than 45 days.
4. Load to Supabase (once a project exists): paste `supabase/seed.sql` into the
   Supabase SQL editor, or `supabase db execute < supabase/seed.sql`.

## The freshness rule (don't skip)

Rules change; stale rules get a user banned. So:

- `verified_at` = the date you actually opened the live sidebar and confirmed.
  Don't copy today's date onto a row you didn't check.
- Re-verify the top communities **monthly**. The generator's stale warning is
  the reminder.
- When in doubt about a sub's current self-promo posture, the safe default is
  `megathread_only` + a note, not `welcome`.

## How we grow it (sourcing new communities)

1. `/last30days` + web research for "where indie/SaaS/dev-tool makers launch".
2. For each candidate: open the live sidebar/rules, record the real posture.
3. Keep the niche tight (vibe-coders / indie SaaS / dev tools). ~20–30 is the
   target. Precision beats a 500-row junk list.
4. Tag consistently — reuse existing `niche_tags` so the matcher works
   (`saas`, `indie`, `launch`, `devtool`, `ai`, `beta`, …).

## Who does what

- **Claude:** research candidates, draft rows, run the generator, keep the
  schema/validation honest.
- **You:** spot-check the high-traffic rows against the live sidebar before a
  real launch (you have the Reddit account + judgment), and load the SQL into
  Supabase.
