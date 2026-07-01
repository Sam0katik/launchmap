"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dots } from "@/components/Dots";

// Admin-only: pull live subscriber counts + icons from Reddit into the
// communities table. The server processes small batches (to fit the serverless
// time limit); this loops through the offsets and shows running progress.
export function AdminRefreshReddit() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const router = useRouter();

  async function refresh() {
    setBusy(true);
    setResult(null);
    let offset = 0;
    let updated = 0;
    let withIcon = 0;
    let failed = 0;
    let total = 0;
    let sample = "";
    try {
      // Safety cap on iterations in case `done` never arrives.
      for (let i = 0; i < 50; i++) {
        const res = await fetch(`/api/admin/refresh-reddit?offset=${offset}`, {
          method: "POST",
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data) {
          setResult("Failed — check logs.");
          setBusy(false);
          return;
        }
        updated += data.updated;
        withIcon += data.withIcon;
        failed += data.failedCount;
        total = data.total;
        if (!sample && data.sample?.length) sample = data.sample[0];
        offset = data.nextOffset;
        setResult(`Working ${Math.min(offset, total)}/${total}`);
        if (data.done) break;
      }
      setResult(
        `Updated ${updated}/${total} · icons ${withIcon}` +
          (failed ? ` · ${failed} failed — ${sample}` : "")
      );
      router.refresh();
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
        {busy ? <>Refreshing<Dots /></> : "↻ Refresh Reddit data"}
      </button>
      {result && <span className="text-xs text-ink-subtle">{result}</span>}
    </div>
  );
}
