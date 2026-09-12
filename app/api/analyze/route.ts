import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getActionUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { analyzeProduct } from "@/lib/anthropic";
import { fetchLandingContent, isSafePublicUrl } from "@/lib/landing";
import { withinDailyBudget, ANALYZE_GLOBAL_PER_DAY } from "@/lib/budget";
import { rankCommunities } from "@/lib/matching";
import { MAX_MAPS_PER_ACCOUNT } from "@/lib/billing";
import type { Community } from "@/lib/types";

// Daily analyses per account. The 2-map cap alone is bypassable via a
// delete→create loop, which would burn unbounded AI + fetch budget.
const MAX_ANALYZES_PER_DAY = 15;

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

const URL_CACHE_HOURS = Number(process.env.URL_CACHE_HOURS ?? 24);

// Landing fetch + optional same-origin crawl + Haiku can exceed the 10s default.
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const supabase = createClient();

  // 1. Auth — runs require a signed-in user (GitHub OAuth).
  const { user, blocked } = await getActionUser();
  if (!user) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }
  if (blocked) {
    return NextResponse.json({ error: "blocked" }, { status: 403 });
  }

  // 2. Validate input.
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const { url, description } = parsed.data;

  // SSRF guard: we fetch this URL server-side, so refuse anything that points at
  // localhost, link-local (cloud metadata) or private network ranges, and only
  // allow http(s). Stops a submitted URL from reading internal services.
  if (!isSafePublicUrl(url)) {
    return NextResponse.json({ error: "invalid_url" }, { status: 400 });
  }

  // 3. URL cache — return an existing recent run for the same URL, no AI spend.
  const cacheSince = new Date(
    Date.now() - URL_CACHE_HOURS * 3600_000
  ).toISOString();
  const { data: cached } = await supabase
    .from("runs")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_url", url)
    .gte("created_at", cacheSince)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (cached) {
    return NextResponse.json({ runId: cached.id, cached: true });
  }

  // 4. Account cap — a user keeps at most MAX_MAPS_PER_ACCOUNT maps at once.
  // The analysis itself is free; deleting a map frees a slot.
  const { count } = await supabase
    .from("runs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  if ((count ?? 0) >= MAX_MAPS_PER_ACCOUNT) {
    return NextResponse.json({ error: "map_limit" }, { status: 429 });
  }

  // Distinguish "AI key not set in this environment" from a real API failure.
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ai_not_configured" }, { status: 503 });
  }

  // 4b. Daily analyze limit (counted only for real AI runs — cache hits above
  // don't reach here). Server-role read/write; resets when the date rolls.
  const admin = createAdminClient();
  const { data: prof } = await admin
    .from("profiles")
    .select("analyze_count, analyze_date")
    .eq("id", user.id)
    .maybeSingle();
  const today = new Date().toISOString().slice(0, 10);
  const sameDay = (prof?.analyze_date as string) === today;
  const used = sameDay ? ((prof?.analyze_count as number) ?? 0) : 0;
  if (used >= MAX_ANALYZES_PER_DAY) {
    return NextResponse.json({ error: "daily_limit" }, { status: 429 });
  }
  // 4c. Global daily budget (accounts are free, so per-account caps alone
  //     can't protect the Anthropic bill from account farming).
  if (!(await withinDailyBudget("analyze", ANALYZE_GLOBAL_PER_DAY))) {
    return NextResponse.json({ error: "daily_limit" }, { status: 429 });
  }
  await admin
    .from("profiles")
    .update({ analyze_count: used + 1, analyze_date: today })
    .eq("id", user.id);

  try {
    // 5. Fetch landing page content (meta + text; thin pages get up to a few
    //    same-origin pages crawled too). Best-effort; falls back to description.
    const landing = await fetchLandingContent(url);
    const landingText = landing.text;

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
      false // basic analysis: top publics free, rest unlock with the $2 payment
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
