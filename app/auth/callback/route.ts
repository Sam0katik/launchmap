import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureProfileForUser } from "@/lib/profile";
import { githubLogin } from "@/lib/admins";
import { notifyTelegram, telegramConfigured } from "@/lib/telegram";

// GitHub OAuth callback — exchanges the code for a session, then redirects.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Only a same-origin path may be used as the post-login destination —
  // anything else (`//evil.com`, `@evil.com`, absolute URLs) would turn this
  // into an open redirect right after sign-in.
  const rawNext = searchParams.get("next") ?? "/";
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.startsWith("/\\")
      ? rawNext
      : "/";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      await alertOnFirstLogin(supabase);
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-error`);
}

// Telegram alert to the operator on a user's FIRST sign-in (once per account,
// tracked by profiles.notified_at). Best-effort: never blocks or fails login.
async function alertOnFirstLogin(
  supabase: ReturnType<typeof createClient>
): Promise<void> {
  if (!telegramConfigured()) return;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await ensureProfileForUser(user);
    const admin = createAdminClient();
    // Atomic claim: only the request that sets notified_at sends the message.
    const { data: claimed } = await admin
      .from("profiles")
      .update({ notified_at: new Date().toISOString() })
      .eq("id", user.id)
      .is("notified_at", null)
      .select("id");
    if (!claimed || claimed.length === 0) return;
    const { count } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true });
    const login = githubLogin(user) ?? "(no github login)";
    await notifyTelegram(
      `🆕 New ZeroFans user #${count ?? "?"}\n` +
        `GitHub: ${login}\n` +
        `Email: ${user.email ?? "—"}\n` +
        `Id: ${user.id}`
    );
  } catch (e) {
    console.error("[auth] first-login alert failed:", e);
  }
}
