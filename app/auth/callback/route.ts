import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-error`);
}
