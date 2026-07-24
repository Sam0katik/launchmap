import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureProfile } from "@/lib/profile";
import { dodoConfigured, verifyDodoWebhook, parseDodoEvent } from "@/lib/dodo";

// POST /api/webhooks/dodo  — SCAFFOLD (env-gated).
// Dodo Payments calls this on payment events. We verify the Standard Webhooks
// signature over the RAW body, then credit the matching top-up exactly once
// (idempotent via topups.credited + the unique order_id). Same safety envelope
// as the Cryptomus webhook.
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!dodoConfigured()) {
    return NextResponse.json({ error: "billing_off" }, { status: 503 });
  }

  // Read the raw body first — signature is computed over the exact bytes.
  const raw = await req.text();
  const ok = verifyDodoWebhook(
    {
      id: req.headers.get("webhook-id"),
      timestamp: req.headers.get("webhook-timestamp"),
      signature: req.headers.get("webhook-signature"),
    },
    raw
  );
  if (!ok) {
    return NextResponse.json({ error: "bad_signature" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad_payload" }, { status: 400 });
  }

  const { orderId, paid } = parseDodoEvent(body);
  if (!paid || !orderId) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const admin = createAdminClient();

  const { data: topup } = await admin
    .from("topups")
    .select("id, user_id, amount_cents, credited")
    .eq("order_id", orderId)
    .maybeSingle();
  if (!topup) {
    return NextResponse.json({ error: "unknown_order" }, { status: 404 });
  }
  if (topup.credited) {
    return NextResponse.json({ ok: true, already: true });
  }

  // Atomic claim: only the request that flips credited false→true credits.
  const { data: claimed } = await admin
    .from("topups")
    .update({ credited: true, status: "paid" })
    .eq("id", topup.id)
    .eq("credited", false)
    .select("id");
  if (!claimed || claimed.length === 0) {
    return NextResponse.json({ ok: true, already: true });
  }

  // Guarantee the profile row exists so the credit can't hit 0 rows silently.
  await ensureProfile(topup.user_id as string);

  const { data: profile } = await admin
    .from("profiles")
    .select("balance_cents")
    .eq("id", topup.user_id)
    .maybeSingle();
  const balance = (profile?.balance_cents as number) ?? 0;
  const { data: creditedRows, error: creditErr } = await admin
    .from("profiles")
    .update({ balance_cents: balance + (topup.amount_cents as number) })
    .eq("id", topup.user_id)
    .select("id");
  if (creditErr || !creditedRows || creditedRows.length === 0) {
    // Roll back the claim so a retry can credit.
    await admin
      .from("topups")
      .update({ credited: false, status: "pending" })
      .eq("id", topup.id);
    return NextResponse.json({ error: "credit_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, credited: topup.amount_cents });
}
