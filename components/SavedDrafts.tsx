"use client";

import { useState } from "react";
import Link from "next/link";

// Profile "Saved drafts" list. Each row shows the community AND which project
// (launch map) the draft belongs to. When there are many, the whole list can be
// collapsed so the profile stays tidy — styled to match the rest of the site.
export interface SavedDraftItem {
  runId: string;
  community: string;
  title: string;
  project: string;
}

const COLLAPSE_THRESHOLD = 4; // offer collapsing once the list gets long

export function SavedDrafts({ items }: { items: SavedDraftItem[] }) {
  const many = items.length > COLLAPSE_THRESHOLD;
  // Long lists start collapsed; short ones are always open.
  const [open, setOpen] = useState(!many);

  return (
    <section className="mb-12">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="eyebrow">
          Saved drafts{items.length > 0 ? ` · ${items.length}` : ""}
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
            No drafts yet. Generate one from any community on a map.
          </p>
        </div>
      ) : !open ? (
        <button
          onClick={() => setOpen(true)}
          className="focus-ring btn-press w-full rounded-md border-2 border-dashed border-hairline-strong/40 px-6 py-5 text-center text-sm text-ink-subtle hover:bg-surface-1"
        >
          {items.length} saved drafts — click to show
        </button>
      ) : (
        <ul className="space-y-3">
          {items.map((d, i) => (
            <li
              key={`${d.runId}-${i}`}
              className="rounded-md border-2 border-hairline-strong bg-surface-1 px-5 py-4"
            >
              <div className="mb-1 flex items-center justify-between gap-3">
                <span className="text-ink">{d.community}</span>
                <Link
                  href={`/map/${d.runId}`}
                  className="menu-link rounded-sm text-xs text-primary"
                >
                  open map →
                </Link>
              </div>
              {/* which project this post is for */}
              <p className="mb-1 text-xs text-ink-tertiary">
                <span className="text-ink-subtle">Project · </span>
                {d.project}
              </p>
              <p className="truncate text-sm text-ink-muted">{d.title}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
