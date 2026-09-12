"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  const [armed, setArmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // After router.refresh() the server sends fresh props — adopt them, otherwise
  // the initial useState value would stick for the life of the component.
  useEffect(() => {
    setThreads(initialThreads);
  }, [initialThreads]);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const startRes = await fetch("/api/opportunities/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ runId, expectFree: threads === null }),
      });
      const startData = await startRes.json().catch(() => null);
      if (startRes.status === 409 && startData?.error === "not_free") {
        // Stale page: this map already used its free search. Reload the saved
        // threads from the server instead of charging.
        setError("This map already used its free search — refreshing costs $0.50.");
        router.refresh();
        return;
      }
      if (!startRes.ok || !startData?.apifyRunId) {
        setError(
          startRes.status === 402
            ? "Not enough balance — a refresh costs $0.50. Top up in your profile."
            : startRes.status === 429
              ? "Daily search budget is used up — try again tomorrow."
            : startRes.status === 422
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
          router.refresh(); // keep the server-rendered props in sync
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
        {enabled && unlocked && !armed && (
          <button
            onClick={() => (threads ? setArmed(true) : run())}
            disabled={busy}
            className="focus-ring btn-press shrink-0 rounded-md border-2 border-hairline-strong bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
          >
            {busy ? (
              <>Searching<Dots /></>
            ) : threads ? (
              "Refresh · $0.50"
            ) : (
              "Find live threads · free"
            )}
          </button>
        )}
        {enabled && unlocked && armed && !busy && (
          <span className="flex shrink-0 items-center gap-2">
            <span className="text-xs text-ink-muted">Charge $0.50?</span>
            <button
              onClick={() => {
                setArmed(false);
                run();
              }}
              className="focus-ring btn-press rounded-md border-2 border-hairline-strong bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover"
            >
              Confirm
            </button>
            <button
              onClick={() => setArmed(false)}
              className="focus-ring btn-press rounded-md border-2 border-hairline-strong bg-surface-2 px-3 py-1.5 text-sm text-ink"
            >
              Cancel
            </button>
          </span>
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
          No live threads passed the quality bar right now — we only show
          conversations you can actually join. Try again in a few hours.
        </p>
      )}

      {unlocked && threads && threads.length > 0 && threads.length < 5 && !busy && (
        <p className="mt-2 text-xs text-ink-tertiary">
          Only {threads.length} thread{threads.length > 1 ? "s" : ""} passed the
          live-conversation bar right now — check back later for fresh ones.
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
