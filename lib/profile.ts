import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

// A profile row is normally created by the on_auth_user_created trigger at
// signup. But if that trigger ever failed to run (created before the trigger
// existed, a migration gap, a race), the user would have NO profile row — and
// every balance read/update would then silently hit 0 rows, so a top-up could
// take money and credit nothing. This guarantees the row exists before any
// money operation. Idempotent; never overwrites an existing balance.
export async function ensureProfile(
  userId: string,
  meta?: { username?: string | null; avatar_url?: string | null }
): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("profiles")
    .upsert(
      {
        id: userId,
        username: meta?.username ?? null,
        avatar_url: meta?.avatar_url ?? null,
      },
      { onConflict: "id", ignoreDuplicates: true }
    );
}

// Same guarantee, from a Supabase auth user — backfills username/avatar from the
// same OAuth metadata keys the signup trigger uses (user_name ?? name, avatar_url).
export async function ensureProfileForUser(user: User): Promise<void> {
  const m = user.user_metadata ?? {};
  await ensureProfile(user.id, {
    username: (m.user_name as string) ?? (m.name as string) ?? null,
    avatar_url: (m.avatar_url as string) ?? null,
  });
}
