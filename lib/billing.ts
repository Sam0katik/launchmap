// Billing — prices for the internal USD balance (all amounts in cents).
//
// Money in: balance top-ups through Platega's hosted checkout (lib/platega.ts,
// app/api/topup/create, app/api/webhooks/platega). Money out: per-map unlock
// and the paid add-ons below, deducted server-side with a compare-and-swap.

// Per-map unlock price (one-time) — unlocks all publics + posting briefs.
export const UNLOCK_PRICE_CENTS = 200;
export const UNLOCK_PRICE_LABEL = "$2 one-time";

// "Where to jump in" (live Reddit threads via Apify): the first search on a
// map is free (included in the unlock); refreshes are paid.
export const THREAD_SEARCH_PRICE_CENTS = 50;
export const THREAD_SEARCH_PRICE_LABEL = "$0.50";

// Per-check price for verifying a Reddit account's karma/readiness. Requires at
// least one unlocked map (enforced server-side in /api/reddit/karma/start).
export const KARMA_CHECK_PRICE_CENTS = 30;
export const KARMA_CHECK_PRICE_LABEL = "$0.30";
// Max Reddit accounts a user can keep attached to their profile.
export const MAX_REDDIT_ACCOUNTS = 3;

/** Format a cents amount as a USD string, e.g. 1050 → "$10.50". */
export function formatUsd(cents: number): string {
  return `$${(Math.max(0, cents) / 100).toFixed(2)}`;
}

// Max launch maps (roadmaps) a user may keep at once. Each gets a free basic
// analysis; deleting one frees a slot. Paid unlock is per-map, not per-account.
export const MAX_MAPS_PER_ACCOUNT = 2;
