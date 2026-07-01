"use client";

import { useState } from "react";

interface Karma {
  name: string;
  totalKarma: number;
  linkKarma: number;
  commentKarma: number;
  createdUtc: number;
}

// Readiness verdict from karma + account age. Reddit's real per-sub thresholds
// aren't public, so this is guidance, not a guarantee.
function verdict(k: Karma): { tone: string; label: string; note: string } {
  const ageDays = k.createdUtc
    ? Math.floor((Date.now() / 1000 - k.createdUtc) / 86400)
    : 0;
  if (ageDays < 7 || k.totalKarma < 10) {
    return {
      tone: "border-red-700/50 text-red-700 bg-red-700/5",
      label: "Too fresh",
      note: "New account. Comment genuinely for a few days and clear ~10+ karma before any link post — most subs auto-remove brand-new accounts.",
    };
  }
  if (k.totalKarma < 50) {
    return {
      tone: "border-[#b06a00]/50 text-[#b06a00] bg-[#b06a00]/5",
      label: "Warming up",
      note: "Getting there. Aim for 50+ karma and keep commenting; then start with the 'Welcome' subs before the strict ones.",
    };
  }
  return {
    tone: "border-success/50 text-success bg-success/5",
    label: "Ready",
    note: "You clear most subs' basic filters. Still read each sub's rules and lead with value, not a bare link.",
  };
}

function ageLabel(createdUtc: number): string {
  if (!createdUtc) return "—";
  const days = Math.floor((Date.now() / 1000 - createdUtc) / 86400);
  if (days < 31) return `${days}d old`;
  if (days < 365) return `${Math.floor(days / 30)}mo old`;
  return `${(days / 365).toFixed(1)}y old`;
}

export function RedditKarmaCheck() {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [karma, setKarma] = useState<Karma | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function check(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    setKarma(null);
    try {
      const res = await fetch(
        `/api/reddit/karma?u=${encodeURIComponent(name.trim())}`
      );
      const data = await res.json().catch(() => null);
      if (res.ok && data?.karma) setKarma(data.karma);
      else if (res.status === 404) setError("No such Reddit user.");
      else if (res.status === 400) setError("Enter a valid username.");
      else setError("Couldn't reach Reddit right now — try again.");
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  const v = karma ? verdict(karma) : null;

  return (
    <div className="rounded-md border-2 border-hairline-strong bg-surface-1 px-5 py-5">
      <form onSubmit={check} className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-ink-muted">reddit.com/user/</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="yourname"
          spellCheck={false}
          className="focus-ring min-w-0 flex-1 rounded-sm border-2 border-hairline-strong bg-canvas px-2.5 py-1.5 text-sm text-ink"
        />
        <button
          type="submit"
          disabled={busy}
          className="focus-ring btn-press rounded-md border-2 border-hairline-strong bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {busy ? "Checking…" : "Check"}
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}

      {karma && v && (
        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-ink">u/{karma.name}</span>
            <span className={`rounded-sm border px-2 py-0.5 text-xs ${v.tone}`}>
              {v.label}
            </span>
            <span className="text-xs text-ink-tertiary">
              {ageLabel(karma.createdUtc)}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <Metric label="Total" value={karma.totalKarma} />
            <Metric label="Post" value={karma.linkKarma} />
            <Metric label="Comment" value={karma.commentKarma} />
          </div>
          <p className="mt-3 text-sm text-ink-muted">{v.note}</p>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <span className="tnum text-lg text-ink">{value.toLocaleString()}</span>
      <span className="ml-1.5 text-xs uppercase tracking-widest text-ink-subtle">
        {label}
      </span>
    </div>
  );
}
