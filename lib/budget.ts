import { createAdminClient } from "@/lib/supabase/admin";

// Global per-day caps on the things that cost money. Per-account caps exist
// too, but accounts are free (GitHub OAuth), so without a global ceiling a bot
// farming accounts could burn the whole Anthropic / Apify budget in a night.
// Counted in the daily_counters table via bump_daily_counter() (migration
// 0017). Tune with env; the defaults are generous for a solo product.
export const ANALYZE_GLOBAL_PER_DAY = envInt("ANALYZE_GLOBAL_PER_DAY", 100);
// Apify runs are paid per use by the user, so the real limit is per PROFILE
// (stops one account hammering the actor); the global number is only a
// circuit breaker for runaway bugs / the Apify plan's own monthly credit.
export const APIFY_PER_USER_PER_DAY = envInt("APIFY_PER_USER_PER_DAY", 20);
export const APIFY_GLOBAL_PER_DAY = envInt("APIFY_GLOBAL_PER_DAY", 500);
export const APIFY_SCANS_PER_DAY = envInt("APIFY_SCANS_PER_DAY", 2);

function envInt(name: string, fallback: number): number {
  const n = Number(process.env[name]);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

/**
 * Atomically count one use of `key` today and report whether it is still
 * within `limit`. Fails OPEN (true) if the counter itself errors — e.g. the
 * migration hasn't been run — so a missing table can't take the product down,
 * but it logs loudly so the gap is visible.
 */
export async function withinDailyBudget(key: string, limit: number): Promise<boolean> {
  try {
    const { data, error } = await createAdminClient().rpc("bump_daily_counter", {
      p_key: key,
      p_limit: limit,
    });
    if (error) {
      console.error("[budget] counter unavailable — cap NOT enforced:", key, error.message);
      return true;
    }
    return data === true;
  } catch (e) {
    console.error("[budget] counter error — cap NOT enforced:", key, e);
    return true;
  }
}

/** Per-user Apify allowance for today, then the global circuit breaker. */
export async function withinApifyBudget(userId: string): Promise<boolean> {
  if (!(await withinDailyBudget(`apify:${userId}`, APIFY_PER_USER_PER_DAY))) return false;
  return withinDailyBudget("apify", APIFY_GLOBAL_PER_DAY);
}
