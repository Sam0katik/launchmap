import crypto from "crypto";

// Dodo Payments integration (USD card top-ups) — SCAFFOLD.
//
// Merchant-of-Record with credit-based billing → fits our internal USD balance.
// Everything is env-gated: with the vars unset the top-up path ignores Dodo, so
// the app runs fine without it. Set in the host env (Vercel), never in code:
//   DODO_API_KEY         — secret API key (Dodo dashboard → Developer)
//   DODO_WEBHOOK_SECRET  — webhook signing secret ("whsec_..."), Standard Webhooks
//   DODO_API_BASE        — optional; defaults to live. Use the test base in dev.
//
// ⚠️ TODO before go-live: confirm the create-payment request/response field
// names and the checkout-URL field against Dodo's API docs (couldn't fetch them
// from the dev environment). The functions fail closed (return null / false) on
// any mismatch, so a wrong shape degrades gracefully instead of crashing.

const API_BASE =
  process.env.DODO_API_BASE?.replace(/\/$/, "") || "https://api.dodopayments.com";

export function dodoConfigured(): boolean {
  return !!process.env.DODO_API_KEY;
}

/** Create a hosted checkout / payment link for a USD top-up. Returns the URL to
 *  redirect the buyer to, or null on any failure. `orderId` rides in metadata
 *  so the webhook can match the payment back to our pending `topups` row. */
export async function createDodoCheckout(params: {
  amountCents: number;
  orderId: string;
  returnUrl: string;
}): Promise<string | null> {
  const key = process.env.DODO_API_KEY;
  if (!key) return null;

  // NOTE: shape per Dodo's "create payment (payment link)" endpoint — VERIFY.
  const payload = {
    payment_link: true,
    billing_currency: "USD",
    amount: params.amountCents, // smallest currency unit (cents)
    return_url: params.returnUrl,
    metadata: { order_id: params.orderId },
  };

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(12000),
    });
  } catch {
    return null;
  }
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  // Dodo returns the hosted link — field name VERIFY (payment_link / checkout_url).
  const url =
    data?.payment_link ?? data?.checkout_url ?? data?.url ?? data?.link;
  return typeof url === "string" ? url : null;
}

/** Verify a Dodo webhook using the Standard Webhooks scheme (svix-style):
 *  HMAC-SHA256 over `${id}.${timestamp}.${rawBody}` with the base64 secret,
 *  compared to any of the space-delimited `v1,<sig>` values in the header. */
export function verifyDodoWebhook(
  headers: {
    id: string | null;
    timestamp: string | null;
    signature: string | null;
  },
  rawBody: string
): boolean {
  const secretRaw = process.env.DODO_WEBHOOK_SECRET;
  if (!secretRaw || !headers.id || !headers.timestamp || !headers.signature) {
    return false;
  }
  const secretBytes = Buffer.from(secretRaw.replace(/^whsec_/, ""), "base64");
  const signedContent = `${headers.id}.${headers.timestamp}.${rawBody}`;
  const expected = crypto
    .createHmac("sha256", secretBytes)
    .update(signedContent)
    .digest("base64");

  // Header is one or more space-separated "v1,<base64sig>" entries.
  return headers.signature.split(" ").some((part) => {
    const sig = part.includes(",") ? part.split(",")[1] : part;
    if (!sig || sig.length !== expected.length) return false;
    try {
      return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
    } catch {
      return false;
    }
  });
}

/** Pull our order_id + a paid flag out of a Dodo webhook event body. */
export function parseDodoEvent(body: unknown): {
  orderId: string | null;
  paid: boolean;
} {
  const b = body as Record<string, unknown> | null;
  const type = (b?.type ?? b?.event_type) as string | undefined;
  // Metadata may sit at the top level or under a `data` envelope — VERIFY.
  const data = (b?.data ?? b) as Record<string, unknown> | undefined;
  const meta = (data?.metadata ?? {}) as Record<string, unknown>;
  const orderId =
    typeof meta.order_id === "string" ? (meta.order_id as string) : null;
  const paid = /succeeded|completed|paid|success/i.test(type ?? "");
  return { orderId, paid };
}
