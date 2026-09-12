# LaunchMap

**Paste your product URL → get a ranked map of where to post for first users** —
with each community's rules, karma requirements, best time, a one-click submit
link, and a tailored draft. So you launch without getting banned.

For indie makers and vibe-coders with zero audience and zero followers.

---

## Stack

- **Next.js 14** (App Router) on **Vercel** (deploys from `main`; `render.yaml` kept as an alternative)
- **Supabase** — Postgres + GitHub OAuth + RLS
- **Anthropic** — Claude Haiku (landing analysis + matching), Claude Sonnet (drafts)
- **Platega** — balance top-ups via hosted checkout (SBP / cards / crypto); unlocks are paid from the internal balance
- **Linear** design language (via `awesome-design-md`) + Pixelify Sans display font

## Quick start

```bash
npm install
cp .env.example .env.local      # fill in Supabase + Anthropic keys

# In the Supabase SQL editor (or CLI), run in order:
#   supabase/migrations/0001_init.sql
#   supabase/seed.sql

npm run dev                     # http://localhost:3000
#   /        landing + URL form
#   /demo    full map UI with mock data (no DB/keys needed)
```

Enable the **GitHub** provider in Supabase Auth and add the local + prod
callback URLs.

## How it works

```
URL → fetch landing → Haiku (ICP + tags) → tag-match curated DB →
rank → map (rules + time + submit link + draft)
```

Free tier shows the top 4 communities fully; the rest unlock per map from the
internal balance (topped up through Platega). Each community ships a
rules-derived posting brief.

## Project docs

- [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md) — full build sequence, risks, status
- [`DESIGN.md`](./DESIGN.md) — Linear-derived design tokens
- `supabase/seed.sql` — 7 starter communities (⚠️ verify before production)

## Core principles

The curated community DB is the product — accuracy over volume. Every row is
dated; stale rules get users banned. No auto-posting, ever — the user always
posts manually.
