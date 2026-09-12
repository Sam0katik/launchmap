# Open Questions & Next Steps

## CURRENT STAGE (2026-09-12)
Product is **live on Vercel**. Security audit done and shipped (see
[[Changelog]] / [[Security]]). **Platega integration is written and off** until
the merchant credentials exist. All money features still run on admin-granted
test credit.

## Blocking / needs operator
- [x] Migration 0016 applied and verified live (2026-09-12).
- [x] Migration 0017 applied and verified (2026-09-12).
- [x] Migration 0018 applied; Telegram bot connected (2026-09-12).
- [x] Migration 0019 applied (2026-09-12). Ledger records from that point on;
      earlier balance moves are not backfilled.
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
1. Reddit decision (A/B). If A: remove `opportunities/*`, `reddit/karma/*`,
   admin scan, `lib/apify.ts`; rewrite map/landing copy that promises "live
   mod-pinned rules" / "live threads" / "karma check"; drop the two add-on
   prices from [[Billing & Economy]].
2. Platega go-live per [[Payments]] (fake callback → real ₽2 top-up → duplicate
   callback → mismatched amount).
3. Verify method 12 ("international card") with a non-Russian card before
   advertising it; otherwise the paying audience is RU-only.
4. Next.js 15.5 migration (security backports for 14.x have ended).
5. Catalog growth: log unmatched niche tags from analyses to find coverage
   gaps; grow the catalog where matches are thin, never by bulk-adding
   unverified subs (accuracy is the product).

## Watch-outs
- Vercel Hobby ~10s function limit → long jobs stay on async start+poll.
- Fixed RUB rate in env: revisit when RUB/USD moves >5%.

## Recurring housekeeping
- Update [[Journal]] + [[Changelog]] each batch; log calls in [[Decisions Log]].
- Keep [[Billing & Economy]] prices in sync with `lib/billing.ts`.
