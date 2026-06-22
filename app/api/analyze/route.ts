import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { analyzeProduct } from "@/lib/anthropic";
import { rankCommunities } from "@/lib/matching";
import type { Community } from "@/lib/types";

// POST /api/analyze
// Body: { url, description? }
// Flow: auth → rate-limit + URL cache → fetch landing → Haiku analysis →
//       tag match + rank → persist run → return map.
//
// Drafts are NOT generated here (lazy generation happens per-unlocked-card via
// a separate route). See DEVELOPMENT_PLAN.md §Draft generation.

const bodySchema = z.object({
  url: z.string().url(),
  description: z.string().max(280).optional(),
});

const FREE_RUNS_PER_DAY = Number(process.env.FREE_RUNS_PER_DAY ?? 5);
const URL_CACHE_HOURS = Number(process.env.URL_CACHE_HOURS ?? 24);

export async function POST(req: NextRequest) {
  const supabase = createClient();

  // 1. Auth — runs require a signed-in user (GitHub OAuth).
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }

  // 2. Validate input.
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const { url, description } = parsed.data;

  // 3. URL cache — return an existing recent run for the same URL, no AI spend.
  const cacheSince = new Date(
    Date.now() - URL_CACHE_HOURS * 3600_000
  ).toISOString();
  const { data: cached } = await supabase
    .from("runs")
    .select("id, result, product_data")
    .eq("user_id", user.id)
    .eq("product_url", url)
    .gte("created_at", cacheSince)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (cached) {
    return NextResponse.json({ runId: cached.id, cached: true });
  }

  // 4. Daily rate limit.
  const daySince = new Date(Date.now() - 24 * 3600_000).toISOString();
  const { count } = await supabase
    .from("runs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", daySince);
  if ((count ?? 0) >= FREE_RUNS_PER_DAY) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  try {
    // 5. Fetch landing page text (best-effort; falls back to description).
    const landingText = await fetchLandingText(url);

    // 6. Analyze with Haiku.
    const analysis = await analyzeProduct(landingText, description);
    if (analysis.niche_tags.length === 0 && !analysis.product_summary) {
      return NextResponse.json({ error: "empty_landing" }, { status: 422 });
    }

    // 7. Match + rank against the curated catalog.
    const { data: communities } = await supabase.from("communities").select("*");
    const ranked = rankCommunities(
      analysis,
      (communities ?? []) as Community[],
      false // new run starts locked (free tier)
    );

    // 8. Persist the run.
    const { data: run, error } = await supabase
      .from("runs")
      .insert({
        user_id: user.id,
        product_url: url,
        product_data: analysis,
        result: ranked,
        unlocked: false,
      })
      .select("id")
      .single();

    if (error || !run) {
      return NextResponse.json({ error: "persist_failed" }, { status: 500 });
    }

    return NextResponse.json({ runId: run.id, cached: false });
  } catch (e) {
    console.error("[analyze] failed:", e);
    return NextResponse.json({ error: "analysis_failed" }, { status: 502 });
  }
}

/** Fetch a landing page and crudely strip it to text. Never throws. */
async function fetchLandingText(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { "user-agent": "LaunchMapBot/0.1 (+https://launchmap.app)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return "";
    const html = await res.text();
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 8000);
  } catch {
    return "";
  }
}
