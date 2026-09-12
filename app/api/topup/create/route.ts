import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureProfileForUser } from "@/lib/profile";
import {
  plategaConfigured,
  createPlategaPayment,
  usdCentsToRub,
} from "@/lib/platega";

// POST /api/topup/create  Body: { amountCents }
// Start a balance top-up: record a pending `topups` row, create a Platega
// transaction for the RUB equivalent, and return its hosted-checkout URL. The
// Platega callback (webhooks/platega) credits the USD balance once paid.
export const dynamic = "force-dynamic";

const ALLOWED = new Set([200, 500, 1000]); // $2 / $5 / $10
const bodySchema = z.object({ amountCents: z.number().int() });

export async function POST(req: NextRequest) {
  if (!plategaConfigured()) {
    return NextResponse.json({ error: "billing_off" }, { status: 503 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || !ALLOWED.has(parsed.data.amountCents)) {
    return NextResponse.json({ error: "invalid_amount" }, { status: 400 });
  }
  const amountCents = parsed.data.amountCents;
  const amountRub = usdCentsToRub(amountCents);
  const orderId = randomUUID();

  // Guarantee the profile row exists now so the callback always has a row to
  // credit once payment completes — otherwise money could be paid and lost.
  await ensureProfileForUser(user);

  const admin = createAdminClient();
  const { data: row, error: insErr } = await admin
    .from("topups")
    .insert({
      user_id: user.id,
      order_id: orderId,
      amount_cents: amountCents,
      amount_rub: amountRub,
      currency: "RUB",
      provider: "platega",
      status: "pending",
    })
    .select("id")
    .single();
  if (insErr || !row) {
    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || req.nextUrl.origin;

  const created = await createPlategaPayment({
    amountRub,
    orderId,
    description: `ZeroFans balance top-up $${(amountCents / 100).toFixed(0)}`,
    returnUrl: `${origin}/profile?topup=success`,
    failedUrl: `${origin}/profile?topup=failed`,
  });
  if ("error" in created) {
    await admin
      .from("topups")
      .update({ status: "failed", provider_status: created.error.slice(0, 120) })
      .eq("id", row.id);
    console.error("[topup] platega create failed:", created.error);
    return NextResponse.json({ error: "provider_error" }, { status: 502 });
  }

  // Remember the provider's id — the callback is matched on it first.
  await admin
    .from("topups")
    .update({ provider_txn_id: created.transactionId, provider_status: "PENDING" })
    .eq("id", row.id);

  return NextResponse.json({ ok: true, url: created.url, amountRub });
}
