// Billing — provider-agnostic interface (one-time map unlock).
//
// We deliberately don't hard-code a payment provider here. The app talks to a
// generic "hosted checkout" surface; a concrete provider (a crypto acquirer
// like Cryptomus/NOWPayments, a Telegram acquirer, or anything with a hosted
// checkout URL + a webhook) is wired in later by setting the env vars below.
//
// Everything is env-gated: with billing switched off the unlock button simply
// stays disabled, so the app runs perfectly today.
//
// Required env to go live:
//   PAYMENT_CHECKOUT_URL  — hosted checkout base. May contain "{run_id}" as a
//                           placeholder; otherwise run_id is appended as a
//                           ?run_id= query param so the webhook can match it.
//   PAYMENT_WEBHOOK_SECRET — shared secret used to verify the provider webhook.
//   PAYMENT_PROVIDER      — optional label, shown nowhere user-facing; handy for
//                           logs / future branching.

export interface BillingConfig {
  provider: string;
  checkoutUrl: string;
}

/** Returns the billing config only when fully provisioned, else null. */
export function getBillingConfig(): BillingConfig | null {
  const checkoutUrl = process.env.PAYMENT_CHECKOUT_URL;
  if (!checkoutUrl) return null;
  return {
    provider: process.env.PAYMENT_PROVIDER || "generic",
    checkoutUrl,
  };
}

/** True when checkout can be offered in this environment. */
export function isBillingEnabled(): boolean {
  return getBillingConfig() !== null;
}

/**
 * Build the hosted-checkout URL for unlocking one run. The `runId` rides along
 * so the provider's webhook can flip exactly that run to `unlocked` — either by
 * substituting a "{run_id}" placeholder or as a ?run_id= query param.
 * Returns null when billing isn't configured.
 */
export function buildCheckoutUrl(runId: string): string | null {
  const cfg = getBillingConfig();
  if (!cfg) return null;

  if (cfg.checkoutUrl.includes("{run_id}")) {
    return cfg.checkoutUrl.replace("{run_id}", encodeURIComponent(runId));
  }
  try {
    const u = new URL(cfg.checkoutUrl);
    u.searchParams.set("run_id", runId);
    return u.toString();
  } catch {
    // Not an absolute URL — fall back to a simple append.
    const sep = cfg.checkoutUrl.includes("?") ? "&" : "?";
    return `${cfg.checkoutUrl}${sep}run_id=${encodeURIComponent(runId)}`;
  }
}

// Per-map unlock price (one-time) — unlocks all publics + posting briefs.
export const UNLOCK_PRICE_CENTS = 300;
export const UNLOCK_PRICE_LABEL = "$3 one-time";

/** Format a cents amount as a USD string, e.g. 1050 → "$10.50". */
export function formatUsd(cents: number): string {
  return `$${(Math.max(0, cents) / 100).toFixed(2)}`;
}

// Max launch maps (roadmaps) a user may keep at once. Each gets a free basic
// analysis; deleting one frees a slot. Paid unlock is per-map, not per-account.
export const MAX_MAPS_PER_ACCOUNT = 2;
