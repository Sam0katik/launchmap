import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminUser } from "@/lib/admins";

// POST /api/admin/refresh-reddit  (admin-only)
// Pulls REAL data from Reddit's public about.json for every reddit community and
// writes it straight to the DB: subscriber count (members) + community icon.
// No API app / OAuth needed — about.json is anonymous read. This runs on the
// server (Vercel), so it works even when you can't run the local script.
//
// Serverless time budget: fetch in small concurrent chunks, no artificial
// sleeps, so ~35 subs finish in a few seconds.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const UA = "launchmap-refresh/1.0 (public read-only)";
const CHUNK = 5;

function cleanIcon(raw: unknown): string | null {
  if (!raw || typeof raw !== "string") return null;
  const url = raw
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
  return url.startsWith("http") ? url : null;
}

async function fetchAbout(sub: string) {
  const res = await fetch(`https://www.reddit.com/r/${sub}/about.json`, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return { ok: false as const, status: res.status };
  const d = ((await res.json()) as { data?: Record<string, unknown> })?.data ?? {};
  return {
    ok: true as const,
    subscribers: typeof d.subscribers === "number" ? d.subscribers : null,
    icon: cleanIcon(d.community_icon) || cleanIcon(d.icon_img),
  };
}

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
          const info = await fetchAbout(sub);
          if (!info.ok) {
            failed.push(`${row.name} (${info.status})`);
            return;
          }
          const patch: Record<string, unknown> = {};
          if (info.subscribers != null) patch.members = info.subscribers;
          if (info.icon) {
            patch.icon = info.icon;
            withIcon++;
          }
          if (Object.keys(patch).length === 0) return;
          const { error: upErr } = await admin
            .from("communities")
            .update(patch)
            .eq("id", row.id);
          if (upErr) failed.push(`${row.name} (write)`);
          else updated++;
        } catch {
          failed.push(`${row.name} (timeout)`);
        }
      })
    );
  }

  return NextResponse.json({
    ok: true,
    total: rows.length,
    updated,
    withIcon,
    failed,
  });
}
