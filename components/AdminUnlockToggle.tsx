"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Admin-only control: unlock (or relock) all of a user's maps so the operator
// can preview the paid "all publics + posts" experience for testing.
export function AdminUnlockToggle({
  userId,
  unlocked,
}: {
  userId: string;
  unlocked: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function toggle() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/test-unlock", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId, unlocked: !unlocked }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className="focus-ring btn-press rounded-sm border-2 border-hairline-strong bg-surface-2 px-2.5 py-1 text-xs text-ink hover:bg-surface-3 disabled:opacity-50"
    >
      {busy ? "…" : unlocked ? "Lock maps" : "Unlock maps"}
    </button>
  );
}
