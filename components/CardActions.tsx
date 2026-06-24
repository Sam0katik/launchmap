"use client";

import { useState } from "react";
import { buildSubmitLink } from "@/lib/submit-links";
import type { Community } from "@/lib/types";

// Unlocked-card actions: generate a tailored draft (Sonnet, lazy + cached) and
// open the platform's submit form pre-filled with it. A draft, once generated,
// is saved on the run and re-shown on return (passed in as `initialDraft`), so
// the user never loses it and we never re-spend the API to show it again.
// Regeneration is capped (MAX_DRAFT_REGENS) to bound Anthropic cost.
interface Draft {
  title: string;
  body: string;
}

export interface InitialDraft {
  title: string;
  body: string;
  regenLeft: number;
}

/** Defensive markdown strip for drafts cached before the server-side cleanup. */
function clean(s: string): string {
  return (s ?? "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`(.*?)`/g, "$1")
    .trim();
}

const ERR: Record<string, string> = {
  auth_required: "Sign in first.",
  locked: "Unlock the full map to draft this one.",
  ai_not_configured: "AI key not set in this environment.",
  draft_failed: "Draft generation failed. Try again.",
  empty_draft: "Got an empty draft. Try again.",
  regen_limit: "No regenerations left for this one.",
};

export function CardActions({
  community,
  runId,
  initialDraft,
}: {
  community: Community;
  runId?: string;
  initialDraft?: InitialDraft;
}) {
  const [draft, setDraft] = useState<Draft | null>(
    initialDraft ? { title: clean(initialDraft.title), body: clean(initialDraft.body) } : null
  );
  const [regenLeft, setRegenLeft] = useState<number>(
    initialDraft?.regenLeft ?? 2
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"title" | "body" | null>(null);
  // Auto-open when a saved draft is already present so the user sees it's there.
  const [open, setOpen] = useState(false);

  async function run(regenerate: boolean) {
    if (!runId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ runId, communityId: community.id, regenerate }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(ERR[data.error] ?? "Something went wrong.");
        return;
      }
      if (data.error === "regen_limit") {
        // Server refused to spend more — keep the existing draft, zero the count.
        setRegenLeft(0);
        setError(ERR.regen_limit);
        if (data.title) setDraft({ title: clean(data.title), body: clean(data.body) });
        return;
      }
      setDraft({ title: clean(data.title), body: clean(data.body) });
      if (typeof data.regenLeft === "number") setRegenLeft(data.regenLeft);
      setOpen(true);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copy(which: "title" | "body", text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 1200);
    } catch {
      /* clipboard blocked — ignore */
    }
  }

  const placeholder = {
    title: `Built something for ${community.niche_tags[0] ?? "makers"} — feedback welcome`,
    body: "[Generate a draft to pre-fill this]",
  };
  const prefilled = buildSubmitLink(community, draft ?? placeholder);
  const submitHref = prefilled ?? community.url;
  const submitLabel = prefilled ? "Open prefilled submit form →" : "Open →";

  return (
    <div className="space-y-3">
      {draft && (
        <div className="rounded-sm border border-hairline bg-canvas/60 p-3 text-xs">
          {/* collapsible header — keeps the card compact until expanded. The
              toggle is a distinct, larger button set apart from the label. */}
          <div className="flex items-center justify-between gap-3">
            <span className="eyebrow text-[10px] text-ink">✦ Draft saved</span>
            <button
              onClick={() => setOpen((v) => !v)}
              className="focus-ring btn-press shrink-0 rounded-md border-2 border-hairline-strong bg-surface-2 px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-3"
              aria-expanded={open}
            >
              {open ? "− Hide" : "+ Show full"}
            </button>
          </div>

          {open && (
            <div className="mt-3 space-y-2">
              <Field
                label="Title"
                value={draft.title}
                copied={copied === "title"}
                onCopy={() => copy("title", draft.title)}
              />
              <Field
                label="Body"
                value={draft.body}
                multiline
                copied={copied === "body"}
                onCopy={() => copy("body", draft.body)}
              />
              <p className="text-[11px] text-ink-tertiary">
                Adapt before posting — verbatim template posts get detected.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {!draft && runId && (
          <button
            onClick={() => run(false)}
            disabled={loading}
            className="focus-ring btn-press rounded-sm border-2 border-hairline-strong bg-surface-2 px-3 py-2 text-sm text-ink hover:bg-surface-3 disabled:opacity-60"
          >
            {loading ? "Writing…" : "✦ Generate draft"}
          </button>
        )}
        {draft && runId && regenLeft > 0 && (
          <button
            onClick={() => run(true)}
            disabled={loading}
            title="Rewrite this draft from scratch"
            className="focus-ring btn-press rounded-sm border-2 border-hairline-strong bg-surface-2 px-3 py-2 text-sm text-ink hover:bg-surface-3 disabled:opacity-60"
          >
            {loading ? "Rewriting…" : `↻ Regenerate (${regenLeft} left)`}
          </button>
        )}
        {draft && runId && regenLeft <= 0 && (
          <span className="self-center rounded-sm border border-hairline px-3 py-2 text-xs text-ink-tertiary">
            No regenerations left
          </span>
        )}
        <a
          href={submitHref}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring btn-press inline-block rounded-sm border-2 border-hairline-strong bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-hover"
        >
          {submitLabel}
        </a>
      </div>

      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
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
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="eyebrow text-[10px]">{label}</span>
        <button
          onClick={onCopy}
          className="menu-link rounded-sm text-[11px] text-ink-muted"
        >
          {copied ? "copied" : "copy"}
        </button>
      </div>
      <p className={`text-ink-muted ${multiline ? "whitespace-pre-wrap" : "truncate"}`}>
        {value}
      </p>
    </div>
  );
}
