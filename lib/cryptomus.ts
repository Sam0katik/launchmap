import crypto from "crypto";

// Cryptomus crypto-payment integration (balance top-ups).
//
// Everything is env-gated — with the vars unset the top-up button stays inert,
// so the app runs fine without it. Set in the host env (Vercel), never in code:
//   CRYPTOMUS_MERCHANT_ID  — merchant UUID (Cryptomus dashboard)
//   CRYPTOMUS_API_KEY      — payment API key (dashboard → API)
//
// Security note: we do NOT trust the webhook body alone. When a callback
// arrives we re-ask Cryptomus for the authoritative payment status by order_id
// (server-to-server, signed), then credit — so a forged callback can't add
// balance.

const API = "https://api.cryptomus.com/v1";

export function cryptomusConfigured(): boolean {
  return !!(
    process.env.CRYPTOMUS_MERCHANT_ID && process.env.CRYPTOMUS_API_KEY
  );
}

// Cryptomus request signature: md5( base64(json_body) + api_key ).
function sign(bodyJson: string): string {
  const key = process.env.CRYPTOMUS_API_KEY as string;
  const base64 = Buffer.from(bodyJson).toString("base64");
  return crypto.createHash("md5").update(base64 + key).digest("hex");
}

async function post(path: string, payload: Record<string, unknown>) {
  const body = JSON.stringify(payload);
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: {
      merchant: process.env.CRYPTOMUS_MERCHANT_ID as string,
      sign: sign(body),
      "Content-Type": "application/json",
    },
    body,
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) return null;
  return res.json().catch(() => null);
}

/** Create a hosted invoice; returns the checkout URL or null. */
export async function createInvoice(params: {
  amountUsd: string;
  orderId: string;
  callbackUrl: string;
  returnUrl: string;
}): Promise<string | null> {
  const data = await post("/payment", {
    amount: params.amountUsd,
    currency: "USD",
    order_id: params.orderId,
    url_callback: params.callbackUrl,
    url_return: params.returnUrl,
  });
  const url = data?.result?.url;
  return typeof url === "string" ? url : null;
}

/** Authoritative payment status for one of our orders (re-checked on webhook). */
export async function getPaymentStatus(orderId: string): Promise<string | null> {
  const data = await post("/payment/info", { order_id: orderId });
  const status = data?.result?.payment_status ?? data?.result?.status;
  return typeof status === "string" ? status : null;
}

// Statuses Cryptomus uses for a settled payment.
export function isPaidStatus(status: string | null): boolean {
  return status === "paid" || status === "paid_over";
}
