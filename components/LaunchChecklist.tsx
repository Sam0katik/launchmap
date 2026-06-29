"use client";

import { useState } from "react";

const TONE: Record<string, string> = {
  ok: "border-success/50 text-success",
  warn: "border-[#b06a00]/50 text-[#b06a00]",
  bad: "border-red-700/50 text-red-700",
};

export interface ChecklistItem {
  communityId: number;
  name: string;
  platform: string;
  policyLabel: string;
  policyTone: "ok" | "warn" | "bad";
  bestTime: string | null;
  href: string;
}

// A launch route with checkboxes — the ordered sequence of where to post, with
// progress saved on the run. Shown on an unlocked map.
export function LaunchChecklist({
  runId,
  items,
  initialDone,
}: {
  runId: string;
  items: ChecklistItem[];
  initialDone: number[];
}) {
  const [done, setDone] = useState<Set<number>>(new Set(initialDone));
  const [open, setOpen] = useState(true);

  async function toggle(communityId: number) {
    const next = new Set(done);
    const value = !next.has(communityId);
    if (value) next.add(communityId);
    else next.delete(communityId);
    setDone(next); // optimistic
    try {
      await fetch("/api/checklist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ runId, communityId, done: value }),
      });
    } catch {
      /* keep optimistic state; a refresh re-syncs */
    }
  }

  const total = items.length;
  const count = items.filter((i) => done.has(i.communityId)).length;
  const pct = total ? Math.round((count / total) * 100) : 0;

  return (
    <section className="panel mb-10 px-8 pb-6 pt-6">
      <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-widest text-ink-subtle">
        <span>Launch checklist · your route</span>
        <button
          onClick={() => setOpen((v) => !v)}
          className="menu-link rounded-sm"
        >
          {open ? "− hide" : "+ show"}
        </button>
      </div>
      <div className="receipt-rule mb-4" />

      {/* progress */}
      <div className="mb-4 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="tnum shrink-0 text-sm text-ink-muted">
          {count} / {total}
        </span>
      </div>

      <p className="mb-4 text-xs text-ink-tertiary">
        Warm up first — comment for a few days &amp; hit 50+ karma before posting.
        Then work down the list (easy wins first), one per session.
      </p>

      {open && (
        <ol className="space-y-1.5">
          {items.map((it, i) => {
            const isDone = done.has(it.communityId);
            return (
              <li
                key={it.communityId}
                className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                  isDone
                    ? "border-success/40 bg-success/5"
                    : "border-hairline bg-surface-1"
                }`}
              >
                <button
                  onClick={() => toggle(it.communityId)}
                  aria-pressed={isDone}
                  className={`focus-ring flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border-2 ${
                    isDone
                      ? "border-success bg-success text-white"
                      : "border-hairline-strong"
                  }`}
                >
                  {isDone ? "✓" : ""}
                </button>
                <span className="tnum w-5 shrink-0 text-xs text-ink-tertiary">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <span className={`text-sm ${isDone ? "text-ink-subtle line-through" : "text-ink"}`}>
                    {it.name}
                  </span>
                  <span className="ml-2 text-[11px] text-ink-tertiary">
                    {it.platform}
                    {it.bestTime ? ` · ${it.bestTime}` : ""}
                  </span>
                </div>
                <span
                  className={`hidden shrink-0 rounded-sm border px-1.5 py-0.5 text-[10px] sm:inline ${TONE[it.policyTone]}`}
                >
                  {it.policyLabel}
                </span>
                <a
                  href={it.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="menu-link shrink-0 rounded-sm text-xs text-primary"
                >
                  open →
                </a>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
