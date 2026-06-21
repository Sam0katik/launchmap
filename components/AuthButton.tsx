"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// GitHub sign-in / sign-out button. Degrades to a disabled state when Supabase
// env is not configured (keyless dev/demo), so it never crashes the page.
export function AuthButton() {
  const configured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const [label, setLabel] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!configured) {
      setReady(true);
      return;
    }
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      setLabel(
        u ? (u.user_metadata?.user_name as string) ?? u.email ?? "signed in" : null
      );
      setReady(true);
    });
  }, [configured]);

  async function signIn() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    location.reload();
  }

  // Fully solid/opaque. Fills white on hover.
  const cls =
    "focus-ring btn-press rounded-lg border border-hairline-strong bg-surface-3 px-5 py-2 text-base text-ink hover:border-primary hover:bg-primary hover:text-canvas disabled:opacity-50";

  if (!configured) {
    return (
      <button className={cls} disabled title="Connect Supabase to enable sign-in">
        Sign in with GitHub
      </button>
    );
  }
  if (!ready) return <span className="text-xs text-ink-tertiary">…</span>;
  if (label) {
    return (
      <button className={cls} onClick={signOut}>
        {label} · sign out
      </button>
    );
  }
  return (
    <button className={cls} onClick={signIn}>
      Sign in with GitHub
    </button>
  );
}
