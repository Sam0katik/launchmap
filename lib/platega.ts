import crypto from "crypto";

// Platega (platega.io) — hosted checkout for balance top-ups. RUB rails: SBP
// QR, RU cards, Sberpay, crypto, "international" cards. The payer picks the
// method on Platega's own page; we only create the transaction and get a URL.
//
// Env (host only, never in code):
//   PLATEGA_MERCHANT_ID    — merchant UUID (dashboard → settings)
//   PLATEGA_SECRET         — API key; also what Platega sends back in the
//                            X-Secret header of every callback (that is their
//                            callback auth — there is no HMAC signature)
//   PLATEGA_RUB_PER_USD    — fixed conversion for pricing the USD balance in
//                            RUB, e.g. "95". Set it above the market rate so
//                            provider fees (1–5%) and RUB moves are covered.
//   PLATEGA_PAYMENT_METHOD — optional. Forces one method via the v1 endpoint
//                            (2 SBP, 11 RU card, 12 international, 13 crypto,
//                            14 Sberpay). Unset = payer chooses on the page.
//   PLATEGA_API_BASE       — optional override (default https://app.platega.io)
//
// API (docs.platega.io):
//   POST /v2/transaction/process  → { transactionId, status, url, expiresIn, rate }
//   POST /transaction/process     → { transactionId, status, redirect, ... }  (method fixed)
//   GET  /transaction/{id}        → { id, status, paymentDetails:{amount,currency}, payload, ... }
//   callback: POST our URL, headers X-MerchantId/X-Secret,
//             body { id, amount, currency, status, paymentMethod, payload }
//   statuses: PENDING | CONFIRMED | CANCELED | CHARGEBACKED

const API_BASE =
  process.env.PLATEGA_API_BASE?.replace(/\/$/, "") || "https://app.platega.io";

export const PLATEGA_METHODS: Record<number, string> = {
  2: "SBP QR",
  3: "ERIP",
  11: "RU card",
  12: "International card",
  13: "Crypto",
  14: "Sberpay",
};

export function rubPerUsd(): number {
  const n = Number(process.env.PLATEGA_RUB_PER_USD);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** True only when merchant id, secret and a positive RUB rate are all set. */
export function plategaConfigured(): boolean {
  return (
    !!process.env.PLATEGA_MERCHANT_ID &&
    !!process.env.PLATEGA_SECRET &&
    rubPerUsd() > 0
  );
}

/** USD cents → whole rubles, rounded up (never under-charge). */
export function usdCentsToRub(cents: number): number {
  return Math.ceil((cents / 100) * rubPerUsd());
}

function forcedMethod(): number | null {
  const raw = process.env.PLATEGA_PAYMENT_METHOD;
  if (!raw) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n in PLATEGA_METHODS ? n : null;
}

function authHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-MerchantId": process.env.PLATEGA_MERCHANT_ID ?? "",
    "X-Secret": process.env.PLATEGA_SECRET ?? "",
  };
}

export type PlategaStatus = "PENDING" | "CONFIRMED" | "CANCELED" | "CHARGEBACKED";

/**
 * Create a transaction and return the hosted-checkout URL. `orderId` (our
 * topups.order_id) rides along as `payload` (and `orderId` on v2) so the
 * callback can be matched even if the transaction id lookup fails.
 */
export async function createPlategaPayment(opts: {
  amountRub: number;
  orderId: string;
  description: string;
  returnUrl: string;
  failedUrl: string;
}): Promise<{ transactionId: string; url: string } | { error: string }> {
  const method = forcedMethod();
  const body: Record<string, unknown> = {
    paymentDetails: { amount: opts.amountRub, currency: "RUB" },
    description: opts.description,
    return: opts.returnUrl,
    failedUrl: opts.failedUrl,
    payload: opts.orderId,
  };
  if (method) body.paymentMethod = method;
  else body.orderId = opts.orderId;
  const path = method ? "/transaction/process" : "/v2/transaction/process";

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return { error: "network" };
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return { error: `platega_${res.status}: ${text.slice(0, 160)}` };
  }
  const data = (await res.json().catch(() => null)) as {
    transactionId?: string;
    url?: string;
    redirect?: string;
  } | null;
  const transactionId = data?.transactionId;
  const url = data?.url ?? data?.redirect;
  if (typeof transactionId !== "string" || typeof url !== "string") {
    return { error: "bad_response" };
  }
  return { transactionId, url };
}

/** Authoritative status read (server-to-server). Null on network/parse error. */
export async function getPlategaTransaction(id: string): Promise<{
  status: string;
  amount: number | null;
  currency: string | null;
  payload: string | null;
} | null> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/transaction/${encodeURIComponent(id)}`, {
      headers: authHeaders(),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return null;
  }
  if (!res.ok) return null;
  const data = (await res.json().catch(() => null)) as {
    status?: string;
    paymentDetails?: { amount?: number; currency?: string } | string;
    payload?: string;
  } | null;
  if (!data || typeof data.status !== "string") return null;
  const details =
    data.paymentDetails && typeof data.paymentDetails === "object"
      ? data.paymentDetails
      : null;
  return {
    status: data.status,
    amount: typeof details?.amount === "number" ? details.amount : null,
    currency: typeof details?.currency === "string" ? details.currency : null,
    payload: typeof data.payload === "string" ? data.payload : null,
  };
}

/**
 * Platega authenticates callbacks by echoing the merchant id + secret in the
 * request headers. Constant-time compare against our env values; both must
 * match. (We additionally re-read the transaction server-to-server before
 * crediting — see app/api/webhooks/platega.)
 */
export function verifyPlategaCallback(headers: {
  merchantId: string | null;
  secret: string | null;
}): boolean {
  return (
    safeEqual(headers.merchantId, process.env.PLATEGA_MERCHANT_ID) &&
    safeEqual(headers.secret, process.env.PLATEGA_SECRET)
  );
}

function safeEqual(a: string | null | undefined, b: string | undefined): boolean {
  if (!a || !b) return false;
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}
