import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getRedditSearchResult,
  apifyConfigured,
  buildSearchTerms,
  rankThreads,
} from "@/lib/apify";
import type { ProductAnalysis } from "@/lib/types";

// POST /api/opportunities/result  Body: { runId, apifyRunId }
// Poll an Apify run. While RUNNING, returns status. On SUCCEEDED, caches the
// parsed threads on the run and returns them. Owner-scoped.
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  runId: z.string().uuid(),
  apifyRunId: z.string().min(1).max(64),
});

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
  const { runId, apifyRunId } = parsed.data;

  // Ownership check via RLS (product_data feeds the quality ranking).
  const { data: run } = await supabase
    .from("runs")
    .select("id, product_data")
    .eq("id", runId)
    .maybeSingle();
  if (!run) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const result = await getRedditSearchResult(apifyRunId);
  if (!result) {
    return NextResponse.json({ error: "poll_failed" }, { status: 502 });
  }

  let threads = result.threads;
  if (result.status === "SUCCEEDED") {
    // Dedupe bot cross-posts, drop promo spam, keep the ~10 most engageable.
    const terms = buildSearchTerms(run.product_data as ProductAnalysis | null);
    threads = rankThreads(threads, terms, 10);

    // Cache on the run so we don't re-run the paid actor on every visit.
    const admin = createAdminClient();
    await admin
      .from("runs")
      .update({
        opportunities: threads,
        opportunities_at: new Date().toISOString(),
      })
      .eq("id", runId);
  }

  return NextResponse.json({ status: result.status, threads });
}
