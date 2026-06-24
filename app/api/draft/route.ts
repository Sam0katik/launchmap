import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generateDraft } from "@/lib/anthropic";
import { MAX_DRAFT_REGENS } from "@/lib/billing";
import type { Community, ProductAnalysis, RankedCommunity } from "@/lib/types";

// POST /api/draft  Body: { runId, communityId, regenerate? }
// Lazily generate (or return cached) a tailored post draft for ONE community on
// a run the user owns. The draft is saved on the run (drafts table) so it is
// re-shown for free on every return. Regeneration rewrites it, but is capped at
// MAX_DRAFT_REGENS to bound Anthropic spend.
const bodySchema = z.object({
  runId: z.string().uuid(),
  communityId: z.number().int(),
  regenerate: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
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
  const { runId, communityId, regenerate } = parsed.data;

  // Load the run (RLS guarantees ownership).
  const { data: run } = await supabase
    .from("runs")
    .select("id, product_url, product_data, result, unlocked")
    .eq("id", runId)
    .maybeSingle();
  if (!run) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // The community must be in this run's result and visible to the user (either
  // in the free tier or because the whole run is unlocked / Pro).
  const ranked = (run.result ?? []) as RankedCommunity[];
  const entry = ranked.find((e) => e.community.id === communityId);
  if (!entry) {
    return NextResponse.json({ error: "not_in_run" }, { status: 400 });
  }
  if (entry.locked && !run.unlocked) {
    return NextResponse.json({ error: "locked" }, { status: 403 });
  }

  // Existing saved draft (if any), with its regeneration count.
  // select("*") so a pre-0005 schema (no regen_count yet) still returns the
  // draft instead of erroring; regen_count then reads as undefined → 0.
  const { data: cached } = await supabase
    .from("drafts")
    .select("*")
    .eq("run_id", runId)
    .eq("community_id", communityId)
    .maybeSingle();

  const regenCount = (cached?.regen_count as number) ?? 0;

  // No regenerate requested → just hand back the saved draft (no API spend).
  if (cached && !regenerate) {
    return NextResponse.json({
      title: cached.title,
      body: cached.body,
      regenLeft: Math.max(0, MAX_DRAFT_REGENS - regenCount),
      cached: true,
    });
  }

  // Regenerate requested but the cap is reached → refuse, keep the old draft.
  if (cached && regenerate && regenCount >= MAX_DRAFT_REGENS) {
    return NextResponse.json({
      error: "regen_limit",
      title: cached.title,
      body: cached.body,
      regenLeft: 0,
    });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ai_not_configured" }, { status: 503 });
  }

  try {
    const draft = await generateDraft(
      run.product_data as ProductAnalysis,
      entry.community as Community,
      run.product_url
    );
    if (!draft.title && !draft.body) {
      return NextResponse.json({ error: "empty_draft" }, { status: 502 });
    }

    if (cached) {
      // Regeneration: overwrite and bump the counter.
      const nextCount = regenCount + 1;
      const { error } = await supabase
        .from("drafts")
        .update({ title: draft.title, body: draft.body, regen_count: nextCount })
        .eq("run_id", runId)
        .eq("community_id", communityId);
      if (error) console.error("[draft] update failed:", error);
      return NextResponse.json({
        ...draft,
        regenLeft: Math.max(0, MAX_DRAFT_REGENS - nextCount),
        cached: false,
      });
    }

    // First generation: save it. Surface a write failure so a broken/missing
    // table or RLS policy doesn't silently look like "drafts don't save".
    const { error } = await supabase.from("drafts").insert({
      run_id: runId,
      community_id: communityId,
      title: draft.title,
      body: draft.body,
      regen_count: 0,
    });
    if (error) console.error("[draft] insert failed:", error);
    return NextResponse.json({
      ...draft,
      regenLeft: MAX_DRAFT_REGENS,
      cached: false,
    });
  } catch (e) {
    console.error("[draft] failed:", e);
    return NextResponse.json({ error: "draft_failed" }, { status: 502 });
  }
}
