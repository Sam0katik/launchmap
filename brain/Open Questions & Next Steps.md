# Open Questions & Next Steps

## Blocking / needs operator
- [ ] **Run migrations** `0014` + `0015` in Supabase (karma accounts + daily cap
      depend on them). See [[Changelog]].
- [ ] **Run Admin → Scan Reddit data**, report the `fields: ...` line so we can
      lock the exact subreddit-rules field. See [[Reddit & Apify]].
- [ ] **Payments ownership decision:** is the merchant account owned by a real
      adult who will complete KYC? Determines whether we wire payments at all.
      See [[Payments (TODO)]].

## Next steps (ordered)
1. Verify rules source from the scan → make community rules pull straight from
   the subreddit (or fall back to `about/rules.json`).
2. Merge the "Map rules UX" batch to `main` (deploy).
3. Live Apify smoke test on prod: scan → thread search → karma check.
4. Payments: only on the legit adult+KYC path; pick provider (Cryptomus is
   scaffolded), set Vercel env, map webhook fields, test small.

## Watch-outs
- Vercel Hobby ~10s function limit → keep long jobs on async start+poll.
- Stale doc drift: `analyze/route.ts` comment says "$3" but unlock is **$2**
  (`lib/billing.ts`). Cosmetic; fix when touching that file.

## Recurring housekeeping
- Update [[Changelog]] + [[Decisions Log]] at the end of each batch.
- Keep [[Billing & Economy]] prices in sync with `lib/billing.ts`.
