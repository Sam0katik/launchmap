"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LighthouseIcon } from "@/components/LighthouseIcon";
import { ScrambleText } from "@/components/ScrambleText";
import { AuthButton } from "@/components/AuthButton";

// Shared top bar for inner pages (map, profile, legal). Mirrors the landing
// header — wordmark on the left, auth on the right — and slots a "Profile" link
// in only while the visitor is signed in (it would 401-redirect otherwise).
export function SiteNav() {
  const configured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    if (!configured) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
  }, [configured]);

  return (
    <header className="relative z-10 flex h-20 items-center justify-between px-8">
      <a
        href="/"
        className="wordmark flex items-end gap-2.5 text-4xl text-ink hover:text-primary"
      >
        <LighthouseIcon size={46} />
        <ScrambleText text="BEACON" className="leading-none" />
      </a>
      <nav className="flex items-center gap-5">
        {signedIn && (
          <a href="/profile" className="menu-link rounded-sm text-lg text-ink">
            Profile
          </a>
        )}
        <AuthButton />
      </nav>
    </header>
  );
}
