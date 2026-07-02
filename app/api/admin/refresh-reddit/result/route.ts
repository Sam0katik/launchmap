import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminUser } from "@/lib/admins";
import { getCommunityScanResult, apifyConfigured } from "@/lib/apify";

// POST /api/admin/refresh-reddit/result  Body: { apifyRunId }  (admin-only)
// Poll the community scan; when done, write real members / icons / scraped
// rules into the communities table (curated rules_summary is never touched —
// scraped rules land in the separate scraped_rules column).
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const bodySchema = z.object({ apifyRunId: z.string().min(1).max(64) });

export async function POST(req: NextRequest) {
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

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const result = await getCommunityScanResult(parsed.data.apifyRunId);
  if (!result) {
    return NextResponse.json({ error: "poll_failed" }, { status: 502 });
  }
  if (result.status !== "SUCCEEDED") {
    return NextResponse.json({ status: result.status });
  }

  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("communities")
    .select("id, name")
    .eq("platform", "reddit");
  const byName = new Map(
    (rows ?? []).map((r) => [
      String(r.name).replace(/^r\//i, "").trim().toLowerCase(),
      r.id as number,
    ])
  );

  let updated = 0;
  let withIcon = 0;
  let withRules = 0;
  for (const c of result.communities) {
    const id = byName.get(c.name.toLowerCase());
    if (!id) continue;
    const patch: Record<string, unknown> = {};
    if (c.members != null) patch.members = c.members;
    if (c.icon) {
      patch.icon = c.icon;
      withIcon++;
    }
    if (c.rules.length > 0) {
      patch.scraped_rules = c.rules;
      withRules++;
    }
    if (Object.keys(patch).length === 0) continue;
    const { error } = await admin.from("communities").update(patch).eq("id", id);
    if (!error) updated++;
  }

  return NextResponse.json({
    status: "SUCCEEDED",
    found: result.communities.length,
    updated,
    withIcon,
    withRules,
  });
}
