import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminUser } from "@/lib/admins";

// POST /api/admin/set-plan  Body: { userId, plan: "free" | "paid" }
// Admin-only: flip any user's plan (and unlock/relock their maps to match) so
// the operator can grant themselves Pro to test paid features without paying.
const schema = z.object({
  userId: z.string().uuid(),
  plan: z.enum(["free", "paid"]),
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
    // Hide the endpoint's existence from non-admins.
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const { userId, plan } = parsed.data;

  const admin = createAdminClient();

  const { error: pErr } = await admin
    .from("profiles")
    .upsert({ id: userId, plan }, { onConflict: "id" });
  if (pErr) {
    console.error("[admin/set-plan] profile update failed:", pErr);
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  // Keep the user's maps consistent with their plan so testing is predictable:
  // Pro unlocks every map, free relocks them.
  const { error: rErr } = await admin
    .from("runs")
    .update({ unlocked: plan === "paid" })
    .eq("user_id", userId);
  if (rErr) console.error("[admin/set-plan] runs update failed:", rErr);

  return NextResponse.json({ ok: true, plan });
}
