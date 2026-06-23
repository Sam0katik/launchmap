// Billing scaffolding (Stage 6 — Lemon Squeezy, one-time map unlock).
//
// Nothing here charges anyone yet: it is the typed surface the checkout button
// and the webhook will sit on once a Lemon Squeezy product exists. Everything is
// env-gated so the app runs perfectly with billing switched off (the unlock
// button simply stays disabled).

export interface BillingConfig {
  storeId: string;
  variantId: string;
  // The hosted checkout base, e.g. https://<store>.lemonsqueezy.com/checkout/buy
  checkoutBase: string;
}

/** Returns the billing config only when fully provisioned, else null. */
export function getBillingConfig(): BillingConfig | null {
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  const variantId = process.env.LEMONSQUEEZY_VARIANT_ID;
  const checkoutBase = process.env.LEMONSQUEEZY_CHECKOUT_URL;
  if (!storeId || !variantId || !checkoutBase) return null;
  return { storeId, variantId, checkoutBase };
}

/** True when checkout can be offered in this environment. */
export function isBillingEnabled(): boolean {
  return getBillingConfig() !== null;
}

/**
 * Build the hosted-checkout URL for unlocking one run. The `runId` rides along
 * as custom data so the webhook can flip exactly that run to `unlocked`.
 * Returns null when billing isn't configured.
 */
export function buildCheckoutUrl(runId: string): string | null {
  const cfg = getBillingConfig();
  if (!cfg) return null;
  const u = new URL(`${cfg.checkoutBase}/${cfg.variantId}`);
  // Lemon Squeezy passes checkout[custom][*] back on the order webhook.
  u.searchParams.set("checkout[custom][run_id]", runId);
  return u.toString();
}

// Price shown in the UI before checkout exists. Single source of truth.
export const UNLOCK_PRICE_LABEL = "$9 one-time";
