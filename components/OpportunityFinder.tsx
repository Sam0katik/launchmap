"use client";

import { useState } from "react";
import { Dots } from "@/components/Dots";

interface Thread {
  title: string;
  url: string;
  subreddit: string | null;
  upvotes: number | null;
  comments: number | null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// "Where to jump in" — live Reddit threads about the product's space that the
// maker can join with a genuine comment. Runs an Apify actor on demand (async:
// start → poll) and caches the result on the run.
export function OpportunityFinder({
  runId,
  enabled,
  unlocked,
  initialThreads,
}: {
  runId: string;
  enabled: boolean;
  unlocked: boolean;
  initialThreads: Thread[] | null;
}) {
  const [threads, setThreads] = useState<Thread[] | null>(initialThreads);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const startRes = await fetch("/api/opportunities/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ runId }),
      });
      const startData = await startRes.json().catch(() => null);
      if (!startRes.ok || !startData?.apifyRunId) {
        setError(
          startRes.status === 422
            ? "Not enough product keywords to search."
            : startData?.detail
              ? `Couldn't start: ${startData.detail}`
              : "Couldn't start the search — try again."
        );
        return;
      }
      const apifyRunId = startData.apifyRunId as string;

      // Poll until the actor finishes (~10–25s typical).
      for (let i = 0; i < 20; i++) {
        await sleep(3000);
        const res = await fetch("/api/opportunities/result", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ runId, apifyRunId }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data) continue;
        if (data.status === "SUCCEEDED") {
          setThreads(data.threads ?? []);
          return;
        }
        if (data.status === "FAILED") {
          setError("Search failed on Reddit — try again later.");
          return;
        }
      }
      setError("Search is taking too long — try again.");
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel mb-10 px-6 py-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="display-lg text-ink" style={{ fontSize: "clamp(20px,2.6vw,26px)" }}>
            Where to jump in
          </h2>
          <p className="mt-1 text-sm text-ink-subtle">
            Live threads about your space — join with a real comment, not a link.
          </p>
        </div>
        {enabled && unlocked && (
          <button
            onClick={run}
            disabled={busy}
            className="focus-ring btn-press shrink-0 rounded-md border-2 border-hairline-strong bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
          >
            {busy ? (
              <>Searching<Dots /></>
            ) : threads ? (
              "Refresh"
            ) : (
              "Find live threads"
            )}
          </button>
        )}
      </div>

      {!enabled && (
        <p className="text-sm text-ink-tertiary">Connecting soon.</p>
      )}

      {enabled && !unlocked && (
        <p className="text-sm text-ink-tertiary">
          🔒 Unlock this map to find live threads to join.
        </p>
      )}

      {busy && (
        <p className="text-sm text-ink-subtle">
          Searching Reddit — this takes ~20–40 seconds, hang tight<Dots />
        </p>
      )}

      {error && <p className="text-sm text-red-700">{error}</p>}

      {unlocked && threads && threads.length === 0 && !busy && (
        <p className="text-sm text-ink-tertiary">
          No threads came back — Reddit sometimes rate-limits the search. Give it
          a moment and hit Refresh.
        </p>
      )}

      {unlocked && threads && threads.length > 0 && (
        <ul className="mt-1 space-y-2">
          {threads.map((t, i) => (
            <li key={i}>
              <a
                href={t.url}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring group flex items-start justify-between gap-3 rounded-md border border-hairline bg-surface-1 px-3 py-2 hover:bg-surface-2"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm text-ink group-hover:text-primary">
                    {t.title}
                  </span>
                  <span className="text-xs text-ink-subtle">
                    {t.subreddit ? `r/${t.subreddit.replace(/^r\//, "")}` : "reddit"}
                    {t.comments != null ? ` · ${t.comments} comments` : ""}
                    {t.upvotes != null ? ` · ${t.upvotes} upvotes` : ""}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-ink-tertiary">open →</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
