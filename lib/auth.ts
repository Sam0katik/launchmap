import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

// Signed-in user for action routes, with the block check folded in. Returns
// `blocked: true` when the operator has blocked the account (profiles.blocked,
// set from the admin panel) — routes answer 403 and do nothing.
export async function getActionUser(): Promise<
  { user: User; blocked: false } | { user: User; blocked: true } | { user: null; blocked: false }
> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, blocked: false };
  const { data: profile } = await supabase
    .from("profiles")
    .select("blocked")
    .eq("id", user.id)
    .maybeSingle();
  return { user, blocked: profile?.blocked === true };
}
