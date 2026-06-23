"use client";

import { useState } from "react";
import { buildSubmitLink } from "@/lib/submit-links";
import type { Community } from "@/lib/types";

// Unlocked-card actions: generate a tailored draft (Sonnet, lazy + cached) and
// open the platform's submit form pre-filled with it. Before a draft exists the
// submit link still works with a neutral placeholder; once generated, the real
// draft flows into both the on-card view and the submit link.
interface Draft {
  title: string;
  body: string;
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
};

export function CardActions({
  community,
  runId,
}: {
  community: Community;
  runId?: string;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"title" | "body" | null>(null);
  const [open, setOpen] = useState(false); // draft starts collapsed

  async function generate() {
    if (!runId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ runId, communityId: community.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(ERR[data.error] ?? "Something went wrong.");
        return;
      }
      setDraft({ title: clean(data.title), body: clean(data.body) });
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
          {/* collapsible header — keeps the card compact until expanded */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="focus-ring flex w-full items-center justify-between rounded-sm"
            aria-expanded={open}
          >
            <span className="eyebrow text-[10px] text-ink">✦ Draft ready</span>
            <span className="text-[11px] text-ink-muted">
              {open ? "− hide" : "+ show full"}
            </span>
          </button>

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
            onClick={generate}
            disabled={loading}
            className="focus-ring btn-press rounded-sm border-2 border-hairline-strong bg-surface-2 px-3 py-2 text-sm text-ink hover:bg-surface-3 disabled:opacity-60"
          >
            {loading ? "Writing…" : "✦ Generate draft"}
          </button>
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
