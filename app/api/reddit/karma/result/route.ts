import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserScrapeResult, apifyConfigured } from "@/lib/apify";
import { MAX_REDDIT_ACCOUNTS } from "@/lib/billing";

// POST /api/reddit/karma/result  Body: { apifyRunId }
// Poll the user-profile scrape; when done, save the checked account onto the
// profile (upsert by username, capped at MAX_REDDIT_ACCOUNTS) and return karma.
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
  if (!result.user || !result.user.name) {
    return NextResponse.json({ status: "SUCCEEDED", karma: null });
  }

  // Attach the checked account to the profile (server-side; the username comes
  // from the scrape result, not from the client).
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("reddit_accounts")
    .eq("id", user.id)
    .maybeSingle();
  const existing = Array.isArray(profile?.reddit_accounts)
    ? (profile!.reddit_accounts as Record<string, unknown>[])
    : [];
  const entry = {
    username: result.user.name,
    totalKarma: result.user.totalKarma,
    linkKarma: result.user.linkKarma,
    commentKarma: result.user.commentKarma,
    createdUtc: result.user.createdUtc,
    checkedAt: new Date().toISOString(),
  };
  const rest = existing.filter(
    (a) =>
      String(a.username ?? "").toLowerCase() !==
      result.user!.name.toLowerCase()
  );
  const next = [entry, ...rest].slice(0, MAX_REDDIT_ACCOUNTS);
  await admin
    .from("profiles")
    .update({ reddit_accounts: next })
    .eq("id", user.id);

  return NextResponse.json({ status: "SUCCEEDED", karma: result.user });
}
