# Open Questions & Next Steps

## CURRENT STAGE (2026-07-14)
Product is **live on Vercel and working**. The outage is resolved (Supabase was
auto-paused on Free tier; middleware now fails open so it can't 504 the site).
Remaining work is two tracks: **(A) ground the Reddit rules data**,
**(B) turn on real payments**. All money features are still **off** — balance is
admin-granted test credit only.

## Blocking / needs operator
- [ ] **Run migrations** `0014_reddit_accounts.sql` + `0015_analyze_limit.sql`
      in the Supabase SQL Editor. Until then karma accounts + the daily cap break.
- [ ] **Run Admin → Scan Reddit data**, send the `fields: ...` line so we can
      lock the exact subreddit-rules field. See [[Reddit & Apify]].
- [ ] **Dodo onboarding by the adult owner** (KYC + payout-country check), then
      provide API docs, or set `DODO_API_KEY` / `DODO_WEBHOOK_SECRET` in Vercel.
      See [[Payments (TODO)]].
- [ ] **Keep Supabase awake** — Free tier auto-pauses after ~7 days idle (this
      caused the outage). Use it regularly, or upgrade to Pro.

## Next steps (ordered)
1. Migrations 0014 + 0015.
2. Scan → report `fields:` → lock the rules source (or fall back to
   `about/rules.json`).
3. Merge the Dodo scaffold to `main` (inert until env vars are set).
4. Dodo go-live: verify the `VERIFY`-marked field names in `lib/dodo.ts` against
   their API docs, point their webhook at `/api/webhooks/dodo`, test a $2 top-up,
   confirm a duplicate webhook credits only once.
5. Consolidate payment webhooks: `webhooks/payment` (direct unlock, bypasses the
   balance) contradicts the balance model — remove or rework once Dodo is live.
6. Live Apify smoke test on prod: scan → thread search → karma check.

## Watch-outs
- Vercel Hobby ~10s function limit → long jobs stay on async start+poll.
- `analyze/route.ts` comment says "$3" but unlock is **$2**. Cosmetic.
- `lib/dodo.ts` field names are unverified (marked `VERIFY`); the functions fail
  closed, so nothing breaks while it's unconfigured.

## Recurring housekeeping
- Update [[Journal]] + [[Changelog]] each batch; log calls in [[Decisions Log]].
- Keep [[Billing & Economy]] prices in sync with `lib/billing.ts`.
