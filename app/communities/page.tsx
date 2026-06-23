"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import communities from "@/data/communities.json";
import type { Community } from "@/lib/types";

// Convenient read-only access to the whole community DB: searchable, filterable
// table straight from data/communities.json. No backend needed.
const ALL = communities as unknown as Community[];

const POLICY_TONE: Record<string, string> = {
  welcome: "text-primary",
  megathread_only: "text-amber-400",
  comment_only: "text-amber-400",
  banned: "text-red-400",
};

export default function CommunitiesPage() {
  const [q, setQ] = useState("");
  const [platform, setPlatform] = useState("all");

  const platforms = useMemo(
    () => ["all", ...Array.from(new Set(ALL.map((c) => c.platform)))],
    []
  );

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return ALL.filter((c) => {
      if (platform !== "all" && c.platform !== platform) return false;
      if (!needle) return true;
      return (
        c.name.toLowerCase().includes(needle) ||
        c.niche_tags.some((t) => t.includes(needle)) ||
        (c.self_promo_note ?? "").toLowerCase().includes(needle)
      );
    });
  }, [q, platform]);

  return (
    <main className="relative z-10 mx-auto max-w-content px-6 py-10">
      <nav className="mb-8 flex h-12 items-center justify-between">
        <Link href="/" className="wordmark text-lg text-ink">
          ZEROFANS
        </Link>
        <span className="eyebrow">community db · {ALL.length}</span>
      </nav>

      <header className="mb-6">
        <h1 className="display-lg mb-2 text-ink">Community database</h1>
        <p className="readable text-sm text-ink-subtle">
          The curated catalog. Add rows with <code className="text-ink-muted">npm run db:add</code>{" "}
          (or edit <code className="text-ink-muted">data/communities.json</code> +{" "}
          <code className="text-ink-muted">npm run db:seed-gen</code>).
        </p>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, tag, note…"
          className="focus-ring w-64 rounded-md border border-hairline bg-surface-1 px-3 py-1.5 text-sm text-ink placeholder:text-ink-tertiary"
        />
        <div className="flex gap-1">
          {platforms.map((p) => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={`focus-ring rounded-md border px-2.5 py-1 text-xs ${
                platform === p
                  ? "border-primary bg-primary text-canvas"
                  : "border-hairline text-ink-subtle hover:text-ink"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-ink-tertiary">{rows.length} shown</span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-hairline">
        <table className="readable w-full text-left text-sm">
          <thead className="bg-surface-1 text-xs uppercase text-ink-subtle">
            <tr>
              <Th>Name</Th>
              <Th>Platform</Th>
              <Th>Policy</Th>
              <Th>Karma</Th>
              <Th>Activity</Th>
              <Th>Best time</Th>
              <Th>Verified</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-hairline hover:bg-surface-1">
                <td className="px-3 py-2">
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ink hover:text-primary"
                  >
                    {c.name}
                  </a>
                  <div className="mt-0.5 text-xs text-ink-tertiary">
                    {c.niche_tags.slice(0, 4).join(" · ")}
                  </div>
                </td>
                <td className="px-3 py-2 text-ink-subtle">{c.platform}</td>
                <td className={`px-3 py-2 ${POLICY_TONE[c.self_promo_policy]}`}>
                  {c.self_promo_policy.replace("_", " ")}
                </td>
                <td className="px-3 py-2 text-ink-subtle">{c.karma_tier ?? "—"}</td>
                <td className="px-3 py-2 text-ink-subtle">{c.activity_level ?? "—"}</td>
                <td className="px-3 py-2 text-ink-subtle">{c.best_time ?? "—"}</td>
                <td className="tnum px-3 py-2 text-ink-tertiary">{c.verified_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 font-medium">{children}</th>;
}
