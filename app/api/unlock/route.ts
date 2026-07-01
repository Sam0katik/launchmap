import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { UNLOCK_PRICE_CENTS } from "@/lib/billing";

// POST /api/unlock  Body: { runId }
// Unlock one of the user's maps (all publics + briefs) by spending the internal
// USD balance — $3 is deducted, same for everyone (admins top up via the admin
// panel and spend like anyone else). All balance/unlock writes go through the
// service role — clients can't edit their own balance.
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

  // Compare-and-swap: only deduct if the balance is still exactly what we read.
  // This closes a concurrency hole where two simultaneous unlocks could both
  // read $3 and each unlock a different map for a single charge. If another
  // request won the race, `data` comes back empty and we bail (client retries).
  const next = balance - UNLOCK_PRICE_CENTS;
  const { data: charged, error: chargeErr } = await admin
    .from("profiles")
    .update({ balance_cents: next })
    .eq("id", user.id)
    .eq("balance_cents", balance)
    .select("id");
  if (chargeErr) {
    return NextResponse.json({ error: "charge_failed" }, { status: 500 });
  }
  if (!charged || charged.length === 0) {
    // Lost the race — balance changed under us. Safe to retry.
    return NextResponse.json({ error: "conflict" }, { status: 409 });
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
