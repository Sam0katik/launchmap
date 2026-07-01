"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Small two-step delete control for a saved map in the profile list. First click
// arms it, second confirms, then it deletes the run (and its drafts) and
// refreshes the list. Stops propagation so it doesn't trigger the row's link.
export function DeleteMapButton({ runId }: { runId: string }) {
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function onDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setBusy(true);
    const res = await fetch("/api/runs/delete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ runId }),
    });
    if (res.ok) {
      // Keep the spinner until the refreshed list drops this row — resetting
      // busy here would flash the control back to idle for a beat first.
      router.refresh();
      return;
    }
    setBusy(false);
  }

  if (!armed) {
    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setArmed(true);
        }}
        title="Delete this map"
        className="focus-ring btn-press shrink-0 rounded-sm border-2 border-red-700/50 px-2.5 py-1 text-xs text-red-700 hover:bg-red-700/10"
      >
        Delete
      </button>
    );
  }

  return (
    <span className="flex shrink-0 items-center gap-1.5">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setArmed(false);
        }}
        disabled={busy}
        className="focus-ring btn-press rounded-sm border-2 border-hairline-strong bg-ink px-2.5 py-1 text-xs text-canvas disabled:opacity-60"
      >
        Cancel
      </button>
      <button
        onClick={onDelete}
        disabled={busy}
        className="focus-ring btn-press rounded-sm border-2 border-red-700/60 px-2.5 py-1 text-xs text-red-700 hover:bg-red-700/10 disabled:opacity-60"
      >
        {busy ? "…" : "Confirm"}
      </button>
    </span>
  );
}
