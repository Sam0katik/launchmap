import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureProfile } from "@/lib/profile";
import { isAdminUser, githubLogin } from "@/lib/admins";
import { recordBalanceEvent } from "@/lib/ledger";
import { notifyTelegram } from "@/lib/telegram";
import { formatUsd } from "@/lib/billing";

// POST /api/admin/topup  Body: { userId, amountCents }
// Admin-only: add to a user's internal balance. Used to grant test credit while
// a real top-up payment provider isn't connected yet.
const schema = z.object({
  userId: z.string().uuid(),
  amountCents: z.number().int().positive().max(1_000_00),
});

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }
  if (
    !isAdminUser(user)
  ) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const { userId, amountCents } = parsed.data;

  // Guarantee the target profile exists so the credit can't hit 0 rows and
  // silently grant nothing.
  await ensureProfile(userId);

  const admin = createAdminClient();
  const { data: balance, error } = await admin.rpc("credit_balance", {
    p_user_id: userId,
    p_cents: amountCents,
  });
  if (error || balance == null) {
    return NextResponse.json({ error: "topup_failed" }, { status: 500 });
  }
  await recordBalanceEvent({ userId, deltaCents: amountCents, kind: "admin_credit", note: `by ${githubLogin(user) ?? user.email ?? user.id}` });
  await notifyTelegram(
    `🛠 Admin credit ${formatUsd(amountCents)} → user ${userId}\nnew balance ${formatUsd(balance as number)} (test credit, not revenue)`
  );
  return NextResponse.json({ ok: true, balanceCents: balance });
}
