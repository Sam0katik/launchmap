import { createAdminClient } from "@/lib/supabase/admin";

// Global per-day caps on the things that cost money. Per-account caps exist
// too, but accounts are free (GitHub OAuth), so without a global ceiling a bot
// farming accounts could burn the whole Anthropic / Apify budget in a night.
// Counted in the daily_counters table via bump_daily_counter() (migration
// 0017). Tune with env; the defaults are generous for a solo product.
export const ANALYZE_GLOBAL_PER_DAY = envInt("ANALYZE_GLOBAL_PER_DAY", 100);
export const APIFY_GLOBAL_PER_DAY = envInt("APIFY_GLOBAL_PER_DAY", 40);
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
