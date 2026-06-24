import Link from "next/link";
import { CommunityCard } from "@/components/CommunityCard";
import { DEMO_ANALYSIS, DEMO_RANKED } from "@/lib/demo-data";

// Static preview of the map screen with mock data — no DB, no auth.
// Reflects the submitted URL/note (text only — JSX auto-escapes, no XSS).
export default function DemoPage({
  searchParams,
}: {
  searchParams: { url?: string; note?: string };
}) {
  const analysis = DEMO_ANALYSIS;
  const ranked = DEMO_RANKED;
  const lockedCount = ranked.filter((r) => r.locked).length;

  // Safely derive a display host from the submitted url.
  let host = "";
  if (searchParams.url) {
    try {
      const u = new URL(searchParams.url);
      if (u.protocol === "http:" || u.protocol === "https:") host = u.host;
    } catch {
      host = "";
    }
  }
  const note = (searchParams.note ?? "").slice(0, 160);

  return (
    <main className="mx-auto max-w-content px-6 py-10">
      <nav className="mb-12 flex h-14 items-center justify-between">
        <Link href="/" className="wordmark text-sm text-ink">
          ZEROFANS
        </Link>
        <span className="eyebrow">demo · mock data</span>
      </nav>

      <header className="mb-10">
        <span className="eyebrow mb-3 block">
          your launch map{host ? ` · ${host}` : ""}
        </span>
        <h1 className="display-lg mb-3 text-ink">
          {host ? `Where to launch ${host}` : analysis.product_summary}
        </h1>
        <p className="readable text-ink-subtle">
          {note || `${analysis.category} · for ${analysis.icp}`}{" "}
          <span className="text-ink-tertiary">(demo · sample data)</span>
        </p>
      </header>

      {lockedCount > 0 && (
        <div className="mb-8 flex flex-col items-start justify-between gap-4 rounded-lg border border-hairline bg-surface-1 p-6 sm:flex-row sm:items-center">
          <p className="pretty text-sm text-ink-muted">
            {lockedCount} more communities are locked — unlock rules, drafts, and
            one-click submit links for your whole map.
          </p>
          <button className="focus-ring btn-press rounded-md bg-primary px-4 py-2 text-sm font-medium text-canvas hover:bg-primary-hover">
            Unlock full map
          </button>
        </div>
      )}

      <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ranked.map((entry, i) => (
          <CommunityCard key={entry.community.id} rank={i + 1} entry={entry} />
        ))}
      </div>
    </main>
  );
}
