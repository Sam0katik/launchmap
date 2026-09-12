"use client";

import { useState } from "react";
import { Dots } from "@/components/Dots";

// Profile top-up. When Platega is configured it opens an amount picker and
// starts a hosted checkout (SBP / card / crypto — the payer picks the method on
// Platega's page); otherwise it stays inert. Amounts credit the USD balance;
// the payer is charged the RUB equivalent shown next to each amount.
const AMOUNTS = [200, 500, 1000]; // $2 / $5 / $10

export function TopUpButton({
  enabled,
  rubPerUsd,
}: {
  enabled: boolean;
  /** RUB charged per $1 of balance (server-configured). */
  rubPerUsd: number;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!enabled) {
    return (
      <button
        disabled
        title="Top-up — connecting soon"
        className="rounded-md border-2 border-hairline-strong bg-surface-2 px-4 py-2 text-sm text-ink-muted opacity-60"
      >
        Top up — coming soon
      </button>
    );
  }

  async function start(cents: number) {
    setBusy(cents);
    setError(null);
    try {
      const res = await fetch("/api/topup/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amountCents: cents }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.url) {
        window.location.href = data.url; // hosted checkout
        return;
      }
      setError("Couldn't start checkout — try again.");
      setBusy(null);
    } catch {
      setError("Network error.");
      setBusy(null);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="focus-ring btn-press rounded-md border-2 border-hairline-strong bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
      >
        Top up
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {AMOUNTS.map((c) => (
        <button
          key={c}
          onClick={() => start(c)}
          disabled={busy !== null}
          title={`${Math.ceil((c / 100) * rubPerUsd)} ₽ via SBP / card / crypto`}
          className="focus-ring btn-press rounded-md border-2 border-hairline-strong bg-surface-2 px-3 py-1.5 text-sm text-ink hover:bg-surface-3 disabled:opacity-60"
        >
          {busy === c ? (
            <Dots />
          ) : (
            <>
              ${c / 100}
              <span className="ml-1 text-ink-subtle">
                · {Math.ceil((c / 100) * rubPerUsd)} ₽
              </span>
            </>
          )}
        </button>
      ))}
      {error && <p className="w-full text-xs text-red-700">{error}</p>}
    </div>
  );
}
