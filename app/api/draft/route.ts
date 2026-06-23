import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generateDraft } from "@/lib/anthropic";
import type { Community, ProductAnalysis, RankedCommunity } from "@/lib/types";

// POST /api/draft  Body: { runId, communityId }
// Lazily generate (or return cached) a tailored post draft for ONE community on
// a run the user owns. Only communities the user can actually see (unlocked /
// free tier) are eligible — no drafting behind the paywall.
const bodySchema = z.object({
  runId: z.string().uuid(),
  communityId: z.number().int(),
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
  const { runId, communityId } = parsed.data;

  // Load the run (RLS guarantees ownership).
  const { data: run } = await supabase
    .from("runs")
    .select("id, product_url, product_data, result")
    .eq("id", runId)
    .maybeSingle();
  if (!run) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // The community must be in this run's result and not locked.
  const ranked = (run.result ?? []) as RankedCommunity[];
  const entry = ranked.find((e) => e.community.id === communityId);
  if (!entry) {
    return NextResponse.json({ error: "not_in_run" }, { status: 400 });
  }
  if (entry.locked) {
    return NextResponse.json({ error: "locked" }, { status: 403 });
  }

  // Return a cached draft if one exists.
  const { data: cached } = await supabase
    .from("drafts")
    .select("title, body")
    .eq("run_id", runId)
    .eq("community_id", communityId)
    .maybeSingle();
  if (cached) {
    return NextResponse.json({ title: cached.title, body: cached.body, cached: true });
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

    // Cache it (best-effort — a failed cache write still returns the draft).
    await supabase.from("drafts").insert({
      run_id: runId,
      community_id: communityId,
      title: draft.title,
      body: draft.body,
    });

    return NextResponse.json({ ...draft, cached: false });
  } catch (e) {
    console.error("[draft] failed:", e);
    return NextResponse.json({ error: "draft_failed" }, { status: 502 });
  }
}
