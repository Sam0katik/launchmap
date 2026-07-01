import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminUser } from "@/lib/admins";
import { fetchSubAbout } from "@/lib/reddit";

// POST /api/admin/refresh-reddit  (admin-only)
// Pulls REAL data from Reddit's public about.json for every reddit community and
// writes it to the DB: subscriber count (members) + community icon. Routed
// through a relay (see lib/reddit.ts) because Reddit blocks Vercel's IPs.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CHUNK = 4;

export async function POST() {
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
  const { data: communities, error } = await admin
    .from("communities")
    .select("id, name")
    .eq("platform", "reddit");
  if (error) {
    return NextResponse.json({ error: "db_read_failed" }, { status: 500 });
  }

  let updated = 0;
  let withIcon = 0;
  const failed: string[] = [];
  const rows = communities ?? [];

  for (let i = 0; i < rows.length; i += CHUNK) {
    const batch = rows.slice(i, i + CHUNK);
    await Promise.all(
      batch.map(async (row) => {
        const sub = String(row.name).replace(/^r\//i, "").trim();
        try {
          const info = await fetchSubAbout(sub);
          if (!info) {
            failed.push(`${row.name}: no data (blocked/relay)`);
            return;
          }
          const patch: Record<string, unknown> = {};
          if (info.subscribers != null) patch.members = info.subscribers;
          if (info.icon) {
            patch.icon = info.icon;
            withIcon++;
          }
          if (Object.keys(patch).length === 0) {
            failed.push(`${row.name}: empty`);
            return;
          }
          const { error: upErr } = await admin
            .from("communities")
            .update(patch)
            .eq("id", row.id);
          if (upErr) failed.push(`${row.name}: write`);
          else updated++;
        } catch {
          failed.push(`${row.name}: error`);
        }
      })
    );
  }

  return NextResponse.json({
    ok: true,
    total: rows.length,
    updated,
    withIcon,
    // A couple of sample failures so we can diagnose (blocked vs empty vs write).
    sample: failed.slice(0, 3),
    failedCount: failed.length,
  });
}
