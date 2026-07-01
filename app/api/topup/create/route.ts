import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cryptomusConfigured, createInvoice } from "@/lib/cryptomus";

// POST /api/topup/create  Body: { amountCents }
// Start a crypto top-up: record a pending row, create a Cryptomus invoice, and
// return its hosted-checkout URL. The webhook credits the balance once paid.
export const dynamic = "force-dynamic";

const ALLOWED = new Set([200, 500, 1000]); // $2 / $5 / $10
const bodySchema = z.object({ amountCents: z.number().int() });

export async function POST(req: NextRequest) {
  if (!cryptomusConfigured()) {
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
  const orderId = randomUUID();

  const admin = createAdminClient();
  const { error: insErr } = await admin.from("topups").insert({
    user_id: user.id,
    order_id: orderId,
    amount_cents: amountCents,
    status: "pending",
  });
  if (insErr) {
    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || req.nextUrl.origin;
  const url = await createInvoice({
    amountUsd: (amountCents / 100).toFixed(2),
    orderId,
    callbackUrl: `${origin}/api/webhooks/cryptomus`,
    returnUrl: `${origin}/profile`,
  });
  if (!url) {
    return NextResponse.json({ error: "provider_error" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, url });
}
