import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role Supabase client — bypasses RLS. SERVER-ONLY. Never import this
// into a client component or expose the key to the browser.
//
// Used for privileged operations the user's own session can't perform:
//   - deleting an auth user (account deletion)
//   - flipping runs.unlocked from the Lemon Squeezy webhook (no user session)
//
// Throws if the service-role key is missing so misconfiguration fails loud.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Supabase admin client missing URL or service-role key");
  }
  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
