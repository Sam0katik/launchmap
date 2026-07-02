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

// Per-community posting brief: rules to follow here + a tailored angle + a
// fill-in skeleton. Color-coded and compact so it reads at a glance.
export function PostingBrief({
  community,
  analysis,
}: {
  community: Community;
  analysis?: ProductAnalysis | null;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const brief = buildBrief(community, analysis);
  const submitHref = bareSubmitLink(community) ?? community.url;
  const submitLabel = bareSubmitLink(community) ? "Open submit form" : "Open";

  async function copySkeleton() {
    try {
      await navigator.clipboard.writeText(
        brief.skeleton.map((s, i) => `${i + 1}. ${s}`).join("\n")
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard blocked */
    }
  }

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
            {/* status chips — only the two we can actually stand behind */}
            <div className="flex flex-wrap gap-1.5">
              <span className={`rounded border px-1.5 py-0.5 text-[11px] ${TONE[brief.policyTone]}`}>
                {brief.policyLabel}
              </span>
              <span className={`rounded border px-1.5 py-0.5 text-[11px] ${TONE[brief.linkTone]}`}>
                {brief.linkChip}
              </span>
            </div>

            {/* angle to lead with — the product-specific advice */}
            {brief.angle && (
              <div className="rounded border border-primary/40 bg-primary/5 px-2.5 py-1.5">
                <span className="eyebrow text-[9px] text-primary">Lead with</span>
                <p className="mt-0.5 text-ink">{brief.angle}</p>
              </div>
            )}

            {/* compact facts */}
            <dl className="grid grid-cols-[64px_1fr] gap-x-2 gap-y-1">
              <Row label="Where" value={brief.where} />
              <Row label="Length" value={brief.length} />
              <Row label="Title" value={brief.title} />
              {brief.bestTime && <Row label="Time" value={brief.bestTime} />}
            </dl>

            {/* real per-community rules */}
            {brief.rules && (
              <div className="rounded border border-hairline bg-surface-2/50 px-2.5 py-1.5">
                <span className="eyebrow text-[9px] text-ink-subtle">
                  Rules &amp; removal
                </span>
                <p className="mt-0.5 text-ink-muted">{brief.rules}</p>
              </div>
            )}

            {/* live rules scraped from the sub itself */}
            {community.scraped_rules && community.scraped_rules.length > 0 && (
              <div className="rounded border border-hairline bg-surface-2/50 px-2.5 py-1.5">
                <span className="eyebrow text-[9px] text-ink-subtle">
                  Live sub rules
                </span>
                <ul className="mt-0.5 space-y-0.5">
                  {community.scraped_rules.slice(0, 5).map((r, i) => (
                    <li key={i} className="text-ink-muted">
                      {i + 1}. {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {brief.karmaNote && (
              <p className="text-[11px] text-ink-tertiary">⚑ {brief.karmaNote}</p>
            )}

            {/* skeleton */}
            <div className="rounded border border-hairline bg-surface-2/50 px-2.5 py-2">
              <div className="mb-1 flex items-center justify-between">
                <span className="eyebrow text-[9px] text-ink-subtle">
                  Skeleton — write your own
                </span>
                <button
                  onClick={copySkeleton}
                  className="menu-link rounded text-[10px] text-ink-muted"
                >
                  {copied ? "copied" : "copy"}
                </button>
              </div>
              <ol className="space-y-1">
                {brief.skeleton.map((line, i) => (
                  <li key={i} className="flex gap-1.5 text-ink-muted">
                    <span className="tnum text-primary">{i + 1}</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ol>
            </div>

            <p className="text-[11px] text-ink-tertiary">{brief.warn}</p>
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
      <dt className="eyebrow text-[9px] text-ink-subtle">{label}</dt>
      <dd className="text-ink-muted">{value}</dd>
    </>
  );
}
