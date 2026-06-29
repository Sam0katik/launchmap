import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/checklist  Body: { runId, communityId, done }
// Toggle a community as "posted" in a run's launch checklist. Server-only write
// (runs no longer have a client UPDATE policy), scoped to runs the user owns.
const bodySchema = z.object({
  runId: z.string().uuid(),
  communityId: z.number().int(),
  done: z.boolean(),
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
  const { runId, communityId, done } = parsed.data;

  // Ownership + current checklist via RLS read.
  const { data: run } = await supabase
    .from("runs")
    .select("id, checklist, unlocked")
    .eq("id", runId)
    .maybeSingle();
  if (!run) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!run.unlocked) {
    return NextResponse.json({ error: "locked" }, { status: 403 });
  }

  const current: number[] = Array.isArray(run.checklist)
    ? (run.checklist as number[])
    : [];
  const set = new Set(current);
  if (done) set.add(communityId);
  else set.delete(communityId);
  const next = Array.from(set);

  const admin = createAdminClient();
  const { error } = await admin
    .from("runs")
    .update({ checklist: next })
    .eq("id", runId);
  if (error) {
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, checklist: next });
}
