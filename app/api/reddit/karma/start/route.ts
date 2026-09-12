import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getActionUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureProfileForUser } from "@/lib/profile";
import { startUserScrape, apifyConfigured } from "@/lib/apify";
import {
  KARMA_CHECK_PRICE_CENTS,
  MAX_REDDIT_ACCOUNTS,
} from "@/lib/billing";
import { withinApifyBudget } from "@/lib/budget";
import { recordBalanceEvent } from "@/lib/ledger";
import { notifyTelegram } from "@/lib/telegram";
import { githubLogin } from "@/lib/admins";
import { formatUsd } from "@/lib/billing";

// POST /api/reddit/karma/start  Body: { username }
// Kick off an Apify scrape of a Reddit user profile (public karma + age).
// Signed-in only; charges KARMA_CHECK_PRICE_CENTS from the internal balance
// (refunded if the scrape fails to start). Re-checking an already-saved
// account is allowed; adding a NEW one is capped at MAX_REDDIT_ACCOUNTS.
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  username: z
    .string()
    .min(1)
    .max(40)
    .transform((s) => s.replace(/^u\//i, "").trim())
    .refine((s) => /^[\w-]+$/.test(s), "invalid"),
});

export async function POST(req: NextRequest) {
  if (!apifyConfigured()) {
    return NextResponse.json({ error: "apify_off" }, { status: 503 });
  }

  const supabase = createClient();
  const { user, blocked } = await getActionUser();
  if (!user) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }
  if (blocked) {
    return NextResponse.json({ error: "blocked" }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_username" }, { status: 400 });
  }
  const username = parsed.data.username;

  // Guarantee a profile row exists before any balance op.
  await ensureProfileForUser(user);

  // Karma check requires at least one unlocked map (it's a paid add-on to a
  // real launch, not a standalone tool).
  const { count: unlockedCount } = await supabase
    .from("runs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("unlocked", true);
  if ((unlockedCount ?? 0) < 1) {
    return NextResponse.json({ error: "need_unlock" }, { status: 403 });
  }

  const admin = createAdminClient();

  // Enforce the account cap (re-checks of saved accounts don't count).
  const { data: profile } = await admin
    .from("profiles")
    .select("balance_cents, reddit_accounts")
    .eq("id", user.id)
    .maybeSingle();
  const accounts = Array.isArray(profile?.reddit_accounts)
    ? (profile!.reddit_accounts as { username?: string }[])
    : [];
  const isSaved = accounts.some(
    (a) => (a.username ?? "").toLowerCase() === username.toLowerCase()
  );
  if (!isSaved && accounts.length >= MAX_REDDIT_ACCOUNTS) {
    return NextResponse.json({ error: "account_limit" }, { status: 409 });
  }

  // Charge per check (CAS; one retry on a concurrent balance change).
  let charged = false;
  let balance = (profile?.balance_cents as number) ?? 0;
  for (let attempt = 0; attempt < 2 && !charged; attempt++) {
    if (attempt > 0) {
      const { data: p2 } = await admin
        .from("profiles")
        .select("balance_cents")
        .eq("id", user.id)
        .maybeSingle();
      balance = (p2?.balance_cents as number) ?? 0;
    }
    if (balance < KARMA_CHECK_PRICE_CENTS) {
      return NextResponse.json(
        { error: "insufficient", balanceCents: balance },
        { status: 402 }
      );
    }
    const { data: ok } = await admin
      .from("profiles")
      .update({ balance_cents: balance - KARMA_CHECK_PRICE_CENTS })
      .eq("id", user.id)
      .eq("balance_cents", balance)
      .select("id");
    charged = !!ok && ok.length > 0;
  }
  if (!charged) {
    return NextResponse.json({ error: "conflict" }, { status: 409 });
  }

  // Apify budget: per-user daily allowance + global circuit breaker.
  if (!(await withinApifyBudget(user.id))) {
    await admin.rpc("credit_balance", {
      p_user_id: user.id,
      p_cents: KARMA_CHECK_PRICE_CENTS,
    });
    await recordBalanceEvent({ userId: user.id, deltaCents: KARMA_CHECK_PRICE_CENTS, kind: "refund", ref: username, note: "karma check: budget" });
    return NextResponse.json({ error: "budget_exhausted" }, { status: 429 });
  }

  const started = await startUserScrape(username);
  if ("error" in started) {
    // Refund — the check never started.
    await admin.rpc("credit_balance", {
      p_user_id: user.id,
      p_cents: KARMA_CHECK_PRICE_CENTS,
    });
    await recordBalanceEvent({ userId: user.id, deltaCents: KARMA_CHECK_PRICE_CENTS, kind: "refund", ref: username, note: "karma check: start failed" });
    return NextResponse.json(
      { error: "start_failed", detail: started.error },
      { status: 502 }
    );
  }
  await recordBalanceEvent({ userId: user.id, deltaCents: -KARMA_CHECK_PRICE_CENTS, kind: "karma_check", ref: username });
  await notifyTelegram(
    `🧪 Karma check (${formatUsd(KARMA_CHECK_PRICE_CENTS)}) by ${githubLogin(user) ?? user.email ?? user.id}\n` +
      `u/${username} · balance left ${formatUsd(balance - KARMA_CHECK_PRICE_CENTS)}`
  );

  // Bind the run to this profile: /result only accepts this id.
  await admin
    .from("profiles")
    .update({ karma_run_id: started.runId })
    .eq("id", user.id);
  return NextResponse.json({ ok: true, apifyRunId: started.runId });
}
