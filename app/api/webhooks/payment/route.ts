import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/webhooks/payment
// Provider-agnostic unlock webhook. Verifies an HMAC-SHA256 signature over the
// raw body (the shared secret is PAYMENT_WEBHOOK_SECRET), then flips the paid
// run to `unlocked`. Env-gated: with no secret set it returns 503 and does
// nothing, so it's safe to deploy now.
//
// The payload shape is intentionally minimal and provider-neutral: we only need
// to find the run_id (sent as custom data at checkout) and confirm the payment
// succeeded. When a concrete provider is chosen, map its event/field names onto
// the lookups below — the security envelope (mandatory signature, timing-safe
// compare) stays the same.
//
// Signature header: the provider's signature header name varies; we read the
// common ones. Set PAYMENT_SIGNATURE_HEADER to override.
export async function POST(req: NextRequest) {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "billing_not_configured" }, { status: 503 });
  }

  const raw = await req.text();
  const headerName =
    process.env.PAYMENT_SIGNATURE_HEADER?.toLowerCase() || "x-signature";
  const signature =
    req.headers.get(headerName) ??
    req.headers.get("x-signature") ??
    req.headers.get("sign") ??
    "";

  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  const valid =
    signature.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!valid) {
    return NextResponse.json({ error: "bad_signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad_payload" }, { status: 400 });
  }

  // run_id may arrive under a few common custom-data shapes depending on the
  // provider; check the likely paths.
  const runId =
    (readPath(payload, ["meta", "custom_data", "run_id"]) as string) ??
    (readPath(payload, ["custom", "run_id"]) as string) ??
    (readPath(payload, ["order", "run_id"]) as string) ??
    (readPath(payload, ["run_id"]) as string);

  // Treat the event as a successful payment unless it's explicitly a non-paid
  // status. Providers differ; default to unlocking only on a clear success.
  const status =
    (readPath(payload, ["status"]) as string) ??
    (readPath(payload, ["meta", "event_name"]) as string) ??
    "";
  const isPaid = /paid|success|completed|order_created|confirm/i.test(status);

  if (!isPaid || typeof runId !== "string") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("runs")
      .update({ unlocked: true })
      .eq("id", runId);
    if (error) {
      console.error("[payment] unlock failed:", error);
      return NextResponse.json({ error: "unlock_failed" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[payment] error:", e);
    return NextResponse.json({ error: "unlock_failed" }, { status: 500 });
  }
}

/** Safe nested lookup on an unknown JSON value. */
function readPath(obj: unknown, path: string[]): unknown {
  let cur: unknown = obj;
  for (const key of path) {
    if (cur && typeof cur === "object" && key in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  return cur;
}
