import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CommunityCard } from "@/components/CommunityCard";
import type { ProductAnalysis, RankedCommunity } from "@/lib/types";

// The map result screen. Reads a persisted run, renders ranked community cards.
// Free tier shows the top 4 fully; the rest are locked until unlocked.
export default async function MapPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: run } = await supabase
    .from("runs")
    .select("id, product_url, product_data, result, unlocked")
    .eq("id", params.id)
    .maybeSingle();

  if (!run) notFound();

  const analysis = run.product_data as ProductAnalysis | null;
  const ranked = (run.result ?? []) as RankedCommunity[];
  const lockedCount = ranked.filter((r) => r.locked).length;

  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <header className="mb-10">
        <span className="eyebrow mb-3 block">Your launch map</span>
        <h1 className="display-lg mb-3 text-ink">
          {analysis?.product_summary || run.product_url}
        </h1>
        {analysis && (
          <p className="text-ink-subtle">
            {analysis.category} · for {analysis.icp}
          </p>
        )}
      </header>

      {!run.unlocked && lockedCount > 0 && (
        <div className="mb-8 flex flex-col items-start justify-between gap-4 rounded-lg border border-hairline bg-surface-1 p-6 sm:flex-row sm:items-center">
          <p className="text-sm text-ink-muted">
            {lockedCount} more communities are locked — unlock rules, drafts, and
            one-click submit links for your whole map.
          </p>
          {/* TODO: wire Lemon Squeezy checkout (Step 5). */}
          <button
            disabled
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white opacity-60"
          >
            Unlock full map
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ranked.map((entry, i) => (
          <CommunityCard key={entry.community.id} rank={i + 1} entry={entry} />
        ))}
      </div>
    </main>
  );
}
