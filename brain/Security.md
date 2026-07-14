# Security

## Hard invariants (never break)
1. **Service-role only for money.** All `profiles`/`runs` writes for balance or
   `unlocked` go through server routes using the service-role key. **Never**
   add a client-side UPDATE RLS policy for these.
2. **Real data only.** Never fabricate members/karma/rules. Unverified → empty.
3. **Secrets in host env (Vercel) only.** Never commit keys. Any key pasted in
   chat is considered compromised → regenerate it.

## Posture (verified)
- **RLS**: `communities` world-read/no client write; `runs` read/insert/update
  own only, delete via server route; `profiles` read own, no client UPDATE
  (dropped in migration 0006).
- **CAS deductions**: balance updates use `where balance_cents = <old>` so
  concurrent spends can't double-charge.
- **Idempotent top-up**: webhook re-verifies status server-to-server and claims
  `credited false→true` atomically; credit update verified to hit a row (0-row
  update = rollback + fail, never silent loss).
- **`ensureProfile` guarantee** (`lib/profile.ts`): every money path ensures the
  profile row exists first. Idempotent; never overwrites balance.
- **Rate limits**: 2 maps/account, 15 analyses/day (blocks delete→create budget
  burn), karma needs ≥1 unlock.
- **SSRF guard** (`analyze`): blocks localhost/link-local/private ranges and
  re-checks every redirect hop before fetching.

## Known residual (low priority)
- DNS-rebinding: SSRF guard checks hostnames, not the resolved IP at fetch time.
  Low risk on Vercel; noted, not fixed.

## Safety context (operator)
- Operator is a **minor (under 18)** in RF with a banned Reddit account.
- **We do NOT help evade KYC/age verification** for payments. Legit path only:
  a real adult who genuinely owns the merchant account with real KYC. See
  [[Payments (TODO)]].
