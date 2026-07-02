"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dots } from "@/components/Dots";

// Admin-only: one Apify actor run over every reddit community — pulls real
// member counts, icons and community rules into the DB. Start + poll (the run
// takes ~30–90s for ~35 subs).
export function AdminRefreshReddit() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const router = useRouter();

  async function refresh() {
    setBusy(true);
    setResult("Starting scan…");
    try {
      const startRes = await fetch("/api/admin/refresh-reddit/start", {
        method: "POST",
      });
      const startData = await startRes.json().catch(() => null);
      if (!startRes.ok || !startData?.apifyRunId) {
        setResult(
          startData?.detail ? `Failed: ${startData.detail}` : "Failed to start."
        );
        return;
      }

      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 5000));
        setResult(`Scanning ${startData.total} subs… (${(i + 1) * 5}s)`);
        const res = await fetch("/api/admin/refresh-reddit/result", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ apifyRunId: startData.apifyRunId }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data) continue;
        if (data.status === "SUCCEEDED") {
          setResult(
            `Updated ${data.updated}/${startData.total} · icons ${data.withIcon} · rules ${data.withRules}`
          );
          router.refresh();
          return;
        }
        if (data.status === "FAILED") {
          setResult("Scan failed on Apify — check the run log.");
          return;
        }
      }
      setResult("Timed out — check the Apify run.");
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
        {busy ? <>Scanning<Dots /></> : "↻ Scan Reddit data"}
      </button>
      {result && <span className="text-xs text-ink-subtle">{result}</span>}
    </div>
  );
}
