import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/runs/delete  Body: { runId }
// Delete one of the signed-in user's launch maps. Frees an account slot and
// cascades its saved drafts (drafts.run_id has on delete cascade). We verify
// ownership with the user's RLS-scoped client, then delete with the service
// role (the runs table has no DELETE RLS policy).
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

  // Ownership check via RLS (a user can only select their own runs).
  const { data: run } = await supabase
    .from("runs")
    .select("id")
    .eq("id", runId)
    .maybeSingle();
  if (!run) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("runs").delete().eq("id", runId);
  if (error) {
    console.error("[runs/delete] failed:", error);
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
