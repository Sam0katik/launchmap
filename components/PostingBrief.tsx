"use client";

import { useState } from "react";
import { buildBrief } from "@/lib/posting-brief";
import { bareSubmitLink } from "@/lib/submit-links";
import type { Community, ProductAnalysis } from "@/lib/types";

const TONE: Record<string, string> = {
  ok: "border-success/50 text-success bg-success/5",
  warn: "border-[#b06a00]/50 text-[#b06a00] bg-[#b06a00]/5",
  bad: "border-red-700/50 text-red-700 bg-red-700/5",
};

// Per-community posting brief: only the facts we can stand behind — whether a
// link is allowed, best time to post, and the karma bar to post here — plus the
// real per-community and live-pinned rules. No advice, no fill-in template.
export function PostingBrief({
  community,
  analysis,
}: {
  community: Community;
  analysis?: ProductAnalysis | null;
}) {
  const [open, setOpen] = useState(false);
  const [showAllRules, setShowAllRules] = useState(false);
  const brief = buildBrief(community, analysis);
  const submitHref = bareSubmitLink(community) ?? community.url;
  const submitLabel = bareSubmitLink(community) ? "Open submit form" : "Open";
  // Real rules scraped straight from the subreddit (populated by the admin
  // Reddit scan into scraped_rules). When present these are the source of truth;
  // otherwise fall back to the curated one-line summary.
  const subName = community.name.replace(/^r\//i, "").replace(/\s*\([^)]*\)\s*$/, "").trim();
  const liveRules = Array.isArray(community.scraped_rules)
    ? community.scraped_rules.filter(Boolean)
    : [];
  const karmaValue = brief.karmaTier
    ? brief.karmaNote
      ? `${brief.karmaTier} — ${brief.karmaNote}`
      : brief.karmaTier
    : brief.karmaNote || null;

  return (
    <div className="space-y-2">
      <div className="rounded-md border border-hairline bg-canvas/50 p-3 text-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="eyebrow text-[10px] text-ink">Posting brief</span>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="focus-ring btn-press rounded border border-hairline-strong bg-surface-2 px-2 py-0.5 text-[11px] text-ink hover:bg-surface-3"
          >
            {open ? "Hide" : "Show rules"}
          </button>
        </div>

        {open && (
          <div className="mt-2.5 space-y-2.5">
            {/* the one status we lead with: can you post a link here or not */}
            <div className="flex flex-wrap gap-1.5">
              <span className={`rounded border px-1.5 py-0.5 text-[11px] ${TONE[brief.linkTone]}`}>
                {brief.linkChip}
              </span>
            </div>

            {/* facts only: best time + karma bar to post here */}
            {(brief.bestTime || karmaValue) && (
              <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1">
                {brief.bestTime && <Row label="Best time" value={brief.bestTime} />}
                {karmaValue && <Row label="Karma" value={karmaValue} />}
              </dl>
            )}

            {/* Rules straight from the subreddit (scraped). Collapsible so a long
                list doesn't blow up the card. Falls back to the curated summary
                when the sub hasn't been scanned yet. */}
            {liveRules.length > 0 ? (
              <div className="rounded border border-hairline bg-surface-2/50 px-2.5 py-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="eyebrow text-[9px] text-ink-subtle">
                    Rules · r/{subName}
                  </span>
                  {liveRules.length > 4 && (
                    <button
                      onClick={() => setShowAllRules((v) => !v)}
                      className="menu-link rounded text-[10px] text-ink-muted"
                    >
                      {showAllRules ? "collapse" : `show all ${liveRules.length}`}
                    </button>
                  )}
                </div>
                <ol className="mt-0.5 space-y-0.5">
                  {(showAllRules ? liveRules : liveRules.slice(0, 4)).map((r, i) => (
                    <li key={i} className="flex gap-1.5 text-ink-muted">
                      <span className="tnum text-ink-subtle">{i + 1}</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : (
              brief.rules && (
                <div className="rounded border border-hairline bg-surface-2/50 px-2.5 py-1.5">
                  <span className="eyebrow text-[9px] text-ink-subtle">
                    Rules &amp; removal
                  </span>
                  <p className="mt-0.5 text-ink-muted">{brief.rules}</p>
                </div>
              )
            )}
          </div>
        )}
      </div>

      <a
        href={submitHref}
        target="_blank"
        rel="noopener noreferrer"
        className="focus-ring btn-press inline-block rounded border-2 border-hairline-strong bg-primary px-2.5 py-1 text-xs font-medium text-white hover:bg-primary-hover"
      >
        {submitLabel} →
      </a>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="eyebrow whitespace-nowrap text-[9px] text-ink-subtle">{label}</dt>
      <dd className="text-ink-muted">{value}</dd>
    </>
  );
}
