"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Account control in the top-right.
//  - Signed out → "Sign in with GitHub" (solid orange).
//  - Signed in  → a button showing the person's name; clicking it opens a small
//    menu with "Profile" and "Sign out". Closes on outside-click / Esc.
// Degrades to a no-op when Supabase env is not configured.
export function AuthButton() {
  const configured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const [name, setName] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!configured) {
      setReady(true);
      return;
    }
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      setName(
        u ? (u.user_metadata?.user_name as string) ?? u.email ?? "signed in" : null
      );
      setReady(true);
    });
  }, [configured]);

  // Outside-click + Esc to dismiss the menu.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

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
    location.href = "/";
  }

  if (!ready && configured) {
    return <span className="text-xs text-ink-tertiary">…</span>;
  }

  // Signed out: a single solid sign-in button.
  if (!name) {
    return (
      <button
        onClick={signIn}
        title={configured ? undefined : "Connect Supabase to enable sign-in"}
        className="focus-ring btn-press group rounded-md border-2 border-hairline-strong bg-primary px-5 py-2.5 text-lg font-medium text-white"
      >
        <span className="rounded-sm px-1 transition-colors group-hover:bg-[#b9c4a0] group-hover:text-ink">
          Sign in with GitHub
        </span>
      </button>
    );
  }

  // Signed in: name button + dropdown menu.
  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="focus-ring btn-press flex items-center gap-2 rounded-md border-2 border-hairline-strong bg-surface-1 px-4 py-2.5 text-lg text-ink hover:bg-surface-2"
      >
        <span className="inline-block h-2 w-2 rounded-full bg-primary" />
        {name}
        <span className={`text-sm transition-transform ${open ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-44 overflow-hidden rounded-md border-2 border-hairline-strong bg-surface-1 shadow-[4px_5px_0_0_var(--color-hairline-strong)]"
        >
          <a
            href="/profile"
            role="menuitem"
            className="block px-4 py-3 text-base text-ink hover:bg-surface-2"
          >
            Profile
          </a>
          <div className="receipt-rule mx-2" />
          <button
            onClick={signOut}
            role="menuitem"
            className="block w-full px-4 py-3 text-left text-base text-ink hover:bg-surface-2"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
