"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatUsd } from "@/lib/billing";
import { Dots } from "@/components/Dots";

// Unlock a map by spending internal balance ($3, same for everyone). Two-step:
// click "Spend $3" → confirm (no refunds) → charge. Refreshes on success.
export function UnlockButton({
  runId,
  balanceCents,
  priceLabel,
}: {
  runId: string;
  balanceCents: number;
  priceLabel: string;
}) {
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [short, setShort] = useState(false);
  const router = useRouter();

  async function unlock() {
    setBusy(true);
    setShort(false);
    // One retry on a concurrency conflict (409); otherwise proceed.
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await fetch("/api/unlock", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ runId }),
      });
      if (res.status === 402) {
        setShort(true);
        setArmed(false);
        setBusy(false);
        return;
      }
      if (res.status === 409) continue; // lost the race — try once more
      if (res.ok) {
        // Leave the spinner on: the whole unlock panel unmounts once the map
        // refreshes, so resetting busy would just flash it back to idle.
        router.refresh();
        return;
      }
      setBusy(false);
      return;
    }
    setBusy(false);
  }

  if (!armed) {
    return (
      <div className="shrink-0 text-right">
        <button
          onClick={() => setArmed(true)}
          className="focus-ring btn-press rounded-md border-2 border-hairline-strong bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
        >
          Spend $3
        </button>
        <p className="mt-1 text-xs text-ink-tertiary">
          Balance: {formatUsd(balanceCents)}
        </p>
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

  return (
    <div className="shrink-0 text-right">
      <p className="mb-1.5 text-xs text-ink-muted">
        Charge {priceLabel.replace(" one-time", "")} now? No refunds.
      </p>
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setArmed(false)}
          disabled={busy}
          className="focus-ring btn-press rounded-md border-2 border-hairline-strong bg-surface-2 px-3 py-1.5 text-sm text-ink disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          onClick={unlock}
          disabled={busy}
          className="focus-ring btn-press rounded-md border-2 border-hairline-strong bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {busy ? <>Charging<Dots /></> : "Confirm — spend $3"}
        </button>
      </div>
    </div>
  );
}
