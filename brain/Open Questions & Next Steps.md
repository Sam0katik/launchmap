# Open Questions & Next Steps

## CURRENT STAGE (2026-09-13)
Product is **live on Vercel**. Security audit done and shipped (see
[[Changelog]] / [[Security]]). **Platega integration is written and off** until
the merchant credentials are set (no KYC obstacle — operator's word, 09-13).
All money features still run on admin-granted test credit.

## Blocking / needs operator
- [x] Migration 0016 applied and verified live (2026-09-12).
- [x] Migration 0017 applied and verified (2026-09-12).
- [x] Migration 0018 applied; Telegram bot connected (2026-09-12).
- [x] Migration 0019 applied (2026-09-12). Ledger records from that point on;
      earlier balance moves are not backfilled.
- [x] **Reddit question decided (2026-09-13): keep Apify.** Option A rejected;
      the scraped-data features stay paid. The ToS exposure in
      [[Reddit Compliance (BLOCKER)]] is an accepted risk now, not a blocker —
      that doc stays as the record of what the risk is and where the
      `APIFY_TOKEN` kill-switch is.
- [ ] **Platega credentials** — operator reports no KYC obstacle, so what's left
      is setting `PLATEGA_MERCHANT_ID`, `PLATEGA_SECRET`, `PLATEGA_RUB_PER_USD`
      and the callback URL, then the go-live checklist in [[Payments]].
- [ ] **Keep Supabase awake** — Free tier auto-pauses after ~7 days idle.

## Next steps (ordered)
1. Platega go-live per [[Payments]] (fake callback → real ₽2 top-up → duplicate
   callback → mismatched amount).
2. Verify method 12 ("international card") with a non-Russian card before
   advertising it; otherwise the paying audience is RU-only.
3. Next.js 15.5 migration (security backports for 14.x have ended).
4. Catalog growth: log unmatched niche tags from analyses to find coverage
   gaps; grow the catalog where matches are thin, never by bulk-adding
   unverified subs (accuracy is the product).

## Legal gaps still open (operator decision)
- No governing-law / jurisdiction clause and no named legal entity on the site.
  Standard for an MVP, but a payment provider or an EU user may ask. Decide what
  identity the merchant account will use and add it to Terms + Privacy.
- Privacy says "contact us for export"; there is no self-serve data export.
  Deletion IS self-serve, which covers the main obligation.

## Watch-outs
- Vercel Hobby ~10s function limit → long jobs stay on async start+poll.
- Fixed RUB rate in env: revisit when RUB/USD moves >5%.

## Recurring housekeeping
- Update [[Journal]] + [[Changelog]] each batch; log calls in [[Decisions Log]].
- Keep [[Billing & Economy]] prices in sync with `lib/billing.ts`.
