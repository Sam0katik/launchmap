# LaunchMap — Development Plan

> Generated 2026-06-17. Built from `LaunchMap_MVP_спека.txt` + `/last30days` market
> validation + ECC/Next.js patterns. Stack decisions: **Next.js + Vercel + Supabase**,
> **Linear** design language.

---

## 0. Validation summary (why this is worth building)

Research (`/last30days` + web) confirms the thesis:

- **The "where do I post?" problem is real and unsolved-by-one-tool.** The 2026
  launch landscape is fragmented — 30+ Product Hunt alternatives, and the
  standard advice is a multi-week, multi-platform sequence (BetaList → Smol
  Launch → Indie Hackers → targeted Reddit → Product Hunt). LaunchMap automates
  exactly that mapping.
- **"Don't get banned" is the sharpest wedge.** Documented case: first 60
  customers in 45 days, zero ad spend — but banned twice in the first two weeks.
  Reddit's 90/10 rule, per-sub ratios, and silent shadowbans make the
  `self_promo_policy` + `karma_tier` + rules fields the actual product.
- **The moat is the curated, dated rules-DB + the action layer** (1-click submit
  + tailored draft), NOT the list. Flat directory lists are already commoditized.

### Risk register (address before/while building)

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| R1 | Reddit `/submit?title=&text=` prefill could change | 🔴 High | It's client-side web nav (not the dead .json API), so likely fine — but **manually verify on live old+new Reddit before building UI polish around it** (Step 3). |
| R2 | Curated data goes stale → users get banned → reputation hit | 🟡 Med | `verified_at` on every row; monthly re-verify of top communities; seed file carries an explicit accuracy warning. |
| R3 | Over-engineered AI matching on ~20 rows | 🟡 Med | Tag-intersection matcher first (`lib/matching.ts`); add Haiku tiebreak only if precision complaints appear. |
| R4 | Reddit killed unauthenticated .json API (403 since 2026-05-30) | 🟢 Low | LaunchMap never depends on live Reddit API — all data is in our own DB. Architecture already resilient. |

---

## 1. Architecture

```
Browser (Next.js App Router, Linear UI)
   │  POST /api/analyze { url, description? }
   ▼
Route Handler (server)
   ├─ Supabase Auth (GitHub OAuth) ── identify user
   ├─ rate-limit + URL cache (runs table)
   ├─ fetch landing HTML → strip to text
   ├─ Haiku → ProductAnalysis { summary, category, icp, niche_tags }
   ├─ tag-match + rank against `communities` (curated DB)
   └─ persist run → return runId
   ▼
/map/[id]  → renders ranked CommunityCards (top 4 free, rest locked)
   └─ unlock (Lemon Squeezy) → drafts (Sonnet, lazy) + submit links revealed
```

**Why this stack vs the spec's Render+Postgres:** Supabase gives Postgres +
GitHub OAuth + RLS out of the box (less hand-wiring than Render + separate
Postgres + custom OAuth), and Vercel is the zero-config Next.js host. Same
data model, same SQL schema, fewer moving parts for a solo MVP.

---

## 2. Repo layout (scaffolded)

```
launchmap/
├── app/
│   ├── layout.tsx            # Inter font, metadata
│   ├── page.tsx              # landing + URL form
│   ├── globals.css           # Linear tokens as CSS vars
│   ├── api/analyze/route.ts  # core pipeline endpoint
│   └── map/[id]/page.tsx     # result map screen
├── components/
│   ├── UrlForm.tsx           # URL + description input (client)
│   └── CommunityCard.tsx     # locked/unlocked card
├── lib/
│   ├── types.ts              # Community, ProductAnalysis, RankedCommunity…
│   ├── anthropic.ts          # Haiku analyze + Sonnet draft
│   ├── matching.ts           # tag-intersection ranker
│   ├── submit-links.ts       # platform submit-URL builder
│   └── supabase/{client,server}.ts
├── supabase/
│   ├── migrations/0001_init.sql  # communities + runs + RLS
│   └── seed.sql                  # 7 verified starter communities
├── DESIGN.md                 # Linear-derived design tokens for this project
└── DEVELOPMENT_PLAN.md       # this file
```

