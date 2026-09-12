import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureProfileForUser } from "@/lib/profile";
import {
  startRedditSearch,
  startSubredditsScrape,
  apifyConfigured,
  buildSearchTerms,
  mapRedditSubs,
} from "@/lib/apify";
import { THREAD_SEARCH_PRICE_CENTS } from "@/lib/billing";
import { withinDailyBudget, APIFY_GLOBAL_PER_DAY } from "@/lib/budget";
import type { ProductAnalysis } from "@/lib/types";

// POST /api/opportunities/start  Body: { runId }
// Kick off an Apify search for recent Reddit threads matching the product's
// keywords. Owner-scoped, unlocked maps only, and each search charges
// THREAD_SEARCH_PRICE_CENTS from the internal balance (covers the actor cost).
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  runId: z.string().uuid(),
  // What the client believes: true = it showed the "free" button. If the free
  // search is already used up, we refuse instead of silently charging $0.50.
  expectFree: z.boolean().optional(),
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

  // Guarantee a profile row exists before any balance op.
  await ensureProfileForUser(user);

  // Ownership via RLS read; `result`/`opportunities` are server-only columns
  // (migration 0016), so read them with the service role afterwards.
  const { data: own } = await supabase
    .from("runs")
    .select("id")
    .eq("id", parsed.data.runId)
    .maybeSingle();
  if (!own) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const admin = createAdminClient();
  const { data: run } = await admin
    .from("runs")
    .select("id, product_data, result, unlocked, opportunities")
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

  // The FIRST search on a map is free (included in the unlock); refreshes
  // charge THREAD_SEARCH_PRICE_CENTS (CAS, same pattern as unlock).
  const isFirstSearch = run.opportunities == null;
  if (parsed.data.expectFree && !isFirstSearch) {
    return NextResponse.json({ error: "not_free" }, { status: 409 });
  }
  let charged = false;
  let balance = 0;
  if (!isFirstSearch) {
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
  }

  // Global Apify budget (accounts are free; see lib/budget.ts).
  if (!(await withinDailyBudget("apify", APIFY_GLOBAL_PER_DAY))) {
    if (charged) {
      await admin.rpc("credit_balance", {
        p_user_id: user.id,
        p_cents: THREAD_SEARCH_PRICE_CENTS,
      });
    }
    return NextResponse.json({ error: "budget_exhausted" }, { status: 429 });
  }

  // Prefer scraping the map's own matched subreddits (guaranteed on-topic);
  // fall back to global keyword search only when the map has no reddit subs.
  const subs = mapRedditSubs(run.result);
  const started =
    subs.length > 0
      ? await startSubredditsScrape(subs)
      : await startRedditSearch(terms);
  if ("error" in started) {
    // Refund — the search never started (only if this run was charged).
    if (charged) {
      await admin.rpc("credit_balance", {
        p_user_id: user.id,
        p_cents: THREAD_SEARCH_PRICE_CENTS,
      });
    }
    return NextResponse.json(
      { error: "start_failed", detail: started.error },
      { status: 502 }
    );
  }
  // Bind the run to this map: /result only accepts this id (migration 0017).
  await admin
    .from("runs")
    .update({ opportunities_run_id: started.runId })
    .eq("id", run.id);
  return NextResponse.json({ ok: true, apifyRunId: started.runId, terms });
}
