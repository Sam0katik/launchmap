"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Admin-only control: flip a user's plan between free and Pro. Used from the
// operator dashboard to grant test access (Pro unlocks full maps + drafts).
export function AdminPlanToggle({
  userId,
  plan,
}: {
  userId: string;
  plan: string;
}) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const next = plan === "paid" ? "free" : "paid";

  async function toggle() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/set-plan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId, plan: next }),
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
      {busy ? "…" : next === "paid" ? "Make Pro" : "Make Free"}
    </button>
  );
}
