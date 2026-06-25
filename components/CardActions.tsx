"use client";

import { useState } from "react";
import Link from "next/link";
import type { Community } from "@/lib/types";

// Unlocked-card action: generate ONE post for this community (lazy, saved to the
// run). The post itself is read/edited/submitted from the profile — the card
// only kicks off generation, then points the user to their profile. This keeps
// the map scannable and puts all "ready posts" in one place.
export interface InitialDraft {
  title: string;
  body: string;
  regenLeft: number;
}

const ERR: Record<string, string> = {
  auth_required: "Sign in first.",
  locked: "Unlock this map to draft here.",
  ai_not_configured: "AI key not set in this environment.",
  draft_failed: "Generation failed. Try again.",
  empty_draft: "Got an empty draft. Try again.",
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
  const [ready, setReady] = useState<boolean>(!!initialDraft);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setReady(true);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {!ready && runId && (
          <button
            onClick={generate}
            disabled={loading}
            className="focus-ring btn-press rounded-sm border-2 border-hairline-strong bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
          >
            {loading ? "Writing…" : "✦ Generate post"}
          </button>
        )}
        {ready && (
          <Link
            href="/profile"
            className="focus-ring btn-press inline-block rounded-sm border-2 border-hairline-strong bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-hover"
          >
            ✓ Post ready — open in profile →
          </Link>
        )}
        <a
          href={community.url}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring btn-press inline-block rounded-sm border-2 border-hairline-strong bg-surface-2 px-3 py-2 text-sm text-ink hover:bg-surface-3"
        >
          Open →
        </a>
      </div>
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}
