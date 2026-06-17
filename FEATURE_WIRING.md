# LaunchMap — Feature Wiring (how each function connects, step by step)

> How we go from the current **skeleton** to a shipped product, one feature at a
> time. Each stage is independently shippable and leaves the app working.
> Host: **Render** (Web Service). DB + Auth: **Supabase**.

Legend: ✅ done · 🔜 next · ⬜ later · 🔴 gate (must verify before moving on)

---

## Stage 0 — Skeleton (DONE ✅)

What works right now, on localhost, with zero backend:

- ✅ Landing (`/`) — pixel wordmark, hero, URL form, Linear dark minimalism.
- ✅ Demo map (`/demo`) — full map UI with mock data: ranked cards, % match,
  color-coded policy badges, locked/unlocked states, unlock banner.
- ✅ Design system — Linear tokens + pixel display font, motion/polish (ECC).
- ✅ DB schema + 7 seed communities + RLS (not yet running on a live DB).
- ✅ Pipeline + AI clients written (`/api/analyze`, `lib/anthropic.ts`) — not
  yet connected to a live Supabase/Anthropic.

**You can see and click the product today at `/` and `/demo`.**

---

## Stage 1 — Live database (½ day) 🔜

Turn the static demo into real data.

1. Create a Supabase project. Copy URL + anon + service-role keys → `.env.local`.
2. Run `supabase/migrations/0001_init.sql`, then `supabase/seed.sql` in the SQL editor.
3. 🔴 **Hand-verify all 7 seed rows** against live community rules. This is the
   moat — wrong data bans users. Fix `verified_at` honestly.
4. Swap `/demo`'s mock import for a real `communities` query to confirm the DB
   path works end to end.

**Ship check:** `/demo` renders from Postgres, not `lib/demo-data.ts`.

---

## Stage 2 — Auth (GitHub OAuth) (½ day) ⬜

Identify users (needed for limits + payment).

1. Supabase Auth → enable GitHub provider; register a GitHub OAuth app; paste
   client id/secret; add callback URLs (local + Render).
2. Add `middleware.ts` to refresh the session cookie on each request.
3. "Sign in with GitHub" button in the nav; show avatar when signed in.
4. Gate `/api/analyze` on `auth.getUser()` (already coded — just needs a real session).

**Ship check:** sign in, see your GitHub identity, stay signed in across reloads.

---

## Stage 3 — Real analyze pipeline (2 days) ⬜

Make the URL form actually build a map.

1. Add `ANTHROPIC_API_KEY` to `.env.local`.
2. `/api/analyze` flow (already scaffolded): auth → URL cache → daily limit →
   fetch landing HTML → Haiku → `ProductAnalysis` → tag-match rank → persist run.
3. Point the form at it; route to `/map/[id]` with the real run.
4. Tune the Haiku prompt on 5-10 real product URLs; check tag quality.
5. Harden: landing fetch timeouts/redirects; empty page → fall back to the
   user's description; both empty → ask for a description.

**Ship check:** paste a real URL → get a ranked map from live AI + your DB.

---

## Stage 4 — Submit links (1 day) 🔴 ⬜

The headline "info → action" feature.

1. 🔴 **Manually verify** `reddit.com/r/<sub>/submit?title=&text=` pre-fills on
   live old + new Reddit before building UI around it. (Reddit killed the .json
   API in 2026; this prefill is web nav, not API — but confirm it.)
2. Wire `buildSubmitLink()` into unlocked cards: "Open submit form" opens the
   pre-filled compose page. Manual posting only — never auto-post.
3. Per-platform fallbacks: HN (title only), X (intent tweet), directories (plain
   "Open" link).

**Ship check:** clicking a card opens Reddit's compose form with title + body filled.

---

## Stage 5 — Draft generation (Sonnet, lazy) (2 days) ⬜

Tailored post drafts, generated only when needed.

1. `POST /api/draft` — generate one draft per unlocked community on demand
   (Sonnet); cache it on the run so re-opens don't re-spend.
2. Community rules/tone passed as fact in the prompt (no hallucinated rules).
3. Collapsible draft block on unlocked cards + "adapt, don't copy verbatim" warning.
4. Feed the draft into `buildSubmitLink()` so the submit form is pre-filled with it.

**Ship check:** unlocked card shows a community-specific draft; submit link carries it.

---

## Stage 6 — Tiers + payment (Lemon Squeezy) (2-3 days) ⬜

Free top-4 vs paid full map.

1. Create a Lemon Squeezy product ($7-12 one-time per map).
2. Unlock CTA → Lemon Squeezy checkout (overlay or hosted), pass the `runId`.
3. `POST /api/webhooks/lemonsqueezy` (signature-verified) → set
   `runs.unlocked = true` for that run.
4. `/map/[id]` reveals locked cards when `unlocked`. Free tier stays top-4.
5. Confirm daily limit (5/run) + 24h URL cache hold under abuse.

**Ship check:** pay → the same map unlocks all communities, drafts, submit links.

---

## Stage 7 — Deploy to Render + harden (1 day) ⬜

1. Push to GitHub → Render → New → Blueprint → this repo (`render.yaml`).
2. Set secret env vars in the Render dashboard; point Supabase + Lemon Squeezy
   redirect/callback/webhook URLs at the Render domain.
3. Security pass (ECC `security-review` / `security-scan`): RLS on, webhook
   signature verified, service-role key server-only, all input validated.
4. Full-loop smoke test on a real product in prod.

**Ship check:** the whole loop works on the public Render URL.

---

## Dependency order (what blocks what)

```
Stage 1 DB ──┬─> Stage 2 Auth ──> Stage 3 Analyze ──┬─> Stage 4 Submit links
             │                                       └─> Stage 5 Drafts ──> Stage 6 Payment ──> Stage 7 Deploy
             └─> (demo already works without any of these)
```

Stages 4 and 5 can run in parallel after Stage 3. Payment (6) needs auth (2) +
a working map (3). Everything ships behind the existing free-tier lock, so each
stage is safe to deploy as it lands.

---

## Guardrails (every stage)

- No auto-posting, ever. User always posts manually.
- Every community row dated; stale rules = a banned user.
- Drafts are a starting point, not copy-paste.
- Don't add scope: no monitoring, alerts, CRM, analytics, scheduler, teams.
- Member count never the primary card field. Activity > size.
