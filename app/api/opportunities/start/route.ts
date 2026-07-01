import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  startRedditSearch,
  apifyConfigured,
  buildSearchTerms,
} from "@/lib/apify";
import { THREAD_SEARCH_PRICE_CENTS } from "@/lib/billing";
import type { ProductAnalysis } from "@/lib/types";

// POST /api/opportunities/start  Body: { runId }
// Kick off an Apify search for recent Reddit threads matching the product's
// keywords. Owner-scoped, unlocked maps only, and each search charges
// THREAD_SEARCH_PRICE_CENTS from the internal balance (covers the actor cost).
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
  const terms = buildSearchTerms(analysis);
  if (terms.length === 0) {
    return NextResponse.json({ error: "no_keywords" }, { status: 422 });
  }

  // Charge per search (compare-and-swap, same pattern as unlock; one retry on
  // a concurrent balance change).
  const admin = createAdminClient();
  let charged = false;
  let balance = 0;
  for (let attempt = 0; attempt < 2 && !charged; attempt++) {
    const { data: profile } = await admin
      .from("profiles")
      .select("balance_cents")
      .eq("id", user.id)
      .maybeSingle();
    balance = (profile?.balance_cents as number) ?? 0;
    if (balance < THREAD_SEARCH_PRICE_CENTS) {
      return NextResponse.json(
        { error: "insufficient", balanceCents: balance },
        { status: 402 }
      );
    }
    const { data: ok } = await admin
      .from("profiles")
      .update({ balance_cents: balance - THREAD_SEARCH_PRICE_CENTS })
      .eq("id", user.id)
      .eq("balance_cents", balance)
      .select("id");
    charged = !!ok && ok.length > 0;
  }
  if (!charged) {
    return NextResponse.json({ error: "conflict" }, { status: 409 });
  }

  const started = await startRedditSearch(terms);
  if ("error" in started) {
    // Refund — the search never started.
    await admin
      .from("profiles")
      .update({ balance_cents: balance })
      .eq("id", user.id);
    return NextResponse.json(
      { error: "start_failed", detail: started.error },
      { status: 502 }
    );
  }
  return NextResponse.json({ ok: true, apifyRunId: started.runId, terms });
}
