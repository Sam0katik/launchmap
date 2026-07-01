import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getUserScrapeResult, apifyConfigured } from "@/lib/apify";

// POST /api/reddit/karma/result  Body: { apifyRunId }
// Poll the user-profile scrape; when done, return the parsed karma.
export const dynamic = "force-dynamic";

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

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const result = await getUserScrapeResult(parsed.data.apifyRunId);
  if (!result) {
    return NextResponse.json({ error: "poll_failed" }, { status: 502 });
  }
  if (result.status !== "SUCCEEDED") {
    return NextResponse.json({ status: result.status });
  }
  if (!result.user) {
    return NextResponse.json({ status: "SUCCEEDED", karma: null });
  }
  return NextResponse.json({ status: "SUCCEEDED", karma: result.user });
}
