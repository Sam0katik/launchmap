import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  cryptomusConfigured,
  getPaymentStatus,
  isPaidStatus,
} from "@/lib/cryptomus";

// POST /api/webhooks/cryptomus
// Cryptomus calls this on payment updates. We don't trust the body — we re-ask
// Cryptomus for the authoritative status by order_id, then credit the balance
// exactly once (idempotent via topups.credited + the unique order_id).
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!cryptomusConfigured()) {
    return NextResponse.json({ error: "billing_off" }, { status: 503 });
  }

  const payload = (await req.json().catch(() => null)) as {
    order_id?: string;
  } | null;
  const orderId = payload?.order_id;
  if (!orderId) {
    return NextResponse.json({ error: "bad_payload" }, { status: 400 });
  }

  // Authoritative re-check (a forged callback can't fake this).
  const status = await getPaymentStatus(orderId);
  if (!isPaidStatus(status)) {
    return NextResponse.json({ ok: true, ignored: true, status });
  }

  const admin = createAdminClient();

  // Find the pending top-up. If already credited, this is a duplicate callback.
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

  // Claim this top-up atomically: only the request that flips credited false→true
  // gets to add the balance, so concurrent callbacks can't double-credit.
  const { data: claimed } = await admin
    .from("topups")
    .update({ credited: true, status: "paid" })
    .eq("id", topup.id)
    .eq("credited", false)
    .select("id");
  if (!claimed || claimed.length === 0) {
    return NextResponse.json({ ok: true, already: true });
  }

  // Credit the balance (read-add-write; only this claimant runs it).
  const { data: profile } = await admin
    .from("profiles")
    .select("balance_cents")
    .eq("id", topup.user_id)
    .maybeSingle();
  const balance = (profile?.balance_cents as number) ?? 0;
  const { error: creditErr } = await admin
    .from("profiles")
    .update({ balance_cents: balance + (topup.amount_cents as number) })
    .eq("id", topup.user_id);
  if (creditErr) {
    // Roll back the claim so a retry can credit.
    await admin
      .from("topups")
      .update({ credited: false, status: "pending" })
      .eq("id", topup.id);
    return NextResponse.json({ error: "credit_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, credited: topup.amount_cents });
}
