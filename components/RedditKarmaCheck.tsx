"use client";

import { useState } from "react";
import { Dots } from "@/components/Dots";
import { useT } from "@/components/LangProvider";
import { fill } from "@/lib/i18n";
import { KARMA_CHECK_PRICE_LABEL } from "@/lib/billing";

const PRICE = KARMA_CHECK_PRICE_LABEL;

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

type T = ReturnType<typeof useT>;

function ageLabel(createdUtc: number, t: T): string {
  const days = ageDays(createdUtc);
  if (!days) return "—";
  if (days < 31) return fill(t.karma.ageDays, { n: days });
  if (days < 365) return fill(t.karma.ageMonths, { n: Math.floor(days / 30) });
  return fill(t.karma.ageYears, { n: (days / 365).toFixed(1) });
}

function verdict(k: SavedRedditAccount, t: T): {
  tone: string;
  label: string;
} {
  const days = ageDays(k.createdUtc);
  if (days < 7 || k.totalKarma < 10) {
    return { tone: "border-red-700/50 text-red-700 bg-red-700/5", label: t.karma.verdictFresh };
  }
  if (k.totalKarma < 50) {
    return {
      tone: "border-[#b06a00]/50 text-[#b06a00] bg-[#b06a00]/5",
      label: t.karma.verdictWarming,
    };
  }
  return { tone: "border-success/50 text-success bg-success/5", label: t.karma.verdictReady };
}

// Concrete, rule-based improvement advice from the karma mix + age.
function recommendations(k: SavedRedditAccount, t: T): string[] {
  const days = ageDays(k.createdUtc);
  const recs: string[] = [];
  if (days < 14)
    recs.push(
      t.karma.recYoung
    );
  if (k.totalKarma < 10)
    recs.push(
      t.karma.recUnder10
    );
  else if (k.totalKarma < 50)
    recs.push(
      t.karma.recUnder50
    );
  if (k.commentKarma < k.linkKarma)
    recs.push(
      t.karma.recImbalance
    );
  if (k.commentKarma >= 50 && days >= 30)
    recs.push(
      t.karma.recSolid
    );
  if (recs.length === 0)
    recs.push(
      t.karma.recHealthy
    );
  return recs;
}

