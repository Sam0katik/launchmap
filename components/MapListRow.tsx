"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DeleteMapButton } from "@/components/DeleteMapButton";

// One row in the profile's launch-map list. Whole row links to the map; a
// Rename control swaps the title for an inline input (which lifts above the
// stretched link so typing/clicking works).
export function MapListRow({
  id,
  url,
  initialTitle,
  derivedName,
  unlocked,
  createdAt,
}: {
  id: string;
  url: string;
  initialTitle: string | null;
  derivedName: string;
  unlocked: boolean;
  createdAt: string;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle ?? "");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const display = title.trim() || derivedName;

  async function save() {
    setBusy(true);
    const res = await fetch("/api/runs/rename", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ runId: id, title: title.trim() }),
    });
    setBusy(false);
    if (res.ok) {
      setEditing(false);
      router.refresh();
    }
  }

  return (
    <li className="relative flex items-center justify-between gap-4 rounded-md border-2 border-hairline-strong bg-surface-1 px-5 py-4 shadow-[3px_4px_0_0_var(--color-hairline-strong)] transition-colors hover:bg-surface-2">
      {!editing && (
        <Link
          href={`/map/${id}`}
          aria-label={`Open ${display}`}
          className="focus-ring absolute inset-0 rounded-md"
        />
      )}

      <div
        className={`relative min-w-0 flex-1 ${editing ? "" : "pointer-events-none"}`}
      >
        {editing ? (
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={derivedName}
              maxLength={60}
              autoFocus
              className="focus-ring min-w-0 flex-1 rounded-sm border-2 border-hairline-strong bg-canvas px-2.5 py-1 text-sm text-ink"
            />
            <button
              onClick={save}
              disabled={busy}
              className="focus-ring btn-press rounded-sm border-2 border-hairline-strong bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-primary-hover disabled:opacity-60"
            >
              {busy ? "…" : "Save"}
            </button>
            <button
              onClick={() => {
                setTitle(initialTitle ?? "");
                setEditing(false);
              }}
              disabled={busy}
              className="focus-ring btn-press rounded-sm border-2 border-hairline-strong bg-surface-2 px-3 py-1 text-xs text-ink disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <p className="truncate text-ink">{display}</p>
            <p className="mt-0.5 truncate text-xs text-ink-subtle">{url}</p>
          </>
        )}
      </div>

      {!editing && (
        <div className="relative flex shrink-0 items-center gap-3">
          <div className="text-right">
            <span
              className={`rounded-sm border px-2 py-0.5 text-xs ${
                unlocked
                  ? "border-success/50 text-success"
                  : "border-hairline text-ink-tertiary"
              }`}
            >
              {unlocked ? "Unlocked" : "Basic"}
            </span>
            <p className="mt-1 text-xs text-ink-tertiary">
              {new Date(createdAt).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={() => setEditing(true)}
            title="Rename map"
            className="focus-ring btn-press shrink-0 rounded-sm border-2 border-hairline-strong px-2.5 py-1 text-xs text-ink hover:bg-surface-2"
          >
            Rename
          </button>
          <DeleteMapButton runId={id} />
        </div>
      )}
    </li>
  );
}
