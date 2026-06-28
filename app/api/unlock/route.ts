import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminUser } from "@/lib/admins";
import { UNLOCK_PRICE_CENTS } from "@/lib/billing";

// POST /api/unlock  Body: { runId }
// Unlock one of the user's maps (all publics + briefs) by spending the internal
// USD balance. Admins unlock free (for testing). All balance/unlock writes go
// through the service role — clients can't edit their own balance.
const bodySchema = z.object({ runId: z.string().uuid() });

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const { runId } = parsed.data;

  // Ownership via RLS (a user only sees their own runs).
  const { data: run } = await supabase
    .from("runs")
    .select("id, unlocked")
    .eq("id", runId)
    .maybeSingle();
  if (!run) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const admin = createAdminClient();

  if (run.unlocked) {
    return NextResponse.json({ ok: true, already: true });
  }

  // Admins unlock free.
  if (
    isAdminUser({
      email: user.email,
      username: user.user_metadata?.user_name as string,
    })
  ) {
    const { error } = await admin
      .from("runs")
      .update({ unlocked: true })
      .eq("id", runId);
    if (error) {
      return NextResponse.json({ error: "unlock_failed" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, admin: true });
  }

  // Balance flow: charge UNLOCK_PRICE_CENTS, then unlock (refund on failure).
  const { data: profile } = await admin
    .from("profiles")
    .select("balance_cents")
    .eq("id", user.id)
    .maybeSingle();
  const balance = (profile?.balance_cents as number) ?? 0;

  if (balance < UNLOCK_PRICE_CENTS) {
    return NextResponse.json(
      { error: "insufficient", balanceCents: balance },
      { status: 402 }
    );
  }

  const next = balance - UNLOCK_PRICE_CENTS;
  const { error: chargeErr } = await admin
    .from("profiles")
    .update({ balance_cents: next })
    .eq("id", user.id);
  if (chargeErr) {
    return NextResponse.json({ error: "charge_failed" }, { status: 500 });
  }

  const { error: unlockErr } = await admin
    .from("runs")
    .update({ unlocked: true })
    .eq("id", runId);
  if (unlockErr) {
    // refund
    await admin.from("profiles").update({ balance_cents: balance }).eq("id", user.id);
    return NextResponse.json({ error: "unlock_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, balanceCents: next });
}
