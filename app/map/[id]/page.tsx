import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CommunityCard } from "@/components/CommunityCard";
import { CollapsibleHeadline } from "@/components/CollapsibleHeadline";
import { VectorSketch } from "@/components/VectorSketch";
import { SiteNav } from "@/components/SiteNav";
import {
  buildCheckoutUrl,
  UNLOCK_PRICE_LABEL,
  MAX_DRAFT_REGENS,
} from "@/lib/billing";
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

  // Saved drafts for this run, so a returning user sees their drafts already
  // there (no need to re-generate / re-spend the API). Keyed by community id.
  // select("*") rather than naming regen_count, so the page still loads drafts
  // even before migration 0005 adds that column.
  const { data: savedDrafts } = await supabase
    .from("drafts")
    .select("*")
    .eq("run_id", run.id);

  const draftByCommunity = new Map<
    number,
    { title: string; body: string; regenLeft: number }
  >();
  for (const d of savedDrafts ?? []) {
    draftByCommunity.set(d.community_id as number, {
      title: d.title as string,
      body: d.body as string,
      regenLeft: Math.max(0, MAX_DRAFT_REGENS - ((d.regen_count as number) ?? 0)),
    });
  }

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

          {!run.unlocked && lockedCount > 0 && (
            <div className="panel mb-10 flex flex-col items-start justify-between gap-4 px-6 py-6 sm:flex-row sm:items-center">
              <p className="truncate text-sm text-ink-muted">
                <span className="tnum">{lockedCount}</span> locked · unlock the
                full map{" "}
                <span className="text-ink-subtle">— {UNLOCK_PRICE_LABEL}</span>
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
                      <CommunityCard
                        rank={rank}
                        entry={entry}
                        runId={run.id}
                        initialDraft={draftByCommunity.get(entry.community.id)}
                      />
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
                          runId={run.id}
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
