import { createAdminClient } from "@/lib/supabase/admin";

// Balance ledger (migration 0019): every balance change gets a row. Written
// best-effort right after the balance write itself — never throws, never
// blocks the money path. Revenue reports use `kind = 'topup'` only, so admin
// test credits can't be mistaken for purchases.
export type BalanceEventKind =
  | "topup"
  | "admin_credit"
  | "unlock"
  | "thread_search"
  | "karma_check"
  | "refund";

export async function recordBalanceEvent(e: {
  userId: string;
  deltaCents: number;
  kind: BalanceEventKind;
  ref?: string | null;
  note?: string | null;
}): Promise<void> {
  try {
    const { error } = await createAdminClient().from("balance_events").insert({
      user_id: e.userId,
      delta_cents: e.deltaCents,
      kind: e.kind,
      ref: e.ref ?? null,
      note: e.note ?? null,
    });
    if (error) console.error("[ledger] insert failed:", error.message);
  } catch (err) {
    console.error("[ledger] insert error:", err);
  }
}
