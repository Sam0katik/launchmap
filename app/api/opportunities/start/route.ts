import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { startRedditSearch, apifyConfigured } from "@/lib/apify";
import type { ProductAnalysis } from "@/lib/types";

// POST /api/opportunities/start  Body: { runId }
// Kick off an Apify search for recent Reddit threads matching the product's
// keywords. Returns the Apify run id to poll. Owner-scoped.
export const dynamic = "force-dynamic";

const bodySchema = z.object({ runId: z.string().uuid() });

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

  // Ownership + keywords via RLS read.
  const { data: run } = await supabase
    .from("runs")
    .select("id, product_data, unlocked")
    .eq("id", parsed.data.runId)
    .maybeSingle();
  if (!run) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  // Paid feature — only unlocked maps can spend an actor run.
  if (!run.unlocked) {
    return NextResponse.json({ error: "locked" }, { status: 403 });
  }

  const analysis = run.product_data as ProductAnalysis | null;
  // Build the per-product search terms from its niche tags (each term is a
  // separate Reddit search; results are combined). Hyphens → spaces so tags
  // like "product-launch" read as a natural query. Fall back to the category.
  const clean = (s: string) => s.replace(/[-_]+/g, " ").trim();
  let terms = (analysis?.niche_tags ?? [])
    .filter(Boolean)
    .slice(0, 3)
    .map(clean)
    .filter((t) => t.length > 1);
  if (terms.length === 0 && analysis?.category) {
    terms = [clean(analysis.category)];
  }
  if (terms.length === 0) {
    return NextResponse.json({ error: "no_keywords" }, { status: 422 });
  }

  const started = await startRedditSearch(terms);
  if ("error" in started) {
    return NextResponse.json(
      { error: "start_failed", detail: started.error },
      { status: 502 }
    );
  }
  return NextResponse.json({ ok: true, apifyRunId: started.runId, terms });
}
