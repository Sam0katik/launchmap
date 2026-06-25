import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminUser } from "@/lib/admins";

// POST /api/admin/test-unlock  Body: { userId, unlocked }
// Admin-only: flip all of a user's maps to unlocked (or back), so the operator
// can preview the paid "all publics + posts" experience without paying.
const schema = z.object({
  userId: z.string().uuid(),
  unlocked: z.boolean(),
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
  const { userId, unlocked } = parsed.data;

  const admin = createAdminClient();
  const { error } = await admin
    .from("runs")
    .update({ unlocked })
    .eq("user_id", userId);
  if (error) {
    console.error("[admin/test-unlock] failed:", error);
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, unlocked });
}
