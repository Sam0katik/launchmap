import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CommunityCard } from "@/components/CommunityCard";
import { CollapsibleHeadline } from "@/components/CollapsibleHeadline";
import { AccountGuidePanel } from "@/components/AccountGuidePanel";
import { LaunchChecklist } from "@/components/LaunchChecklist";
import { UnlockButton } from "@/components/UnlockButton";
import { FlyingPlane } from "@/components/FlyingPlane";
import { VectorSketch } from "@/components/VectorSketch";
import { SiteNav } from "@/components/SiteNav";
import { UNLOCK_PRICE_LABEL } from "@/lib/billing";
import { isAdminUser } from "@/lib/admins";
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
    .select("id, product_url, product_data, result, unlocked, checklist")
    .eq("id", params.id)
    .maybeSingle();

  if (!run) notFound();

  // Viewer (for balance + admin unlock). The map is RLS-scoped to the owner.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAdmin = isAdminUser({
    email: user?.email,
    username: user?.user_metadata?.user_name as string,
  });
  let balanceCents = 0;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("balance_cents")
      .eq("id", user.id)
      .maybeSingle();
    balanceCents = (profile?.balance_cents as number) ?? 0;
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

  // Launch checklist (unlocked maps): order the route easy-wins first.
  const POLICY_RANK: Record<string, number> = {
    welcome: 0,
    megathread_only: 1,
    comment_only: 2,
    banned: 3,
  };
  const KARMA_RANK: Record<string, number> = { easy: 0, medium: 1, hard: 2 };
  const POLICY_META: Record<string, { label: string; tone: "ok" | "warn" | "bad" }> = {
    welcome: { label: "Welcome", tone: "ok" },
    megathread_only: { label: "Megathread", tone: "warn" },
    comment_only: { label: "Comments", tone: "warn" },
    banned: { label: "No promo", tone: "bad" },
  };
  const checklistItems = [...ranked]
    .sort((a, b) => {
      const pa = POLICY_RANK[a.community.self_promo_policy] ?? 1;
      const pb = POLICY_RANK[b.community.self_promo_policy] ?? 1;
      if (pa !== pb) return pa - pb;
      const ka = KARMA_RANK[a.community.karma_tier ?? "medium"] ?? 1;
      const kb = KARMA_RANK[b.community.karma_tier ?? "medium"] ?? 1;
      return ka - kb;
    })
    .map((r) => {
      const meta = POLICY_META[r.community.self_promo_policy] ?? POLICY_META.welcome;
      return {
        communityId: r.community.id,
        name: r.community.name.replace(/\s*\([^)]*\)\s*$/, "").trim(),
        platform: r.community.platform,
        policyLabel: meta.label,
        policyTone: meta.tone,
        bestTime: r.community.best_time ?? null,
        href: r.community.url,
      };
    });
  const checklistDone = Array.isArray(run.checklist)
    ? (run.checklist as number[])
    : [];

  return (
    <>
      <VectorSketch variant="alt" />
      <FlyingPlane />

      <div className="relative z-10 flex min-h-screen flex-col">
        <SiteNav />

        <main className="mx-auto w-full max-w-content px-6 pb-20 pt-4">
          <CollapsibleHeadline
            summary={analysis?.product_summary ?? ""}
            fallback={run.product_url}
            runNo={runNo}
          />

          {run.unlocked && (
            <>
              <LaunchChecklist
                runId={run.id}
                items={checklistItems}
                initialDone={checklistDone}
              />
              <AccountGuidePanel />
            </>
          )}

          {!run.unlocked && lockedCount > 0 && (
            <div className="panel mb-10 flex flex-col items-start justify-between gap-4 px-6 py-6 sm:flex-row sm:items-center">
              <p className="text-sm text-ink-muted">
                Paid analysis: unlock all{" "}
                <span className="tnum">{lockedCount}</span> more publics + a
                posting brief (rules + skeleton) for each{" "}
                <span className="text-ink-subtle">— {UNLOCK_PRICE_LABEL}</span>
              </p>
              <UnlockButton
                runId={run.id}
                balanceCents={balanceCents}
                isAdmin={isAdmin}
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
            const withRank = ranked.map((entry, i) => ({ entry, rank: i + 1 }));
            const reddit = withRank.filter(
              (r) => r.entry.community.platform === "reddit"
            );
            const other = withRank.filter(
              (r) => r.entry.community.platform !== "reddit"
            );
            const Grid = ({
              items,
            }: {
              items: { entry: RankedCommunity; rank: number }[];
            }) => (
              <div className="columns-1 gap-4 [column-fill:_balance] sm:columns-2 lg:columns-3">
                {items.map(({ entry, rank }) => (
                  <div
                    key={entry.community.id}
                    className="mb-4 break-inside-avoid"
                  >
                    <CommunityCard rank={rank} entry={entry} analysis={analysis} />
                  </div>
                ))}
              </div>
            );
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
        </main>
      </div>
    </>
  );
}
