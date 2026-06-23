import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/webhooks/lemonsqueezy
// Stage 6 scaffolding. Receives Lemon Squeezy order events, verifies the HMAC
// signature, and flips the paid run to `unlocked`. Env-gated: with no webhook
// secret set it returns 503 and does nothing, so it's safe to deploy now.
//
// Security: the signature check is mandatory — never trust the body without it.
// Uses crypto.timingSafeEqual to avoid timing oracles.
export async function POST(req: NextRequest) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "billing_not_configured" }, { status: 503 });
  }

  const raw = await req.text();
  const signature = req.headers.get("x-signature") ?? "";

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

  const eventName = readPath(payload, ["meta", "event_name"]);
  const runId = readPath(payload, ["meta", "custom_data", "run_id"]);

  // Only unlock on a completed order; ignore everything else (refunds, etc.).
  if (eventName !== "order_created" || typeof runId !== "string") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("runs")
      .update({ unlocked: true })
      .eq("id", runId);
    if (error) {
      console.error("[lemonsqueezy] unlock failed:", error);
      return NextResponse.json({ error: "unlock_failed" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[lemonsqueezy] error:", e);
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