export function RedditKarmaCheck({
  enabled,
  eligible,
  initialAccounts,
  maxAccounts,
}: {
  enabled: boolean;
  eligible: boolean;
  initialAccounts: SavedRedditAccount[];
  maxAccounts: number;
}) {
  const [accounts, setAccounts] = useState<SavedRedditAccount[]>(initialAccounts);
  const t = useT();
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
            ? `Not enough balance — a check costs ${PRICE}. Top up above.`
            : startRes.status === 403 && startData?.error === "need_unlock"
              ? t.karma.errGate
              : startRes.status === 409 && startData?.error === "account_limit"
                ? `You can keep ${maxAccounts} accounts. Re-check an existing one instead.`
                : startRes.status === 400
                  ? t.karma.errInvalidName
                  : startRes.status === 429
                    ? t.karma.errDailyLimit
                  : startData?.detail
                    ? `Couldn't start: ${startData.detail}`
                    : t.karma.errStart
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
            setError(t.karma.errNoUser);
          }
          return;
        }
        if (data.status === "FAILED") {
          setError(t.karma.errFailed);
          return;
        }
      }
      setError(t.karma.errTimeout);
    } catch {
      setError(t.karma.errNetwork);
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
        {t.karma.cta}
        <span className="text-ink-tertiary">→</span>
      </button>
    );
  }

  return (
    <div className="rounded-md border-2 border-hairline-strong bg-surface-1 p-5 shadow-[3px_4px_0_0_var(--color-hairline-strong)]">
      <div className="mb-3 flex items-center gap-2">
        <RedditGlyph size={20} />
        <span className="text-sm font-medium text-ink">{t.karma.heading}</span>
        <span className="text-xs text-ink-tertiary">
          {fill(t.karma.meta, {
            n: accounts.length,
            max: maxAccounts,
            price: PRICE,
          })}
        </span>
        <button
          onClick={() => setOpen(false)}
          className="menu-link ml-auto rounded-sm text-xs text-ink-tertiary"
        >
          {t.karma.hide}
        </button>
      </div>

      {/* saved accounts */}
      {accounts.length > 0 && (
        <ul className="mb-4 space-y-2">
          {accounts.map((a) => {
            const v = verdict(a, t);
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
                    {fill(t.karma.karmaSuffix, { n: a.totalKarma.toLocaleString() })}
                  </span>
                  <span className="text-xs text-ink-tertiary">
                    {ageLabel(a.createdUtc, t)}
                  </span>
                  <span className="ml-auto flex items-center gap-2">
                    {confirming === a.username ? (
                      <>
                        <span className="text-xs text-ink-muted">{PRICE}?</span>
                        <button
                          onClick={() => runCheck(a.username)}
                          disabled={busy}
                          className="focus-ring btn-press rounded-sm bg-primary px-2.5 py-1 text-xs font-medium text-white disabled:opacity-60"
                        >
                          {busy ? <Dots /> : t.karma.confirm}
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
                        {t.karma.recheck}
                      </button>
                    )}
                  </span>
                </div>

                {isOpen && (
                  <div className="mt-2.5 border-t border-hairline pt-2.5">
                    <div className="flex flex-wrap gap-4 text-xs text-ink-subtle">
                      <span className="tnum">
                        {fill(t.karma.postKarma, { n: a.linkKarma.toLocaleString() })}
                      </span>
                      <span className="tnum">
                        {fill(t.karma.commentKarma, {
                          n: a.commentKarma.toLocaleString(),
                        })}
                      </span>
                      <span>
                        {fill(t.karma.checkedOn, {
                          date: new Date(a.checkedAt).toLocaleDateString(),
                        })}
                      </span>
                    </div>
                    <ul className="mt-2 space-y-1.5">
                      {recommendations(a, t).map((r, i) => (
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

      {/* gate: karma checks are part of a launch — need an unlocked map */}
      {enabled && !eligible && (
        <p className="text-sm text-ink-tertiary">
          {t.karma.gate}
        </p>
      )}

      {/* add a new account */}
      {enabled && eligible && accounts.length < maxAccounts && (
        <>
          {confirming === "__new__" ? (
            <div className="flex flex-wrap items-center gap-2 rounded-md border-2 border-hairline-strong bg-canvas px-3 py-2.5">
              <span className="text-sm text-ink-muted">
                {fill(t.karma.confirmNew, {
                  user: `u/${name.trim()}`,
                  price: PRICE,
                })}
              </span>
              <button
                onClick={() => runCheck(name.trim())}
                disabled={busy}
                className="focus-ring btn-press rounded-sm bg-primary px-3 py-1 text-xs font-medium text-white disabled:opacity-60"
              >
                {busy ? (
                  <>
                    {t.karma.checking}
                    <Dots />
                  </>
                ) : (
                  fill(t.karma.confirmPrice, { price: PRICE })
                )}
              </button>
              <button
                onClick={() => setConfirming(null)}
                disabled={busy}
                className="focus-ring btn-press rounded-sm border border-hairline-strong px-3 py-1 text-xs text-ink disabled:opacity-60"
              >
                {t.karma.cancel}
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
                placeholder={t.karma.namePlaceholder}
                spellCheck={false}
                className="min-w-0 flex-1 bg-transparent px-1.5 py-2.5 text-sm text-ink outline-none"
              />
              <button
                type="submit"
                disabled={busy}
                className="btn-press m-1 rounded-sm bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
              >
                {fill(t.karma.check, { price: PRICE })}
              </button>
            </form>
          )}
        </>
      )}

      {!enabled && (
        <p className="text-sm text-ink-tertiary">{t.karma.soon}</p>
      )}

      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
    </div>
  );
}
