# Payments (TODO)

**Status:** no working top-up provider. Balance can only be granted by admin
test credit today. The whole billing surface is env-gated (off by default).

## The blocker (must respect — see [[Security]])
Operator is a **minor (under 18)** in RF. **Any** real payment processor
requires the merchant/account owner to be an adult and pass **KYC + payout
onboarding** (bank/tax/ID). We do **not** help bypass age/KYC.

**Only legitimate path:** a real adult (parent/guardian) genuinely owns the
merchant account and completes their own real KYC. If the account is a made-up
identity, we don't wire payments onto it.

**Decided 2026-07-14:** operator confirmed the **adult-owner + real-KYC** path.
Site side wires the integration; the adult owns the account and does KYC/payouts.

## Provider notes
### PayNow.gg (screenshot 2026-07-14) — POOR FIT
- Built for **game-server / community** monetization; hosted webstore
  authenticates customers via **Steam / username**, not our GitHub users.
- Product/SKU based; not designed to credit an internal USD balance to an
  arbitrary web-app user. Would need the **Headless API** type + our own store.
- Still requires store-owner onboarding/payouts (adult + KYC).
- **Verdict:** likely wrong tool for a GitHub-auth SaaS balance top-up.

### Dodo Payments (screenshot 2026-07-14) — GOOD FIT ⭐
- **Merchant of Record** for AI/SaaS: credit-based billing + usage metering +
  global payments. Maps directly onto our internal USD balance model.
- **USD card payments** — exactly what the operator wants (fiat, not crypto).
- Integrates via API + webhooks + hosted checkout → slots into our existing
  `topup/create` + webhook surface.
- Still needs the **adult owner** to onboard with real identity/business KYC and
  a payout account; **check Dodo's supported payout countries** for the owner.
- **Recommended fiat option.** Need their API docs / webhook payload to map fields.

### Other candidates (still need adult + KYC)
- **Cryptomus** — scaffolded already (`lib/cryptomus.ts`, webhook re-verifies
  status). Crypto acquirer.
- **NOWPayments** — crypto, previously discussed as the path via an adult owner.
- Any provider exposing **hosted checkout URL + signed webhook** slots into the
  existing generic surface (`lib/billing.ts`, `webhooks/payment`).

## What the SITE already has (provider-agnostic)
- `topups` table (idempotent via `order_id` + `credited`).
- `topup/create` route (creates pending row + invoice).
- Two webhook shapes: `webhooks/cryptomus` (status re-verify + credit) and
  `webhooks/payment` (HMAC-signed, flips a run to unlocked).
- Env slots: `PAYMENT_CHECKOUT_URL`, `PAYMENT_WEBHOOK_SECRET`, `PAYMENT_PROVIDER`
  (+ Cryptomus: `CRYPTOMUS_MERCHANT_ID`, `CRYPTOMUS_API_KEY`).

## To go live with a provider (whoever it is)
1. Confirm an **adult owner + real KYC** on the merchant account.
2. Pick provider; create product/checkout that carries our `order_id`/`run_id`.
3. Set the env vars in Vercel (never in code).
4. Map the provider's webhook field names onto our webhook lookups.
5. Test end-to-end on a small amount; confirm idempotency (double webhook = one
   credit).

See [[Open Questions & Next Steps]].
