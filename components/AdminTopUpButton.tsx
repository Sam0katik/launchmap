"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Admin-only: grant $10 of test credit to a user's internal balance. The only
// way to add balance until a real payment provider is connected.
export function AdminTopUpButton({ userId }: { userId: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function topUp() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/topup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId, amountCents: 1000 }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={topUp}
      disabled={busy}
      className="focus-ring btn-press rounded-sm border border-hairline-strong bg-surface-2 px-2 py-0.5 text-[11px] text-ink hover:bg-surface-3 disabled:opacity-50"
    >
      {busy ? "…" : "+$10"}
    </button>
  );
}
