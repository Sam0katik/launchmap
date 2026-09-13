"use client";

import { createClient } from "@/lib/supabase/client";
import { useT } from "@/components/LangProvider";

// Visible sign-out on the profile page (the nav dropdown has one too, but a
// plain button is easier to find).
export function SignOutButton() {
  const t = useT();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    location.href = "/";
  }

  return (
    <button
      onClick={signOut}
      className="focus-ring btn-press rounded-md border-2 border-hairline-strong bg-surface-2 px-4 py-2.5 text-base text-ink hover:bg-surface-3"
    >
      {t.nav.signOut}
    </button>
  );
}
