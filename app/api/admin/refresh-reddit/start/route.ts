import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminUser } from "@/lib/admins";
import { startCommunityScan, apifyConfigured } from "@/lib/apify";

// POST /api/admin/refresh-reddit/start  (admin-only)
// Kick off ONE Apify actor run over every reddit community in the DB. The
// client polls /result, which writes real members/icons/rules back to the DB.
export const dynamic = "force-dynamic";

export async function POST() {
  if (!apifyConfigured()) {
    return NextResponse.json({ error: "apify_off" }, { status: 503 });
  }

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

  const admin = createAdminClient();
  const { data: rows, error } = await admin
    .from("communities")
    .select("name")
    .eq("platform", "reddit");
  if (error) {
    return NextResponse.json({ error: "db_read_failed" }, { status: 500 });
  }
  const subs = (rows ?? [])
    .map((r) => String(r.name).replace(/^r\//i, "").trim())
    .filter(Boolean);
  if (subs.length === 0) {
    return NextResponse.json({ error: "no_communities" }, { status: 422 });
  }

  const started = await startCommunityScan(subs);
  if ("error" in started) {
    return NextResponse.json(
      { error: "start_failed", detail: started.error },
      { status: 502 }
    );
  }
  return NextResponse.json({ ok: true, apifyRunId: started.runId, total: subs.length });
}
