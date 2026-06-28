"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Top up the internal balance. A real payment provider isn't connected yet, so
// for now only admins can grant themselves test credit; everyone else sees a
// "coming soon" state.
export function TopUpButton({
  userId,
  isAdmin,
}: {
  userId: string;
  isAdmin: boolean;
}) {
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

  if (!isAdmin) {
    return (
      <button
        disabled
        title="Card / crypto top-up — connecting soon"
        className="rounded-md border-2 border-hairline-strong bg-surface-2 px-4 py-2 text-sm text-ink-muted opacity-60"
      >
        Top up — coming soon
      </button>
    );
  }

  return (
    <button
      onClick={topUp}
      disabled={busy}
      className="focus-ring btn-press rounded-md border-2 border-hairline-strong bg-ink px-4 py-2 text-sm font-medium text-canvas hover:opacity-90 disabled:opacity-60"
    >
      {busy ? "Adding…" : "+ $10 test credit"}
    </button>
  );
}
