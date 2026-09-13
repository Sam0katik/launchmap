"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatUsd } from "@/lib/billing";
import { Dots } from "@/components/Dots";
import { useT } from "@/components/LangProvider";
import { fill } from "@/lib/i18n";

// Unlock a map by spending internal balance ($2, same for everyone). Two-step:
// click "Spend $2" → confirm (no refunds) → charge. Refreshes on success.
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
  const t = useT();
  const price = priceLabel.replace(" one-time", "");

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
          {fill(t.unlock.spend, { price })}
        </button>
        <p className="mt-1 text-xs text-ink-tertiary">
          {fill(t.unlock.balance, { amount: formatUsd(balanceCents) })}
        </p>
        {short && (
          <p className="mt-1 text-xs text-red-700">
            {t.unlock.notEnough}{" "}
            <Link href="/profile" className="underline">
              {t.unlock.topUp}
            </Link>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="shrink-0 text-right">
      <p className="mb-1.5 text-xs text-ink-muted">
        {fill(t.unlock.confirmQuestion, { price })}
      </p>
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setArmed(false)}
          disabled={busy}
          className="focus-ring btn-press rounded-md border-2 border-hairline-strong bg-surface-2 px-3 py-1.5 text-sm text-ink disabled:opacity-60"
        >
          {t.unlock.cancel}
        </button>
        <button
          onClick={unlock}
          disabled={busy}
          className="focus-ring btn-press rounded-md border-2 border-hairline-strong bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {busy ? (
            <>{t.unlock.charging}<Dots /></>
          ) : (
            fill(t.unlock.confirm, { price })
          )}
        </button>
      </div>
    </div>
  );
}
