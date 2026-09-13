import Link from "next/link";
import { CommunityCard } from "@/components/CommunityCard";
import { DEMO_ANALYSIS, DEMO_RANKED } from "@/lib/demo-data";
import { serverDict } from "@/lib/i18n-server";
import { fill } from "@/lib/i18n";

// Static preview of the map screen with mock data — no DB, no auth.
// Reflects the submitted URL/note (text only — JSX auto-escapes, no XSS).
export default function DemoPage({
  searchParams,
}: {
  searchParams: { url?: string; note?: string };
}) {
  const { t } = serverDict();
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
        <span className="eyebrow">{t.demo.meta}</span>
      </nav>

      <header className="mb-10">
        <span className="eyebrow mb-3 block">
          {t.demo.eyebrow}
          {host ? ` · ${host}` : ""}
        </span>
        <h1 className="display-lg mb-3 text-ink">
          {host ? fill(t.demo.titleFor, { host }) : analysis.product_summary}
        </h1>
        <p className="readable text-ink-subtle">
          {note || `${analysis.category} · for ${analysis.icp}`}{" "}
          <span className="text-ink-tertiary">{t.demo.sample}</span>
        </p>
      </header>

      {lockedCount > 0 && (
        <div className="mb-8 flex flex-col items-start justify-between gap-4 rounded-lg border border-hairline bg-surface-1 p-6 sm:flex-row sm:items-center">
          <p className="pretty text-sm text-ink-muted">
            {fill(t.demo.lockedNote, { count: lockedCount })}
          </p>
          <button className="focus-ring btn-press rounded-md bg-primary px-4 py-2 text-sm font-medium text-canvas hover:bg-primary-hover">
            {t.demo.unlock}
          </button>
        </div>
      )}

      <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ranked.map((entry) => (
          <CommunityCard
            key={entry.community.id}
            entry={entry}
            analysis={analysis}
          />
        ))}
      </div>
    </main>
  );
}
