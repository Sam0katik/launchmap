"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// GitHub sign-in / sign-out button. Stays a vivid solid-orange button at all
// times; on hover only the label gets a marker highlight (like the footer
// links). Degrades to a no-op when Supabase env is not configured.
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
    if (!configured) return;
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

  // Solid vivid orange, no dimming. `group` so only the label highlights.
  const cls =
    "focus-ring btn-press group rounded-md border-2 border-hairline-strong bg-primary px-5 py-2.5 text-lg font-medium text-white";
  // Inner label: marker-highlights (sage green) on hover, like Privacy/Contact.
  const labelCls =
    "rounded-sm px-1 transition-colors group-hover:bg-[#b9c4a0] group-hover:text-ink";

  if (!ready && configured) {
    return <span className="text-xs text-ink-tertiary">…</span>;
  }

  const text = label ? `${label} · sign out` : "Sign in with GitHub";

  return (
    <button
      className={cls}
      onClick={label ? signOut : signIn}
      title={configured ? undefined : "Connect Supabase to enable sign-in"}
    >
      <span className={labelCls}>{text}</span>
    </button>
  );
}
