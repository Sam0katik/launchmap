"use client";

import { useState } from "react";
import { buildBrief } from "@/lib/posting-brief";
import { bareSubmitLink } from "@/lib/submit-links";
import type { Community } from "@/lib/types";

// Per-community posting brief: the exact rules to follow here (where to post,
// links, length, title, karma, timing) plus a fill-in skeleton so the user
// writes their OWN compliant post. No AI — derived from the curated rules.
export function PostingBrief({ community }: { community: Community }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const brief = buildBrief(community);
  const submitHref = bareSubmitLink(community) ?? community.url;
  const submitLabel = bareSubmitLink(community)
    ? "Open submit form →"
    : "Open →";

  async function copySkeleton() {
    try {
      await navigator.clipboard.writeText(brief.skeleton.join("\n\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <div className="space-y-2">
      <div className="rounded-sm border border-hairline bg-canvas/60 p-3 text-xs">
        <div className="flex items-center justify-between gap-3">
          <span className="eyebrow text-[10px] text-ink">✦ Posting brief</span>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="focus-ring btn-press shrink-0 rounded-md border-2 border-hairline-strong bg-surface-2 px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-3"
          >
            {open ? "− Hide" : "+ Show rules"}
          </button>
        </div>

        {open && (
          <div className="mt-3 space-y-3">
            <dl className="space-y-2">
              <Row label="Where" value={brief.where} />
              <Row label="Links" value={brief.links} />
              <Row label="Length" value={brief.length} />
              <Row label="Title" value={brief.title} />
              <Row label="Karma" value={brief.karma} />
              <Row label="Account" value={brief.account} />
              {brief.bestTime && <Row label="Best time" value={brief.bestTime} />}
            </dl>

            <div className="grid gap-3 sm:grid-cols-2">
              <List label="Do" items={brief.dos} tone="ok" />
              <List label="Don't" items={brief.donts} tone="bad" />
            </div>

            {/* fill-in skeleton — the user writes the real post into this shape */}
            <div className="rounded-sm border border-hairline bg-surface-2/60 p-2.5">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="eyebrow text-[10px]">Skeleton — write your own</span>
                <button
                  onClick={copySkeleton}
                  className="menu-link rounded-sm text-[11px] text-ink-muted"
                >
                  {copied ? "copied" : "copy"}
                </button>
              </div>
              <ol className="space-y-1.5">
                {brief.skeleton.map((line, i) => (
                  <li key={i} className="flex gap-2 text-ink-muted">
                    <span className="tnum text-ink-tertiary">{i + 1}.</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ol>
            </div>

            <p className="text-[11px] text-ink-tertiary">
              Write it yourself in your own words — it reads human and won&apos;t
              get auto-flagged like a template.
            </p>
          </div>
        )}
      </div>

      <a
        href={submitHref}
        target="_blank"
        rel="noopener noreferrer"
        className="focus-ring btn-press inline-block rounded-sm border-2 border-hairline-strong bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-hover"
      >
        {submitLabel}
      </a>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="eyebrow w-20 shrink-0 text-[10px]">{label}</dt>
      <dd className="text-ink-muted">{value}</dd>
    </div>
  );
}

function List({
  label,
  items,
  tone,
}: {
  label: string;
  items: string[];
  tone: "ok" | "bad";
}) {
  return (
    <div>
      <span
        className={`eyebrow text-[10px] ${tone === "ok" ? "text-success" : "text-red-700"}`}
      >
        {label}
      </span>
      <ul className="mt-1 space-y-1 text-ink-muted">
        {items.map((it, i) => (
          <li key={i} className="flex gap-1.5">
            <span className="text-ink-tertiary">·</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
