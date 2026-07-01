"use client";

import { useState } from "react";
import { Dots } from "@/components/Dots";

interface Karma {
  name: string;
  totalKarma: number;
  linkKarma: number;
  commentKarma: number;
  createdUtc: number;
}

// Small Reddit mark (snoo-ish) so the collapsed control is recognisable.
function RedditGlyph({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden>
      <circle cx="10" cy="10" r="10" fill="#FF4500" />
      <circle cx="10" cy="12" r="5.4" fill="#fff" />
      <circle cx="7.6" cy="11.4" r="1.15" fill="#FF4500" />
      <circle cx="12.4" cy="11.4" r="1.15" fill="#FF4500" />
      <path
        d="M7.7 14c.6.5 1.4.7 2.3.7s1.7-.2 2.3-.7"
        stroke="#FF4500"
        strokeWidth="0.9"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="15.2" cy="6.6" r="1.5" fill="#fff" />
      <path d="M10 6.6 13.9 5.9" stroke="#fff" strokeWidth="0.9" strokeLinecap="round" />
      <circle cx="10" cy="6.6" r="0.8" fill="#fff" />
    </svg>
  );
}

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
  const [open, setOpen] = useState(false);
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
      else if (res.status === 502)
        setError("Reddit is unreachable right now (relay). Try again shortly.");
      else setError("Couldn't check that — try again.");
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  // Collapsed: a single Reddit chip. Click → expand the whole check.
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="focus-ring btn-press inline-flex items-center gap-2.5 rounded-md border-2 border-hairline-strong bg-surface-1 px-4 py-2.5 text-sm text-ink hover:bg-surface-2"
      >
        <RedditGlyph />
        Check your Reddit karma
        <span className="text-ink-tertiary">→</span>
      </button>
    );
  }

  const v = karma ? verdict(karma) : null;

  return (
    <div className="rounded-md border-2 border-hairline-strong bg-surface-1 p-5 shadow-[3px_4px_0_0_var(--color-hairline-strong)]">
      <div className="mb-3 flex items-center gap-2">
        <RedditGlyph size={20} />
        <span className="text-sm font-medium text-ink">Reddit readiness</span>
        <button
          onClick={() => setOpen(false)}
          className="menu-link ml-auto rounded-sm text-xs text-ink-tertiary"
        >
          − hide
        </button>
      </div>

      <form
        onSubmit={check}
        className="flex items-stretch overflow-hidden rounded-md border-2 border-hairline-strong bg-canvas"
      >
        <span className="flex select-none items-center pl-3 text-sm text-ink-tertiary">
          reddit.com/user/
        </span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="yourname"
          spellCheck={false}
          autoFocus
          className="min-w-0 flex-1 bg-transparent px-1.5 py-2.5 text-sm text-ink outline-none"
        />
        <button
          type="submit"
          disabled={busy}
          className="btn-press m-1 rounded-sm bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {busy ? <>Checking<Dots /></> : "Check"}
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}

      {karma && v && (
        <div className="mt-4 rounded-md border border-hairline bg-canvas/50 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-ink">u/{karma.name}</span>
            <span className={`rounded-sm border px-2 py-0.5 text-xs ${v.tone}`}>
              {v.label}
            </span>
            <span className="text-xs text-ink-tertiary">
              {ageLabel(karma.createdUtc)}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-5">
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
