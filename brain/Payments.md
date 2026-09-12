# Payments — Platega

**Status (2026-09-12):** integration code is complete and env-gated (off until
the three env vars below are set). No provider account yet. Balance can still
only be granted by admin test credit.

## Provider: Platega (platega.io)
- RUB rails: **SBP QR (2), RU cards (11), Sberpay (14), crypto (13),
  "international" cards (12)**. Fees per their site: cards from 5%, SBP from
  4%, crypto from 1% (negotiable with volume). No subscription fee.
- Hosted checkout: we create a transaction, redirect the user to Platega's page,
  the payer picks the method there. Callback on status change.
- **Callback auth = echoed headers** (`X-MerchantId` + `X-Secret`), no HMAC.
  We treat the callback only as a trigger and **re-read the transaction
  server-to-server** before crediting.
- Docs: https://docs.platega.io/ (RU). Endpoints used:
  `POST /v2/transaction/process` (no fixed method), `POST /transaction/process`
  (fixed method), `GET /transaction/{id}`. Statuses: PENDING / CONFIRMED /
  CANCELED / CHARGEBACKED. Callback retries: 3× at 5-min intervals if we don't
  answer 200 within 60 s.
- Testing: the dashboard has a "fake callback" button on a created transaction
  (CONFIRMED / CANCELED) — use it before a real ₽ payment.

## Eligibility (unchanged rule — see [[Security]])
The merchant account must be owned by someone eligible under Platega's own
terms who completes their real onboarding/KYC. We do not bypass age/KYC checks.
Platega's site says onboarding is "without official business registration";
their actual requirements are only visible in the application flow — verify
before relying on it.

## How the site is wired
- `lib/platega.ts` — create transaction, read status, verify callback headers,
  USD→RUB pricing (`PLATEGA_RUB_PER_USD`, rounded UP to whole rubles).
- `app/api/topup/create` — pending `topups` row (amount_cents + amount_rub) →
  Platega transaction → stores `provider_txn_id` → returns checkout URL.
- `app/api/webhooks/platega` — header auth → find our row (txn id, else
  `payload` = order_id) → re-read from Platega → require CONFIRMED + exact RUB
  amount → idempotent claim (`credited` false→true) → `credit_balance()` RPC.
  Non-CONFIRMED statuses are recorded on the row; CHARGEBACKED after credit is
  logged for manual handling (we never auto-debit into the negative).
- `topups` table (migration 0016): `provider`, `provider_txn_id`,
  `provider_status`, `amount_rub`, `currency`, `paid_at`; rows survive account
  deletion (`user_id` set null) so payment records are never lost.
- USD balance stays the unit of account; the payer sees "$5 · 475 ₽".

## Go-live checklist
1. Run migration `0016_platega_hardening.sql`.
2. Get merchant id + API key from the Platega dashboard; set
   `PLATEGA_MERCHANT_ID`, `PLATEGA_SECRET`, `PLATEGA_RUB_PER_USD` in Vercel.
   Rate: market RUB/USD **plus** the fee (≈ +5–7%).
3. In Platega settings set the callback URL to
   `https://<domain>/api/webhooks/platega` (HTTPS, public — required by them).
4. Create a test transaction → fake callback CONFIRMED → balance credited once
   (send it twice: second answer must be `already: true`).
5. Real $2 (≈190 ₽) top-up end-to-end; then CANCELED path; then a mismatched
   amount (should be recorded as `AMOUNT_MISMATCH`, not credited).
6. Legal pages already name Platega (privacy); refunds go back via Platega
   (`/refunds` wording is provider-neutral and still correct).

## Known limitations / decisions to make
- **Audience mismatch.** ZeroFans is an English product for indie makers
  worldwide; SBP/Mir/Sberpay only work for payers with Russian bank access.
  Method 12 ("international") exists but its coverage/fees are unverified —
  test it with a foreign card before promising it.
- **Fixed RUB rate** in env, not live FX. Platega exposes
  `GET /rates/payment_method_rate` (RUB→USDT) if a live rate is wanted later.
- **Reddit ToS** — see [[Reddit Compliance (BLOCKER)]]. Platega is unlikely to
  review this the way Dodo did, but the exposure to Reddit is unchanged as long
  as paid features sell scraped Reddit data.

Related: [[Billing & Economy]] · [[Open Questions & Next Steps]]
