"use client";

import { useState } from "react";
import Link from "next/link";
import { buildSubmitLink } from "@/lib/submit-links";
import type { Community } from "@/lib/types";

// Profile "Ready posts" — the home for every generated post. Each entry shows
// the full title + body (copy buttons), which project + community it's for, a
// one-click prefilled submit link, and a capped Regenerate. This is where the
// user reads, edits, and posts from (the map card only triggers generation).
export interface SavedDraftItem {
  runId: string;
  communityId: number;
  community: string;
  platform: string;
  submitTemplate: string | null;
  project: string;
  title: string;
  body: string;
  regenLeft: number;
}

function clean(s: string): string {
  return (s ?? "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`(.*?)`/g, "$1")
    .trim();
}

const COLLAPSE_THRESHOLD = 4;

export function SavedDrafts({ items }: { items: SavedDraftItem[] }) {
  const many = items.length > COLLAPSE_THRESHOLD;
  const [open, setOpen] = useState(!many);

  return (
    <section className="mb-12">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="eyebrow">
          Ready posts{items.length > 0 ? ` · ${items.length}` : ""}
        </h2>
        {many && (
          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="focus-ring btn-press rounded-md border-2 border-hairline-strong bg-surface-2 px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-3"
          >
            {open ? "− Collapse" : `+ Show all (${items.length})`}
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-md border-2 border-dashed border-hairline-strong/40 px-6 py-8 text-center">
          <p className="text-sm text-ink-subtle">
            No posts yet. Open a map and tap{" "}
            <span className="text-ink">Generate post</span> on a community.
          </p>
        </div>
      ) : !open ? (
        <button
          onClick={() => setOpen(true)}
          className="focus-ring btn-press w-full rounded-md border-2 border-dashed border-hairline-strong/40 px-6 py-5 text-center text-sm text-ink-subtle hover:bg-surface-1"
        >
          {items.length} ready posts — click to show
        </button>
      ) : (
        <ul className="space-y-4">
          {items.map((d, i) => (
            <PostCard key={`${d.runId}-${d.communityId}-${i}`} item={d} />
          ))}
        </ul>
      )}
    </section>
  );
}

function PostCard({ item }: { item: SavedDraftItem }) {
  const [title, setTitle] = useState(clean(item.title));
  const [body, setBody] = useState(clean(item.body));
  const [regenLeft, setRegenLeft] = useState(item.regenLeft);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<"title" | "body" | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const community = {
    id: item.communityId,
    name: item.community,
    platform: item.platform,
    submit_template: item.submitTemplate,
  } as unknown as Community;
  const submitHref = buildSubmitLink(community, { title, body });

  async function copy(which: "title" | "body", text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 1200);
    } catch {
      /* clipboard blocked */
    }
  }

  async function regenerate() {
    setLoading(true);
    setNote(null);
    try {
      const res = await fetch("/api/draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          runId: item.runId,
          communityId: item.communityId,
          regenerate: true,
        }),
      });
      const data = await res.json();
      if (data.error === "regen_limit") {
        setRegenLeft(0);
        setNote("No regenerations left for this one.");
        return;
      }
      if (!res.ok) {
        setNote("Couldn't regenerate. Try again.");
        return;
      }
      setTitle(clean(data.title));
      setBody(clean(data.body));
      if (typeof data.regenLeft === "number") setRegenLeft(data.regenLeft);
    } catch {
      setNote("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <li className="rounded-md border-2 border-hairline-strong bg-surface-1 px-5 py-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-ink">{item.community}</span>
          <span className="ml-2 text-xs text-ink-tertiary">
            for {item.project}
          </span>
        </div>
        <Link
          href={`/map/${item.runId}`}
          className="menu-link rounded-sm text-xs text-primary"
        >
          open map →
        </Link>
      </div>

      <Field
        label="Title"
        value={title}
        copied={copied === "title"}
        onCopy={() => copy("title", title)}
      />
      <Field
        label="Body"
        value={body}
        multiline
        copied={copied === "body"}
        onCopy={() => copy("body", body)}
      />

      <p className="mt-2 text-[11px] text-ink-tertiary">
        Adapt before posting — verbatim AI posts get detected and downvoted.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {submitHref ? (
          <a
            href={submitHref}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring btn-press rounded-sm border-2 border-hairline-strong bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Open prefilled submit form →
          </a>
        ) : null}
        {regenLeft > 0 ? (
          <button
            onClick={regenerate}
            disabled={loading}
            className="focus-ring btn-press rounded-sm border-2 border-hairline-strong bg-surface-2 px-3 py-1.5 text-sm text-ink hover:bg-surface-3 disabled:opacity-60"
          >
            {loading ? "Rewriting…" : `↻ Regenerate (${regenLeft} left)`}
          </button>
        ) : (
          <span className="rounded-sm border border-hairline px-3 py-1.5 text-xs text-ink-tertiary">
            No regenerations left
          </span>
        )}
      </div>
      {note && <p className="mt-2 text-xs text-red-700">{note}</p>}
    </li>
  );
}

function Field({
  label,
  value,
  multiline = false,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="mt-2">
      <div className="mb-1 flex items-center justify-between">
        <span className="eyebrow text-[10px]">{label}</span>
        <button
          onClick={onCopy}
          className="menu-link rounded-sm text-[11px] text-ink-muted"
        >
          {copied ? "copied" : "copy"}
        </button>
      </div>
      <p
        className={`text-sm text-ink-muted ${
          multiline ? "whitespace-pre-wrap" : "truncate"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
