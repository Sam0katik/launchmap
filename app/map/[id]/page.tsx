import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CommunityCard } from "@/components/CommunityCard";
import { CollapsibleHeadline } from "@/components/CollapsibleHeadline";
import { AccountGuidePanel } from "@/components/AccountGuidePanel";
import { UnlockButton } from "@/components/UnlockButton";
import { VectorSketch } from "@/components/VectorSketch";
import { SiteNav } from "@/components/SiteNav";
import { OpportunityFinder } from "@/components/OpportunityFinder";
import { UNLOCK_PRICE_LABEL } from "@/lib/billing";
import { apifyConfigured } from "@/lib/apify";
import { productNameFromUrl } from "@/lib/product-name";
import type { ProductAnalysis, RankedCommunity } from "@/lib/types";

type OppThread = {
  title: string;
  url: string;
  subreddit: string | null;
  upvotes: number | null;
  comments: number | null;
};

// The map result screen. Reads a persisted run, renders ranked community cards.
// Basic (free) analysis shows the top publics; the rest unlock per-map for $2.
export default async function MapPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  // Signed-out visitors get an explicit prompt, never a 404: a dropped session
  // (expired cookie, or a slow/paused Supabase that middleware failed open on)
  // used to render "page not found" on the user's own map.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return <SignedOut />;

  // The paid columns (`result`, `opportunities`) are revoked from the client
  // roles (migration 0016), so the row is read with the service role and
  // ownership is checked here against the signed-in user.
  const { data: run } = await createAdminClient()
    .from("runs")
    .select(
      "id, user_id, product_url, product_data, result, unlocked, opportunities, opportunities_at, opportunities_run_id"
    )
    .eq("id", params.id)
    .maybeSingle();
  if (!run || run.user_id !== user.id) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("balance_cents")
    .eq("id", user.id)
    .maybeSingle();
  const balanceCents = (profile?.balance_cents as number) ?? 0;

  const analysis = run.product_data as ProductAnalysis | null;
  const rankedRaw = (run.result ?? []) as RankedCommunity[];

  // The result is a snapshot from analyze time, so icon/member counts baked in
  // then can be stale (or empty). Overlay the live values by community id so a
  // Reddit-data refresh shows up on existing maps too — everything else stays
  // from the snapshot.
  const ids = rankedRaw.map((r) => r.community.id);
  const liveById = new Map<
    number,
    { icon: string | null; members: number | null; scraped_rules: string[] | null }
  >();
  if (ids.length > 0) {
    const { data: live } = await supabase
      .from("communities")
      .select("id, icon, members, scraped_rules")
      .in("id", ids);
    for (const c of live ?? []) {
      liveById.set(c.id as number, {
        icon: (c.icon as string | null) ?? null,
        members: (c.members as number | null) ?? null,
        scraped_rules: (c.scraped_rules as string[] | null) ?? null,
      });
    }
  }

  // run.unlocked is the source of truth: when set (paid / Pro), every entry is
  // unlocked regardless of the locked flags baked into the stored result.
  const ranked: RankedCommunity[] = rankedRaw.map((r) => {
    const live = liveById.get(r.community.id);
    return {
      ...r,
      locked: run.unlocked ? false : r.locked,
      community: live
        ? {
            ...r.community,
            icon: live.icon,
            members: live.members,
            scraped_rules: live.scraped_rules,
          }
        : r.community,
    };
  });
  const lockedCount = ranked.filter((r) => r.locked).length;
  // Short, stable run label for the receipt meta line.
  const runNo = String(run.id).replace(/-/g, "").slice(0, 8).toUpperCase();

  return (
    <>
      <VectorSketch variant="alt" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <SiteNav />

        <main className="mx-auto w-full max-w-content px-6 pb-20 pt-4">
          <CollapsibleHeadline
            productName={productNameFromUrl(run.product_url)}
            summary={analysis?.product_summary ?? ""}
            runNo={runNo}
          />

          {run.unlocked && <AccountGuidePanel />}

          <OpportunityFinder
            runId={run.id}
            enabled={apifyConfigured()}
            unlocked={!!run.unlocked}
            initialThreads={
              (run.opportunities as OppThread[] | null) ?? null
            }
            updatedAt={(run.opportunities_at as string | null) ?? null}
            pendingRunId={(run.opportunities_run_id as string | null) ?? null}
          />

          {!run.unlocked && lockedCount > 0 && (
            <div className="panel mb-10 flex flex-col items-start justify-between gap-4 px-6 py-5 sm:flex-row sm:items-center">
              <div className="text-sm text-ink-muted">
                <p className="mb-1.5 text-ink">
                  Unlock the full map{" "}
                  <span className="text-ink-subtle">— {UNLOCK_PRICE_LABEL}</span>
                </p>
                <ul className="space-y-0.5">
                  <li>
                    → All <span className="tnum">{lockedCount}</span> remaining
                    communities with posting briefs
                  </li>
                  <li>→ Each sub&apos;s live mod-pinned rules</li>
                  <li>→ Live-thread finder ($0.50 per search)</li>
                </ul>
              </div>
              <UnlockButton
                runId={run.id}
                balanceCents={balanceCents}
                priceLabel={UNLOCK_PRICE_LABEL}
              />
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
            // Reddit is the primary launch channel — give it its own section,
            // separate from directories / HN / Discord / X.
            const reddit = ranked.filter(
              (entry) => entry.community.platform === "reddit"
            );
            const other = ranked.filter(
              (entry) => entry.community.platform !== "reddit"
            );
            // Independent columns (round-robin), not CSS multi-column: expanding
            // a card only pushes cards below it in the SAME column — neighbours
            // in other columns never shift.
            const COLS = 3;
            const Grid = ({ items }: { items: RankedCommunity[] }) => {
              const columns = Array.from({ length: COLS }, (_, c) =>
                items.filter((_, i) => i % COLS === c)
              );
              return (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {columns.map((col, c) => (
                    <div key={c} className="flex flex-col gap-4">
                      {col.map((entry) => (
                        <CommunityCard
                          key={entry.community.id}
                          entry={entry}
                          analysis={analysis}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              );
            };
            const Count = ({ n }: { n: number }) => (
              <span className="tnum inline-flex h-7 min-w-7 items-center justify-center rounded-md border-2 border-hairline-strong px-2 text-sm text-ink">
                {n}
              </span>
            );
            return (
              <>
                {reddit.length > 0 && (
                  <section className="mb-10">
                    <div className="mb-4 flex items-center gap-3">
                      <h2 className="display-lg text-ink" style={{ fontSize: "clamp(22px,3vw,30px)" }}>
                        Reddit
                      </h2>
                      <Count n={reddit.length} />
                    </div>
                    <Grid items={reddit} />
                  </section>
                )}

                {other.length > 0 && (
                  <section>
                    <div className="mb-4 flex items-center gap-3">
                      <h2 className="display-lg text-ink" style={{ fontSize: "clamp(22px,3vw,30px)" }}>
                        Other channels
                      </h2>
                      <Count n={other.length} />
                    </div>
                    <Grid items={other} />
                  </section>
                )}
              </>
            );
          })()}

          {/* Full catalog — everything, including communities not surfaced in
              this map, so nothing is hidden behind the ranking. */}
          <div className="panel mt-10 flex flex-col items-start justify-between gap-3 px-6 py-5 sm:flex-row sm:items-center">
            <p className="text-sm text-ink-muted">
              Want the rest? Browse every community in the database — including
              ones this map didn&apos;t rank for your product.
            </p>
            <a
              href="/communities"
              className="focus-ring btn-press shrink-0 rounded-md border-2 border-hairline-strong bg-surface-2 px-4 py-2 text-sm font-medium text-ink hover:bg-surface-3"
            >
              Browse all communities →
            </a>
          </div>
        </main>
      </div>
    </>
  );
}

// Shown instead of a 404 when the visitor has no session: the map may well be
// theirs, they just need to sign in again.
function SignedOut() {
  return (
    <>
      <VectorSketch variant="alt" />
      <div className="relative z-10 flex min-h-screen flex-col">
        <SiteNav />
        <main className="mx-auto flex w-full max-w-content flex-1 flex-col items-center justify-center px-6 text-center">
          <div className="panel px-8 py-10">
            <h1 className="display-lg mb-3 text-ink">Sign in to open this map</h1>
            <p className="text-sm text-ink-muted">
              Maps are private to the account that created them. Sign in with
              GitHub (top right) and this page will load.
            </p>
          </div>
        </main>
      </div>
    </>
  );
}
