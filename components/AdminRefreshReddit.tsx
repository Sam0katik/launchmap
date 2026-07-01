"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Admin-only: pull live subscriber counts + icons from Reddit's public
// about.json into the communities table, server-side. Shows a short result
// summary so the operator knows how many rows / icons came back.
export function AdminRefreshReddit() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const router = useRouter();

  async function refresh() {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/refresh-reddit", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (res.ok && data) {
        setResult(
          `Updated ${data.updated}/${data.total} · icons ${data.withIcon}` +
            (data.failedCount ? ` · ${data.failedCount} failed` : "") +
            (data.sample?.length ? ` — ${data.sample[0]}` : "")
        );
        router.refresh();
      } else {
        setResult("Failed — check logs.");
      }
    } catch {
      setResult("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={refresh}
        disabled={busy}
        className="focus-ring btn-press rounded-md border-2 border-hairline-strong bg-surface-2 px-4 py-2.5 text-base font-medium text-ink hover:bg-surface-3 disabled:opacity-60"
      >
        {busy ? "Refreshing…" : "↻ Refresh Reddit data"}
      </button>
      {result && <span className="text-xs text-ink-subtle">{result}</span>}
    </div>
  );
}
