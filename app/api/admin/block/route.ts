import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureProfile } from "@/lib/profile";
import { isAdminUser } from "@/lib/admins";

// POST /api/admin/block  Body: { userId, blocked }
// Admin-only: block (or unblock) a user. Blocked users keep read access but
// every action route refuses them (lib/auth.ts). Admins can't block themselves.
const schema = z.object({ userId: z.string().uuid(), blocked: z.boolean() });

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }
  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const { userId, blocked } = parsed.data;
  if (userId === user.id) {
    return NextResponse.json({ error: "cannot_block_self" }, { status: 400 });
  }

  await ensureProfile(userId);
  const { error } = await createAdminClient()
    .from("profiles")
    .update({ blocked, blocked_at: blocked ? new Date().toISOString() : null })
    .eq("id", userId);
  if (error) {
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, blocked });
}
