"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Admin-only control: block / unblock a user (profiles.blocked). Blocked users
// can still sign in and look, but every action route refuses them.
export function AdminBlockToggle({
  userId,
  blocked,
}: {
  userId: string;
  blocked: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function toggle() {
    if (!blocked && !window.confirm("Block this user? They keep read access but can't run, unlock or pay.")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/block", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId, blocked: !blocked }),
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
      className={`focus-ring btn-press rounded-sm border-2 border-hairline-strong px-2.5 py-1 text-xs disabled:opacity-50 ${
        blocked ? "bg-red-700 text-white hover:opacity-90" : "bg-surface-2 text-ink hover:bg-surface-3"
      }`}
    >
      {busy ? "…" : blocked ? "Unblock" : "Block"}
    </button>
  );
}
