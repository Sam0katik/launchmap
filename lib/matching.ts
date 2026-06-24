import type { Community, ProductAnalysis, RankedCommunity } from "./types";

// Tag-intersection matcher + ranker.
//
// Design note: at ~20-40 curated communities, a full LLM relevance pass on
// every candidate is overkill (and costs money on every run). Tag overlap with
// specificity weighting ranks well enough. The spec's "Haiku tiebreak for
// borderline cases" is a future optimization — wire it only if precision
// complaints show up. See DEVELOPMENT_PLAN.md §Matching.

const FREE_TIER_COUNT = 4; // top N shown fully on the free tier

/** Two tags match if equal or one contains the other (saas ⊂ microsaas). */
function tagsMatch(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length >= 3 && b.includes(a)) return true;
  if (b.length >= 3 && a.includes(b)) return true;
  return false;
}

/**
 * Inverse-document-frequency weight per tag, computed across the candidate set.
 *
 * Why: almost every community carries "saas"/"indie"/"launch", so matching on
 * those says almost nothing — and when every score is driven by the same
 * generic overlap they all collapse onto the same number (the infamous "36%
 * everywhere"). Weighting each tag by how RARE it is means a match on a
 * specific tag ("nocode", "opensource", "fintech") counts far more than a match
 * on a ubiquitous one, which both spreads the scores and makes them reflect
 * real fit.
 */
function buildIdf(communities: Community[]): {
  idf: Map<string, number>;
  fallback: number;
} {
  const N = communities.length || 1;
  const df = new Map<string, number>();
  for (const c of communities) {
    const seen = Array.from(new Set(c.niche_tags.map((t) => t.toLowerCase())));
    seen.forEach((t) => df.set(t, (df.get(t) ?? 0) + 1));
  }
  const idf = new Map<string, number>();
  df.forEach((d, t) => idf.set(t, Math.log((N + 1) / (d + 1)) + 1));
  // A tag not in the DB at all (a very specific product tag) is treated as
  // maximally specific.
  const fallback = Math.log((N + 1) / 1) + 1;
  return { idf, fallback };
}

/**
 * Score one community against the product's niche tags, 0–100, using two
 * specificity-weighted signals:
 *   - coverage: how much of the product's (weighted) intent the community covers
 *   - density:  how focused the community's (weighted) tags are on this product
 * Activity is a small tie-breaker, never the main driver.
 */
function scoreCommunity(
  community: Community,
  productTags: string[],
  idf: Map<string, number>,
  fallback: number
): number {
  if (productTags.length === 0 || community.niche_tags.length === 0) return 0;

  const product = productTags.map((t) => t.toLowerCase());
  const comm = community.niche_tags.map((t) => t.toLowerCase());
  const wOf = (t: string) => idf.get(t) ?? fallback;

  // Weighted coverage: of the product's intent (weighted by specificity), how
  // much does this community actually cover?
  let covNum = 0;
  let covDen = 0;
  for (const p of product) {
    const w = wOf(p);
    covDen += w;
    if (comm.some((c) => tagsMatch(p, c))) covNum += w;
  }
  const coverage = covDen > 0 ? covNum / covDen : 0;
  if (covNum === 0) return 0; // nothing matched at all

  // Weighted density: of this community's (weighted) tags, how many are about
  // the product? Penalizes giant catch-all subs that merely mention one tag.
  let denNum = 0;
  let denDen = 0;
  for (const c of comm) {
    const w = wOf(c);
    denDen += w;
    if (product.some((p) => tagsMatch(p, c))) denNum += w;
  }
  const density = denDen > 0 ? denNum / denDen : 0;

  // Blend the two weighted signals, then apply a gentle concave curve so that
  // a genuinely strong, specific match reads as strong (70s–90s) while weak,
  // generic-only overlap stays honestly moderate. Without the curve the raw
  // fractions cluster low and every match looks lukewarm.
  const blend = 0.62 * coverage + 0.38 * density;
  const base = Math.pow(blend, 0.62) * 100;

  const activityBonus =
    community.activity_level === "active"
      ? 4
      : community.activity_level === "moderate"
        ? 2
        : 0;

  // Cap below 100 — a heuristic match is never a certainty.
  return Math.min(96, Math.round(base * 0.9 + activityBonus));
}

/**
 * Rank all communities for a product. Returns up to 25 entries sorted by
 * relevance desc, with the top `FREE_TIER_COUNT` unlocked and the rest locked
 * (until the map is paid for).
 */
export function rankCommunities(
  analysis: ProductAnalysis,
  communities: Community[],
  unlocked: boolean
): RankedCommunity[] {
  const { idf, fallback } = buildIdf(communities);

  const scored = communities
    .map((community) => ({
      community,
      relevance: scoreCommunity(community, analysis.niche_tags, idf, fallback),
    }))
    .filter((r) => r.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 25);

  return scored.map((r, i) => ({
    ...r,
    locked: unlocked ? false : i >= FREE_TIER_COUNT,
  }));
}
