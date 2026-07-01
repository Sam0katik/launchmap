import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchUserKarma } from "@/lib/reddit";

// GET /api/reddit/karma?u=<username>  (signed-in only)
// Returns a Reddit user's public karma + account age, so a maker can gauge
// whether their account will clear subs' spam filters before they post.
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }

  const name = (req.nextUrl.searchParams.get("u") ?? "").trim();
  if (!name || name.length > 40 || !/^[\w-]+$/.test(name.replace(/^u\//i, ""))) {
    return NextResponse.json({ error: "invalid_username" }, { status: 400 });
  }

  let karma;
  try {
    karma = await fetchUserKarma(name);
  } catch {
    // Relay/transport failure — distinct from "no such user".
    return NextResponse.json({ error: "reddit_unreachable" }, { status: 502 });
  }
  if (!karma) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, karma });
}
