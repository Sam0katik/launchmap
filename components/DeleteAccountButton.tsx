"use client";

import { useState } from "react";

// Danger-zone control. Two-step: a click arms it, a second confirms, then it
// calls the irreversible delete route and sends the user home. Kept dead simple
// on purpose — no modal library, just an inline confirm.
export function DeleteAccountButton() {
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      if (!res.ok) {
        setError("Couldn't delete the account. Try again.");
        setBusy(false);
        return;
      }
      // Hard navigation so the cleared session cookie takes effect.
      window.location.href = "/";
    } catch {
      setError("Network error. Try again.");
      setBusy(false);
    }
  }

  if (!armed) {
    return (
      <button
        onClick={() => setArmed(true)}
        className="focus-ring btn-press rounded-sm border-2 border-red-700/60 px-4 py-2 text-sm text-red-700 hover:bg-red-700/10"
      >
        Delete account
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm text-ink-muted">
        This wipes your account and every saved map. Permanent.
      </span>
      {/* Cancel is the prominent (safe) default; delete is muted/outline so the
          destructive action is deliberately the harder one to hit. */}
      <button
        onClick={() => setArmed(false)}
        disabled={busy}
        className="focus-ring btn-press rounded-sm border-2 border-hairline-strong bg-ink px-4 py-2 text-sm font-medium text-canvas disabled:opacity-60"
      >
        Cancel
      </button>
      <button
        onClick={onDelete}
        disabled={busy}
        className="focus-ring btn-press rounded-sm border-2 border-red-700/60 px-4 py-2 text-sm text-red-700 hover:bg-red-700/10 disabled:opacity-60"
      >
        {busy ? "Deleting…" : "Yes, delete everything"}
      </button>
      {error && <p className="w-full text-sm text-red-700">{error}</p>}
    </div>
  );
}
