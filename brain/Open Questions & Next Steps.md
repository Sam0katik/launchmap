# Open Questions & Next Steps

## CURRENT STAGE (2026-09-12)
Product is **live on Vercel**. Security audit done and shipped (see
[[Changelog]] / [[Security]]). **Platega integration is written and off** until
the merchant credentials exist. All money features still run on admin-granted
test credit.

## Blocking / needs operator
- [ ] **Run migration `0016_platega_hardening.sql`** in the Supabase SQL
      Editor (and confirm `0014`/`0015` were run). Until 0016 runs: refunds /
      admin credit call a missing RPC, and the paywall column fix isn't active.
- [ ] **Set `ADMIN_USER_IDS`** in Vercel (Supabase → Auth → Users → copy the
      UUID). `ADMIN_USERNAMES` still works (now identity-based).
- [ ] **Decide the Reddit question** — [[Reddit Compliance (BLOCKER)]]:
      (A) drop Apify-backed paid features and sell only our own curated
      map + briefs, or (B) get written approval from Reddit. Turning on payments
      while selling scraped Reddit data is the legal exposure, whichever
      provider processes the money.
- [ ] **Platega onboarding** (eligible account owner, real KYC), then set
      `PLATEGA_MERCHANT_ID`, `PLATEGA_SECRET`, `PLATEGA_RUB_PER_USD` and the
      callback URL — checklist in [[Payments]].
- [ ] **Keep Supabase awake** — Free tier auto-pauses after ~7 days idle.

## Next steps (ordered)
1. Migration 0016 + `ADMIN_USER_IDS`.
2. Reddit decision (A/B). If A: remove `opportunities/*`, `reddit/karma/*`,
   admin scan, `lib/apify.ts`; rewrite map/landing copy that promises "live
   mod-pinned rules" / "live threads" / "karma check"; drop the two add-on
   prices from [[Billing & Economy]].
3. Platega go-live per [[Payments]] (fake callback → real ₽2 top-up → duplicate
   callback → mismatched amount).
4. Verify method 12 ("international card") with a non-Russian card before
   advertising it; otherwise the paying audience is RU-only.
5. Next.js 15.5 migration (security backports for 14.x have ended).
6. Bind Apify run ids to the user at `/start` (see residuals in [[Security]]).

## Watch-outs
- Vercel Hobby ~10s function limit → long jobs stay on async start+poll.
- `lib/reddit.ts` is dead code (public CORS-proxy fetches); delete when
  touching that area.
- Fixed RUB rate in env: revisit when RUB/USD moves >5%.

## Recurring housekeeping
- Update [[Journal]] + [[Changelog]] each batch; log calls in [[Decisions Log]].
- Keep [[Billing & Economy]] prices in sync with `lib/billing.ts`.
