import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/account/delete
// Permanently deletes the signed-in user's auth account. The `runs` and
// `profiles` rows are removed automatically by `on delete cascade` foreign
// keys (see migrations 0001/0002). Irreversible.
export async function POST() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) {
      console.error("[account/delete] failed:", error);
      return NextResponse.json({ error: "delete_failed" }, { status: 500 });
    }
    // Drop the local session cookie so the browser isn't left half-authed.
    await supabase.auth.signOut();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[account/delete] error:", e);
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }
}
