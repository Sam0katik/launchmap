"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dots } from "@/components/Dots";
import { useT } from "@/components/LangProvider";
import { fill } from "@/lib/i18n";

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
// start → poll) and caches the result on the run, so the panel keeps showing
// the same threads on every later visit until the user pays for a refresh.
// Every search costs $0.50 (confirm step before charging). If a search was
// started but its result never got fetched (tab closed, poll window expired),
// `pendingRunId` lets this component finish that already-paid run for free.
export function OpportunityFinder({
  runId,
  enabled,
  unlocked,
  initialThreads,
  updatedAt,
  pendingRunId,
}: {
  runId: string;
  enabled: boolean;
  unlocked: boolean;
  initialThreads: Thread[] | null;
  /** When the saved threads were fetched (ISO), null if never. */
  updatedAt: string | null;
  /** Apify run that was paid for but never collected, if any. */
  pendingRunId: string | null;
}) {
  const [threads, setThreads] = useState<Thread[] | null>(initialThreads);
  const [busy, setBusy] = useState(false);
  const [armed, setArmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const t = useT();

  // After router.refresh() the server sends fresh props — adopt them, otherwise
  // the initial useState value would stick for the life of the component.
  useEffect(() => {
    setThreads(initialThreads);
  }, [initialThreads]);

  // Resume an already-paid search whose result was never collected. No charge:
  // /result only reads the run id the server itself stored.
  useEffect(() => {
    if (initialThreads !== null || !pendingRunId || !unlocked || !enabled) return;
    let cancelled = false;
    (async () => {
      setBusy(true);
      try {
        const collected = await poll(pendingRunId, (t) => !cancelled && setThreads(t));
        if (!cancelled && collected) router.refresh();
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingRunId, initialThreads, unlocked, enabled]);

  /** Poll a started Apify run until it finishes. Returns true if threads were
   *  saved server-side. Shared by a fresh search and by the resume path. */
  async function poll(
    apifyRunId: string,
    onThreads: (t: Thread[]) => void
  ): Promise<boolean> {
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
        onThreads(data.threads ?? []);
        return true;
      }
      if (data.status === "FAILED") {
        setError(t.opportunities.errSearchFailed);
        return false;
      }
    }
    setError(t.opportunities.errTimeout);
    return false;
  }

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
          startRes.status === 402
            ? t.opportunities.errNoBalance
            : startRes.status === 429
              ? t.opportunities.errDailyLimit
              : startRes.status === 422
                ? t.opportunities.errNoKeywords
                : startData?.detail
                  ? fill(t.opportunities.errStartDetail, { detail: startData.detail })
                  : t.opportunities.errStart
        );
        return;
      }
      const apifyRunId = startData.apifyRunId as string;

      const collected = await poll(apifyRunId, setThreads);
      if (collected) router.refresh(); // keep the server-rendered props in sync
    } catch {
      setError(t.opportunities.errNetwork);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel mb-10 px-6 py-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="display-lg text-ink" style={{ fontSize: "clamp(20px,2.6vw,26px)" }}>
            {t.opportunities.title}
          </h2>
          <p className="mt-1 text-sm text-ink-subtle">
            {t.opportunities.subtitle}
          </p>
          {threads && updatedAt && (
            <p className="mt-1 text-xs text-ink-tertiary">
              {fill(t.opportunities.saved, {
                date: new Date(updatedAt).toLocaleString(),
              })}
            </p>
          )}
        </div>
        {enabled && unlocked && !armed && (
          <button
            onClick={() => setArmed(true)}
            disabled={busy}
            className="focus-ring btn-press shrink-0 rounded-md border-2 border-hairline-strong bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
          >
            {busy ? (
              <>{t.opportunities.searching}<Dots /></>
            ) : threads ? (
              t.opportunities.refresh
            ) : (
              t.opportunities.find
            )}
          </button>
        )}
        {enabled && unlocked && armed && !busy && (
          <span className="flex shrink-0 items-center gap-2">
            <span className="text-xs text-ink-muted">{t.opportunities.charge}</span>
            <button
              onClick={() => {
                setArmed(false);
                run();
              }}
              className="focus-ring btn-press rounded-md border-2 border-hairline-strong bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover"
            >
              {t.opportunities.confirm}
            </button>
            <button
              onClick={() => setArmed(false)}
              className="focus-ring btn-press rounded-md border-2 border-hairline-strong bg-surface-2 px-3 py-1.5 text-sm text-ink"
            >
              {t.opportunities.cancel}
            </button>
          </span>
        )}
      </div>

      {!enabled && (
        <p className="text-sm text-ink-tertiary">{t.opportunities.soon}</p>
      )}

      {enabled && !unlocked && (
        <p className="text-sm text-ink-tertiary">
          {t.opportunities.locked}
        </p>
      )}

      {busy && (
        <p className="text-sm text-ink-subtle">
          {t.opportunities.busy}<Dots />
        </p>
      )}

      {error && <p className="text-sm text-red-700">{error}</p>}

      {unlocked && threads && threads.length === 0 && !busy && (
        <p className="text-sm text-ink-tertiary">
          {t.opportunities.empty}
        </p>
      )}

      {unlocked && threads && threads.length > 0 && threads.length < 5 && !busy && (
        <p className="mt-2 text-xs text-ink-tertiary">
          {fill(t.opportunities.few, { count: threads.length })}
        </p>
      )}

      {unlocked && threads && threads.length > 0 && (
        <ul className="mt-1 space-y-2">
          {threads.map((thread, i) => (
            <li key={i}>
              <a
                href={thread.url}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring group flex items-start justify-between gap-3 rounded-md border border-hairline bg-surface-1 px-3 py-2 hover:bg-surface-2"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm text-ink group-hover:text-primary">
                    {thread.title}
                  </span>
                  <span className="text-xs text-ink-subtle">
                    {thread.subreddit
                      ? `r/${thread.subreddit.replace(/^r\//, "")}`
                      : "reddit"}
                    {thread.comments != null
                      ? ` · ${fill(t.opportunities.commentsSuffix, { n: thread.comments })}`
                      : ""}
                    {thread.upvotes != null
                      ? ` · ${fill(t.opportunities.upvotesSuffix, { n: thread.upvotes })}`
                      : ""}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-ink-tertiary">{t.opportunities.open}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
