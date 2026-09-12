# Security

## Hard invariants (never break)
1. **Service-role only for money.** All `profiles`/`runs` writes for balance or
   `unlocked` go through server routes using the service-role key. **Never**
   add a client-side UPDATE RLS policy for these.
2. **Real data only.** Never fabricate members/karma/rules. Unverified → empty.
3. **Secrets in host env (Vercel) only.** Never commit keys. Any key pasted in
   chat is considered compromised → regenerate it.

## Posture (verified)
- **RLS**: `communities` world-read/no client write; `runs` read/insert own
  only, update/delete via server routes; `profiles` read own, no client UPDATE
  (dropped in migration 0006).
- **Paid columns are server-only** (migration 0016): `runs.result` (the full
  ranked map incl. locked entries) and `runs.opportunities` are revoked from
  `anon`/`authenticated`. Before this any signed-in user could read the whole
  locked map through the REST API with the public anon key. Pages/routes check
  ownership via RLS, then read with the service role.
- **Admin check is identity-based** (`lib/admins.ts`): GitHub login is read
  from `user.identities` (provider-issued), never `user_metadata` (any user can
  rewrite their own via `auth.updateUser`). `ADMIN_USER_IDS` is the preferred
  allowlist.
- **CAS deductions**: balance updates use `where balance_cents = <old>` so
  concurrent spends can't double-charge.
- **Idempotent top-up**: Platega callback is header-authenticated, then the
  transaction is re-read server-to-server (status CONFIRMED + exact RUB amount)
  before an atomic claim `credited false→true`; credit is `credit_balance()`
  (SQL, service-role only). Failure = rollback + 5xx so the provider retries;
  never silent loss.
- **Atomic credits everywhere**: refunds and admin credits use
  `credit_balance()` — a snapshot write could erase a concurrent CAS spend or
  a top-up landing in between.
- **OAuth callback `next`** only accepts same-origin paths (no open redirect).
- **Response headers**: nosniff, X-Frame-Options DENY, referrer policy,
  permissions policy; `poweredByHeader` off; image optimizer disabled (unused).
- **`ensureProfile` guarantee** (`lib/profile.ts`): every money path ensures the
  profile row exists first. Idempotent; never overwrites balance.
- **Rate limits**: 2 maps/account, 15 analyses/day (blocks delete→create budget
  burn), karma needs ≥1 unlock. **Global caps** (migration 0017, `lib/budget.ts`):
  300 analyses / 150 Apify runs / 5 scans per day across all accounts.
- **Apify run binding**: `/result` routes only accept the run id their own
  `/start` stored on the row. Token sent as a header, never in the URL.
- **SSRF guard** (`analyze`): blocks localhost/link-local/private/reserved
  ranges (v4, v6, v4-mapped), DNS-resolves every hop and requires all addresses
  to be public, re-checks each redirect hop, caps the body at 1 MB.

## Known residual
- **Next.js 14.2.x is past its security-backport window.** We're on 14.2.35
  (last 14.x); several 2026 advisories are fixed only in 15.5.x (and postcss
  8.4 bundled by Next). Migration to Next 15.5 is a separate task (React 19,
  async `cookies()`/`params`).
- DNS rebinding between our lookup and Node's own fetch resolution is still
  theoretically possible (TOCTOU); low risk on Vercel.
- Per-user limits are per GitHub account; GitHub accounts are free. The global
  caps bound the damage; there is no IP-level limiting (Vercel WAF rate rules
  are the place for that if abuse shows up).
- `scripts/reddit-*.mjs` use Reddit's public JSON API, which returns 403 since
  May 2026 — operator scripts only, not shipped code.

## Safety context (operator)
- Operator is a **minor (under 18)** in RF with a banned Reddit account.
- **We do NOT help evade KYC/age verification** for payments. Legit path only:
  a real adult who genuinely owns the merchant account with real KYC. See
  [[Payments]].
