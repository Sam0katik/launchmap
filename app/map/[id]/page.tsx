import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CommunityCard } from "@/components/CommunityCard";
import { CollapsibleHeadline } from "@/components/CollapsibleHeadline";
import { AccountGuidePanel } from "@/components/AccountGuidePanel";
import { VectorSketch } from "@/components/VectorSketch";
import { SiteNav } from "@/components/SiteNav";
import { buildCheckoutUrl, UNLOCK_PRICE_LABEL } from "@/lib/billing";
import type { ProductAnalysis, RankedCommunity } from "@/lib/types";

// The map result screen. Reads a persisted run, renders ranked community cards.
// Basic (free) analysis shows the top publics; the rest unlock per-map for $3.
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
  const rankedRaw = (run.result ?? []) as RankedCommunity[];
  // run.unlocked is the source of truth: when set (paid / Pro), every entry is
  // unlocked regardless of the locked flags baked into the stored result.
  const ranked: RankedCommunity[] = run.unlocked
    ? rankedRaw.map((r) => ({ ...r, locked: false }))
    : rankedRaw;
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
            runNo={runNo}
          />

          {run.unlocked && <AccountGuidePanel />}

          {!run.unlocked && lockedCount > 0 && (
            <div className="panel mb-10 flex flex-col items-start justify-between gap-4 px-6 py-6 sm:flex-row sm:items-center">
              <p className="text-sm text-ink-muted">
                Paid analysis: unlock all{" "}
                <span className="tnum">{lockedCount}</span> more publics + a
                posting brief (rules + skeleton) for each{" "}
                <span className="text-ink-subtle">— {UNLOCK_PRICE_LABEL}</span>
              </p>
              {checkoutUrl ? (
                <a
                  href={checkoutUrl}
                  className="focus-ring btn-press shrink-0 rounded-md border-2 border-hairline-strong bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover"
                >
                  Unlock all publics → {UNLOCK_PRICE_LABEL}
                </a>
              ) : (
                // Billing provider not provisioned yet. Keep the CTA visible but
                // inert so the layout and intent are already in place.
                <button
                  disabled
                  title="Payment provider not connected yet"
                  className="shrink-0 rounded-md border-2 border-hairline-strong bg-primary px-5 py-2.5 text-sm font-medium text-white opacity-60"
                >
                  Unlock all publics — {UNLOCK_PRICE_LABEL}
                </button>
              )}
            </div>
          )}

          {ranked.length === 0 && (
            <div className="panel px-8 py-10 text-center">
              <p className="text-sm text-ink-muted">
                No strong community matches for this product yet — it may sit
                outside our curated indie / SaaS / maker set.
              </p>
              <p className="mt-2 text-sm text-ink-subtle">
                Try a clearer one-line description on the{" "}
                <a href="/" className="text-primary hover:underline">
                  home page
                </a>
                , or browse the full{" "}
                <a href="/communities" className="text-primary hover:underline">
                  community database
                </a>
                .
              </p>
            </div>
          )}

          {(() => {
            // Keep ranks continuous across both sections, but render full and
            // locked cards in separate grids so short locked strips don't leave
            // holes among the tall unlocked cards.
            const withRank = ranked.map((entry, i) => ({ entry, rank: i + 1 }));
            const open = withRank.filter((r) => !r.entry.locked);
            const locked = withRank.filter((r) => r.entry.locked);
            return (
              <>
                {/* Masonry (CSS columns): an expanded draft only lengthens its
                    own column instead of stretching the whole row, so cards stay
                    packed and don't spread apart. */}
                <div className="columns-1 gap-4 [column-fill:_balance] sm:columns-2 lg:columns-3">
                  {open.map(({ entry, rank }) => (
                    <div
                      key={entry.community.id}
                      className="mb-4 break-inside-avoid"
                    >
                      <CommunityCard rank={rank} entry={entry} />
                    </div>
                  ))}
                </div>

                {locked.length > 0 && (
                  <>
                    <h2 className="eyebrow mb-3 mt-10">
                      Locked · {locked.length} more
                    </h2>
                    <div className="grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {locked.map(({ entry, rank }) => (
                        <CommunityCard
                          key={entry.community.id}
                          rank={rank}
                          entry={entry}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            );
          })()}
        </main>
      </div>
    </>
  );
}
