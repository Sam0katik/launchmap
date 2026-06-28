"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatUsd } from "@/lib/billing";

// Unlock a map by spending internal balance (admins unlock free). Shows the
// price, handles insufficient balance, and refreshes the page on success.
export function UnlockButton({
  runId,
  balanceCents,
  isAdmin,
  priceLabel,
}: {
  runId: string;
  balanceCents: number;
  isAdmin: boolean;
  priceLabel: string;
}) {
  const [busy, setBusy] = useState(false);
  const [short, setShort] = useState(false);
  const router = useRouter();

  async function unlock() {
    setBusy(true);
    setShort(false);
    try {
      const res = await fetch("/api/unlock", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ runId }),
      });
      if (res.status === 402) {
        setShort(true);
        return;
      }
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="shrink-0 text-right">
      <button
        onClick={unlock}
        disabled={busy}
        className="focus-ring btn-press rounded-md border-2 border-hairline-strong bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
      >
        {busy
          ? "Unlocking…"
          : isAdmin
            ? "Unlock all publics (admin) →"
            : `Unlock all publics — ${priceLabel}`}
      </button>
      {!isAdmin && (
        <p className="mt-1 text-xs text-ink-tertiary">
          Balance: {formatUsd(balanceCents)}
        </p>
      )}
      {short && (
        <p className="mt-1 text-xs text-red-700">
          Not enough balance.{" "}
          <Link href="/profile" className="underline">
            Top up
          </Link>
        </p>
      )}
    </div>
  );
}
