"use client";

import { useState } from "react";
import { Dots } from "@/components/Dots";

export interface SavedRedditAccount {
  username: string;
  totalKarma: number;
  linkKarma: number;
  commentKarma: number;
  createdUtc: number;
  checkedAt: string;
}

// Reddit Snoo mark — orange disc, white alien head, antenna + smile.
function RedditGlyph({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden>
      <circle cx="10" cy="10" r="10" fill="#FF4500" />
      <line x1="10.1" y1="10.5" x2="13.4" y2="5.2" stroke="#fff" strokeWidth="1" />
      <circle cx="13.7" cy="4.7" r="1.4" fill="#fff" />
      <ellipse cx="10" cy="11.7" rx="6" ry="4.3" fill="#fff" />
      <circle cx="7.7" cy="11.2" r="1.15" fill="#FF4500" />
      <circle cx="12.3" cy="11.2" r="1.15" fill="#FF4500" />
      <path
        d="M7.8 13.5c.6.55 1.4.8 2.2.8s1.6-.25 2.2-.8"
        stroke="#FF4500"
        strokeWidth="0.9"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function ageDays(createdUtc: number): number {
  return createdUtc
    ? Math.floor((Date.now() / 1000 - createdUtc) / 86400)
    : 0;
}

function ageLabel(createdUtc: number): string {
  const days = ageDays(createdUtc);
  if (!days) return "—";
  if (days < 31) return `${days}d old`;
  if (days < 365) return `${Math.floor(days / 30)}mo old`;
  return `${(days / 365).toFixed(1)}y old`;
}

function verdict(k: SavedRedditAccount): {
  tone: string;
  label: string;
} {
  const days = ageDays(k.createdUtc);
  if (days < 7 || k.totalKarma < 10) {
    return { tone: "border-red-700/50 text-red-700 bg-red-700/5", label: "Too fresh" };
  }
  if (k.totalKarma < 50) {
    return {
      tone: "border-[#b06a00]/50 text-[#b06a00] bg-[#b06a00]/5",
      label: "Warming up",
    };
  }
  return { tone: "border-success/50 text-success bg-success/5", label: "Ready" };
}

// Concrete, rule-based improvement advice from the karma mix + age.
function recommendations(k: SavedRedditAccount): string[] {
  const days = ageDays(k.createdUtc);
  const recs: string[] = [];
  if (days < 14)
    recs.push(
      "Account is very young — wait ~2 weeks before any promo post; comment daily meanwhile."
    );
  if (k.totalKarma < 10)
    recs.push(
      "Under 10 karma most subs auto-remove you. Answer 5–10 questions in your niche to clear the floor."
    );
  else if (k.totalKarma < 50)
    recs.push(
      "Get to 50+ karma before the stricter subs — helpful comments in mid-size niche subs are the fastest safe route."
    );
  if (k.commentKarma < k.linkKarma)
    recs.push(
      "Post karma outweighs comment karma — that reads as a self-promoter to mods. Balance it with genuine comments."
    );
  if (k.commentKarma >= 50 && days >= 30)
    recs.push(
      "Solid comment history — start with the 'Welcome' subs on your map, one post per session."
    );
  if (recs.length === 0)
    recs.push(
      "Account looks healthy. Keep the 90/10 rule: ~9 helpful comments per 1 promo post."
    );
  return recs;
}

export function RedditKarmaCheck({
  enabled,
  initialAccounts,
  maxAccounts,
}: {
  enabled: boolean;
  initialAccounts: SavedRedditAccount[];
  maxAccounts: number;
}) {
  const [accounts, setAccounts] = useState<SavedRedditAccount[]>(initialAccounts);
  const [open, setOpen] = useState(initialAccounts.length > 0);
  const [name, setName] = useState("");
  const [confirming, setConfirming] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function runCheck(username: string) {
    setBusy(true);
    setError(null);
    try {
      const startRes = await fetch("/api/reddit/karma/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const startData = await startRes.json().catch(() => null);
      if (!startRes.ok || !startData?.apifyRunId) {
        setError(
          startRes.status === 402
            ? "Not enough balance — a check costs $0.50. Top up above."
            : startRes.status === 409 && startData?.error === "account_limit"
              ? `You can keep ${maxAccounts} accounts. Re-check an existing one instead.`
              : startRes.status === 400
                ? "Enter a valid username."
                : startData?.detail
                  ? `Couldn't start: ${startData.detail}`
                  : "Couldn't start the check — try again."
        );
        return;
      }

      for (let i = 0; i < 15; i++) {
        await new Promise((r) => setTimeout(r, 3000));
        const res = await fetch("/api/reddit/karma/result", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ apifyRunId: startData.apifyRunId }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data) continue;
        if (data.status === "SUCCEEDED") {
          if (data.karma) {
            const entry: SavedRedditAccount = {
              ...data.karma,
              username: data.karma.name ?? username,
              checkedAt: new Date().toISOString(),
            };
            setAccounts((prev) => [
              entry,
              ...prev.filter(
                (a) =>
                  a.username.toLowerCase() !== entry.username.toLowerCase()
              ),
            ]);
            setExpanded(entry.username);
            setName("");
          } else {
            setError("No such Reddit user (or the profile is private).");
          }
          return;
        }
        if (data.status === "FAILED") {
          setError("Check failed on Reddit — try again later.");
          return;
        }
      }
      setError("Taking too long — try again.");
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
      setConfirming(null);
    }
  }

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

  return (
    <div className="rounded-md border-2 border-hairline-strong bg-surface-1 p-5 shadow-[3px_4px_0_0_var(--color-hairline-strong)]">
      <div className="mb-3 flex items-center gap-2">
        <RedditGlyph size={20} />
        <span className="text-sm font-medium text-ink">Reddit readiness</span>
        <span className="text-xs text-ink-tertiary">
          {accounts.length}/{maxAccounts} accounts · $0.50 per check
        </span>
        <button
          onClick={() => setOpen(false)}
          className="menu-link ml-auto rounded-sm text-xs text-ink-tertiary"
        >
          − hide
        </button>
      </div>

      {/* saved accounts */}
      {accounts.length > 0 && (
        <ul className="mb-4 space-y-2">
          {accounts.map((a) => {
            const v = verdict(a);
            const isOpen = expanded === a.username;
            return (
              <li
                key={a.username}
                className="rounded-md border border-hairline bg-canvas/50 px-3 py-2.5"
              >
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={() => setExpanded(isOpen ? null : a.username)}
                    className="focus-ring rounded-sm text-sm text-ink hover:text-primary"
                  >
                    u/{a.username}
                  </button>
                  <span className={`rounded-sm border px-2 py-0.5 text-[11px] ${v.tone}`}>
                    {v.label}
                  </span>
                  <span className="tnum text-xs text-ink-subtle">
                    {a.totalKarma.toLocaleString()} karma
                  </span>
                  <span className="text-xs text-ink-tertiary">
                    {ageLabel(a.createdUtc)}
                  </span>
                  <span className="ml-auto flex items-center gap-2">
                    {confirming === a.username ? (
                      <>
                        <span className="text-xs text-ink-muted">$0.50?</span>
                        <button
                          onClick={() => runCheck(a.username)}
                          disabled={busy}
                          className="focus-ring btn-press rounded-sm bg-primary px-2.5 py-1 text-xs font-medium text-white disabled:opacity-60"
                        >
                          {busy ? <Dots /> : "Confirm"}
                        </button>
                        <button
                          onClick={() => setConfirming(null)}
                          disabled={busy}
                          className="focus-ring btn-press rounded-sm border border-hairline-strong px-2 py-1 text-xs text-ink disabled:opacity-60"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setConfirming(a.username)}
                        disabled={busy}
                        className="focus-ring btn-press rounded-sm border border-hairline-strong px-2.5 py-1 text-xs text-ink hover:bg-surface-2 disabled:opacity-60"
                      >
                        Re-check
                      </button>
                    )}
                  </span>
                </div>

                {isOpen && (
                  <div className="mt-2.5 border-t border-hairline pt-2.5">
                    <div className="flex flex-wrap gap-4 text-xs text-ink-subtle">
                      <span className="tnum">Post {a.linkKarma.toLocaleString()}</span>
                      <span className="tnum">
                        Comment {a.commentKarma.toLocaleString()}
                      </span>
                      <span>
                        checked {new Date(a.checkedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <ul className="mt-2 space-y-1.5">
                      {recommendations(a).map((r, i) => (
                        <li key={i} className="flex gap-2 text-sm text-ink-muted">
                          <span className="text-primary">→</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* add a new account */}
      {enabled && accounts.length < maxAccounts && (
        <>
          {confirming === "__new__" ? (
            <div className="flex flex-wrap items-center gap-2 rounded-md border-2 border-hairline-strong bg-canvas px-3 py-2.5">
              <span className="text-sm text-ink-muted">
                Check <span className="text-ink">u/{name.trim()}</span> for $0.50?
              </span>
              <button
                onClick={() => runCheck(name.trim())}
                disabled={busy}
                className="focus-ring btn-press rounded-sm bg-primary px-3 py-1 text-xs font-medium text-white disabled:opacity-60"
              >
                {busy ? <>Checking<Dots /></> : "Confirm — $0.50"}
              </button>
              <button
                onClick={() => setConfirming(null)}
                disabled={busy}
                className="focus-ring btn-press rounded-sm border border-hairline-strong px-3 py-1 text-xs text-ink disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (name.trim()) setConfirming("__new__");
              }}
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
                className="min-w-0 flex-1 bg-transparent px-1.5 py-2.5 text-sm text-ink outline-none"
              />
              <button
                type="submit"
                disabled={busy}
                className="btn-press m-1 rounded-sm bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
              >
                Check · $0.50
              </button>
            </form>
          )}
        </>
      )}

      {!enabled && (
        <p className="text-sm text-ink-tertiary">Connecting soon.</p>
      )}

      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
    </div>
  );
}
