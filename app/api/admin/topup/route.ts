import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminUser } from "@/lib/admins";

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
    !isAdminUser({
      email: user.email,
      username: user.user_metadata?.user_name as string,
    })
  ) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const { userId, amountCents } = parsed.data;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("balance_cents")
    .eq("id", userId)
    .maybeSingle();
  const balance = (profile?.balance_cents as number) ?? 0;

  const { error } = await admin
    .from("profiles")
    .update({ balance_cents: balance + amountCents })
    .eq("id", userId);
  if (error) {
    return NextResponse.json({ error: "topup_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, balanceCents: balance + amountCents });
}
