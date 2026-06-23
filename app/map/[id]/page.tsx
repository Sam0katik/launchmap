import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CommunityCard } from "@/components/CommunityCard";
import { CollapsibleHeadline } from "@/components/CollapsibleHeadline";
import { VectorSketch } from "@/components/VectorSketch";
import { SiteNav } from "@/components/SiteNav";
import { buildCheckoutUrl, UNLOCK_PRICE_LABEL } from "@/lib/billing";
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
  // Short, stable run label for the receipt meta line.
  const runNo = String(run.id).replace(/-/g, "").slice(0, 8).toUpperCase();
  const checkoutUrl = run.unlocked ? null : buildCheckoutUrl(run.id);

  return (
    <>
      <VectorSketch variant="alt" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <SiteNav />

        <main className="mx-auto w-full max-w-content px-6 pb-20 pt-4">
          <CollapsibleHeadline
            summary={analysis?.product_summary ?? ""}
            fallback={run.product_url}
            category={analysis?.category}
            icp={analysis?.icp}
            runNo={runNo}
          />

          {!run.unlocked && lockedCount > 0 && (
            <div className="panel mb-10 flex flex-col items-start justify-between gap-4 px-6 py-6 sm:flex-row sm:items-center">
              <p className="text-sm text-ink-muted">
                <span className="tnum">{lockedCount}</span> more communities are
                locked — unlock rules, drafts, and one-click submit links for your
                whole map.{" "}
                <span className="text-ink-subtle">({UNLOCK_PRICE_LABEL})</span>
              </p>
              {checkoutUrl ? (
                <a
                  href={checkoutUrl}
                  className="focus-ring btn-press shrink-0 rounded-md border-2 border-hairline-strong bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover"
                >
                  Unlock full map →
                </a>
              ) : (
                // Billing not provisioned yet (Stage 6). Keep the CTA visible but
                // inert so the layout and intent are already in place.
                <button
                  disabled
                  title="Checkout goes live in Stage 6"
                  className="shrink-0 rounded-md border-2 border-hairline-strong bg-primary px-5 py-2.5 text-sm font-medium text-white opacity-60"
                >
                  Unlock full map
                </button>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ranked.map((entry, i) => (
              <CommunityCard key={entry.community.id} rank={i + 1} entry={entry} />
            ))}
          </div>
        </main>
      </div>
    </>
  );
}