Status: **scaffold + schema + seed are in place** (this commit). The steps below
take it from scaffold to shipped.

---

## 3. Build sequence (sprints map to the spec's 6 steps)

### Step 0 — Project setup (½ day)
- [ ] `npm install`; create Supabase project; copy keys into `.env.local`.
- [ ] Run `supabase/migrations/0001_init.sql` then `supabase/seed.sql` in the
      Supabase SQL editor (or via the CLI).
- [ ] Enable GitHub OAuth provider in Supabase Auth; add callback URL.
- [ ] `npm run dev` → confirm landing renders.

### Step 1 — Database & seed (the moat) (day 1–2)
- [ ] **Manually verify** all 7 seed rows against live community rules. Fix any
      drift. This is the real work — the data is the product.
- [ ] Expand toward ~20 communities for the vibe-coder / indie-SaaS niche.
- [ ] Confirm `verified_at` is honest on every row.

### Step 2 — Analysis pipeline (day 3–5)  ← partly scaffolded
- [x] `/api/analyze`: auth → cache → rate-limit → fetch → Haiku → rank → persist.
- [ ] Harden landing fetch (timeouts, redirects, empty-page fallback to the
      user's description; if both empty, ask them to add a description).
- [ ] Tune Haiku prompt on 5–10 real product URLs; check tag quality.

### Step 3 — Map screen + submit links (day 5–7)
- [x] `/map/[id]` with ranked cards; locked/unlocked states.
- [ ] **R1 gate: verify the Reddit submit prefill end-to-end on a real sub.**
- [ ] Wire `buildSubmitLink()` into unlocked cards (currently the card links to
      the community URL; swap to the prefilled submit link once a draft exists).
- [ ] Empty/again states; mobile 1-up layout.

### Step 4 — Draft generation (Sonnet, lazy) (day 7–9)
- [ ] `POST /api/draft` — generate one draft per unlocked community on demand;
      cache it on the run so re-opens don't re-spend.
- [ ] Render draft in a collapsible block on unlocked cards.
- [ ] "Draft to adapt, don't copy verbatim" warning (anti-template-ban).

### Step 5 — Tiers & payment (day 9–12)
- [ ] Lemon Squeezy product ($7–12 one-time per map); checkout from the unlock CTA.
- [ ] `POST /api/webhooks/lemonsqueezy` → set `runs.unlocked = true` for the run.
- [ ] Free tier shows top 4 fully; locked rest reveal on unlock.
- [ ] Confirm rate limit (5/day) + URL cache (24h) behave under abuse.

### Step 6 — Deploy & full-cycle test (day 12)
- [ ] Deploy to Vercel; set env vars; point Supabase redirect URLs at prod.
- [ ] Run the full loop on a real product end-to-end.
- [ ] Security pass (ECC `security-review`): RLS, webhook signature, no service
      key on client, input validation.

---

## 4. Component status (this scaffold)

| File | State | Next action |
|------|-------|-------------|
| `app/api/analyze/route.ts` | working draft | harden fetch; test Haiku |
| `lib/anthropic.ts` | working draft | tune prompts |
| `lib/matching.ts` | done for MVP | revisit only if precision complaints |
| `lib/submit-links.ts` | done | verify R1 live |
| `app/map/[id]/page.tsx` | working draft | swap card link → submit link |
| `components/*` | working draft | draft block; checkout button |
| `supabase/*.sql` | schema done, seed needs verify | hand-verify 7 rows; grow to 20 |
| Auth (GitHub OAuth) | not wired | Step 0 |
| Payment (Lemon Squeezy) | not wired | Step 5 |
| Draft route | not built | Step 4 |

---

## 5. Principles (from the spec — do not break for convenience)

- The DB is the product. Accuracy > volume. ~20 communities is enough.
- Every row dated (`verified_at`). Stale rules = a banned user.
- No auto-posting, ever. The user always posts manually.
- Drafts are a starting point, not copy-paste.
- Submit link is the first unique feature built (it converts info → action).
- Do NOT add: monitoring, keyword alerts, CRM, analytics, scheduler, team
  features. Out of scope for a one-time launch tool.
- Member count is never the primary card field. Activity > size.
```
