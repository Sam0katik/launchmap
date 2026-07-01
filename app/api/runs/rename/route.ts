import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/runs/rename  Body: { runId, title }
// Set a custom display name for one of the signed-in user's maps. Empty title
// clears it (falls back to the URL-derived name). Ownership is checked with the
// user's RLS-scoped client, then written with the service role.
const bodySchema = z.object({
  runId: z.string().uuid(),
  title: z.string().max(60),
});

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
  const title = parsed.data.title.trim();

  // Ownership check via RLS (a user only sees their own runs).
  const { data: run } = await supabase
    .from("runs")
    .select("id")
    .eq("id", runId)
    .maybeSingle();
  if (!run) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("runs")
    .update({ title: title === "" ? null : title })
    .eq("id", runId);
  if (error) {
    return NextResponse.json({ error: "rename_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, title: title || null });
}
