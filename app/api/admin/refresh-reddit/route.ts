import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminUser } from "@/lib/admins";
import { fetchSubAbout } from "@/lib/reddit";

// POST /api/admin/refresh-reddit?offset=0  (admin-only)
// Pulls real subscriber counts + icons from Reddit (via Apify proxy) into the
// communities table. Processed in small batches so each request stays under the
// serverless time limit (Vercel Hobby caps at ~10s) — the client loops through
// the offsets. Apify-only (skips the slow public relays) to keep it fast.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const LIMIT = 5;

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

  const offset = Math.max(0, Number(req.nextUrl.searchParams.get("offset") ?? 0));

  const admin = createAdminClient();
  const { data: rows, count } = await admin
    .from("communities")
    .select("id, name", { count: "exact" })
    .eq("platform", "reddit")
    .order("id")
    .range(offset, offset + LIMIT - 1);

  const total = count ?? 0;
  let updated = 0;
  let withIcon = 0;
  const failed: string[] = [];

  await Promise.all(
    (rows ?? []).map(async (row) => {
      const sub = String(row.name).replace(/^r\//i, "").trim();
      try {
        const info = await fetchSubAbout(sub, true); // apify-only, fast
        if (!info) {
          failed.push(`${row.name}: empty`);
          return;
        }
        const patch: Record<string, unknown> = {};
        if (info.subscribers != null) patch.members = info.subscribers;
        if (info.icon) {
          patch.icon = info.icon;
          withIcon++;
        }
        if (Object.keys(patch).length === 0) {
          failed.push(`${row.name}: no fields`);
          return;
        }
        const { error } = await admin
          .from("communities")
          .update(patch)
          .eq("id", row.id);
        if (error) failed.push(`${row.name}: write`);
        else updated++;
      } catch {
        failed.push(`${row.name}: proxy failed`);
      }
    })
  );

  const nextOffset = offset + LIMIT;
  return NextResponse.json({
    ok: true,
    total,
    updated,
    withIcon,
    failedCount: failed.length,
    sample: failed.slice(0, 2),
    nextOffset,
    done: nextOffset >= total,
  });
}
