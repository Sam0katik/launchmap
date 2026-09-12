import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureProfile } from "@/lib/profile";
import {
  plategaConfigured,
  verifyPlategaCallback,
  getPlategaTransaction,
} from "@/lib/platega";
import { notifyTelegram } from "@/lib/telegram";
import { formatUsd } from "@/lib/billing";
import { recordBalanceEvent } from "@/lib/ledger";

// POST /api/webhooks/platega
// Platega calls this on every transaction status change (Settings → Callback
// URL in their dashboard → https://<site>/api/webhooks/platega). Safety
// envelope, in order:
//   1. header auth (X-MerchantId + X-Secret must equal our env, timing-safe);
//   2. find OUR topup row (by provider transaction id, else by order_id sent as
//      `payload`) — unknown transactions are never credited;
//   3. re-read the transaction from Platega server-to-server and require
//      CONFIRMED with the exact RUB amount we created — the callback body is
//      never trusted for money;
//   4. idempotent claim (`credited` false→true) so their retries (3× at 5-min
//      intervals) and duplicates credit exactly once;
//   5. atomic credit via the credit_balance() SQL function.
// Any non-200 makes Platega retry, so transient failures return 5xx and
// definitive "ignore" outcomes return 200.
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  id: z.string().min(1).max(64),
  status: z.string().min(1).max(32),
  amount: z.number().optional(),
  currency: z.string().max(8).optional(),
  payload: z.string().max(128).optional().nullable(),
});

export async function POST(req: NextRequest) {
  if (!plategaConfigured()) {
    return NextResponse.json({ error: "billing_off" }, { status: 503 });
  }
  if (
    !verifyPlategaCallback({
      merchantId: req.headers.get("x-merchantid"),
      secret: req.headers.get("x-secret"),
    })
  ) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "bad_payload" }, { status: 400 });
  }
  const { id, status, payload } = parsed.data;

  const admin = createAdminClient();
  const cols = "id, user_id, amount_cents, amount_rub, credited, provider_status";
  let { data: topup } = await admin
    .from("topups")
    .select(cols)
    .eq("provider", "platega")
    .eq("provider_txn_id", id)
    .maybeSingle();
  if (!topup && payload) {
    ({ data: topup } = await admin
      .from("topups")
      .select(cols)
      .eq("provider", "platega")
      .eq("order_id", payload)
      .maybeSingle());
  }
  if (!topup) {
    return NextResponse.json({ error: "unknown_transaction" }, { status: 404 });
  }

  // Already credited: only record a later status change (e.g. CHARGEBACKED —
  // handled manually; we never auto-debit a balance into the negative).
  if (topup.credited) {
    if (status !== "CONFIRMED" && status !== topup.provider_status) {
      await admin
        .from("topups")
        .update({ provider_status: status })
        .eq("id", topup.id);
      console.warn("[platega] status change on credited topup", topup.id, status);
    }
    return NextResponse.json({ ok: true, already: true });
  }

  if (status !== "CONFIRMED") {
    await admin
      .from("topups")
      .update({
        provider_status: status,
        status: status === "CANCELED" ? "canceled" : "pending",
        provider_txn_id: id,
      })
      .eq("id", topup.id);
    return NextResponse.json({ ok: true, ignored: true, status });
  }

  // Authoritative re-check — a forged or replayed callback can't fake this.
  const tx = await getPlategaTransaction(id);
  if (!tx) {
    // Platega unreachable: make them retry rather than dropping a real payment.
    return NextResponse.json({ error: "verify_unavailable" }, { status: 502 });
  }
  if (tx.status !== "CONFIRMED") {
    return NextResponse.json({ ok: true, ignored: true, status: tx.status });
  }
  const expectedRub = topup.amount_rub as number | null;
  const amountOk =
    expectedRub != null &&
    tx.amount != null &&
    Math.round(tx.amount * 100) === Math.round(expectedRub * 100) &&
    (tx.currency ?? "RUB").toUpperCase() === "RUB";
  if (!amountOk) {
    // Paid a different amount than we created — never credit blindly; leave
    // the row for the operator to reconcile in the admin panel / Platega.
    await admin
      .from("topups")
      .update({ provider_status: "AMOUNT_MISMATCH", provider_txn_id: id })
      .eq("id", topup.id);
    console.error("[platega] amount mismatch", topup.id, tx.amount, expectedRub);
    return NextResponse.json({ ok: true, ignored: true, reason: "amount" });
  }

  // Atomic claim: only the request that flips credited false→true credits.
  const { data: claimed } = await admin
    .from("topups")
    .update({
      credited: true,
      status: "paid",
      provider_status: "CONFIRMED",
      provider_txn_id: id,
      paid_at: new Date().toISOString(),
    })
    .eq("id", topup.id)
    .eq("credited", false)
    .select("id");
  if (!claimed || claimed.length === 0) {
    return NextResponse.json({ ok: true, already: true });
  }

  // Account deleted between checkout and payment: keep the paid record, no one
  // to credit (refund manually via Platega).
  const userId = topup.user_id as string | null;
  if (!userId) {
    console.warn("[platega] paid topup for deleted user", topup.id);
    return NextResponse.json({ ok: true, credited: 0, orphan: true });
  }

  await ensureProfile(userId);
  const { data: newBalance, error: creditErr } = await admin.rpc(
    "credit_balance",
    { p_user_id: userId, p_cents: topup.amount_cents as number }
  );
  if (creditErr || newBalance == null) {
    // Roll back the claim so Platega's retry can credit.
    await admin
      .from("topups")
      .update({ credited: false, status: "pending", paid_at: null })
      .eq("id", topup.id);
    console.error("[platega] credit failed", topup.id, creditErr);
    return NextResponse.json({ error: "credit_failed" }, { status: 500 });
  }

  await recordBalanceEvent({ userId, deltaCents: topup.amount_cents as number, kind: "topup", ref: id, note: `${expectedRub} RUB via Platega` });
  await notifyTelegram(
    `💳 Top-up paid: ${formatUsd(topup.amount_cents as number)} (${expectedRub} ₽) via Platega\n` +
      `user ${userId} · new balance ${formatUsd(newBalance as number)}`
  );

  return NextResponse.json({ ok: true, credited: topup.amount_cents });
}
