# LaunchMap

**Paste your product URL → get a ranked map of where to post for first users** —
with each community's rules, karma requirements, best time, a one-click submit
link, and a tailored draft. So you launch without getting banned.

For indie makers and vibe-coders with zero audience and zero followers.

---

## Stack

- **Next.js 14** (App Router) on **Render** (`render.yaml` Blueprint)
- **Supabase** — Postgres + GitHub OAuth + RLS
- **Anthropic** — Claude Haiku (landing analysis + matching), Claude Sonnet (drafts)
- **Lemon Squeezy** — one-time map unlock (merchant of record, handles VAT)
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

Free tier shows the top 4 communities fully; the rest unlock with a one-time
payment. Drafts are generated lazily (Sonnet) only for unlocked communities.

## Project docs

- [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md) — full build sequence, risks, status
- [`DESIGN.md`](./DESIGN.md) — Linear-derived design tokens
- `supabase/seed.sql` — 7 starter communities (⚠️ verify before production)

## Core principles

The curated community DB is the product — accuracy over volume. Every row is
dated; stale rules get users banned. No auto-posting, ever — the user always
posts manually.
