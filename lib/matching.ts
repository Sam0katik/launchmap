import type { Community, ProductAnalysis, RankedCommunity } from "./types";

// Tag-intersection matcher + ranker.
//
// Design note: at ~20 curated communities, a full LLM relevance pass on every
// candidate is overkill (and costs money on every run). Tag overlap with a
// light scoring heuristic ranks well enough. The spec's "Haiku tiebreak for
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
 * Score one community against the product's niche tags. Returns 0–100.
 *
 * Earlier this normalized only by the product's tag count, so almost every
 * community matched exactly one generic tag and landed on the same number
 * (the infamous "36% everywhere"). This blends two signals so scores spread:
 *   - coverage: how much of the product's intent the community covers
 *   - density:  how focused the community is on those tags (a niche sub that
 *               is *about* this beats a giant catch-all that merely mentions it)
 * Activity is a small tie-breaker, not a 20-point thumb on the scale.
 */
function scoreCommunity(community: Community, productTags: string[]): number {
  if (productTags.length === 0 || community.niche_tags.length === 0) return 0;

  const product = productTags.map((t) => t.toLowerCase());
  const comm = community.niche_tags.map((t) => t.toLowerCase());

  // Count product tags that find a match in the community (avoids double-
  // counting when several community tags map to one product tag).
  const matchedProduct = product.filter((p) =>
    comm.some((c) => tagsMatch(p, c))
  ).length;
  if (matchedProduct === 0) return 0;

  const matchedComm = comm.filter((c) =>
    product.some((p) => tagsMatch(p, c))
  ).length;

  const coverage = matchedProduct / product.length; // 0–1
  const density = matchedComm / comm.length; // 0–1

  const base = (0.65 * coverage + 0.35 * density) * 100;

  const activityBonus =
    community.activity_level === "active"
      ? 6
      : community.activity_level === "moderate"
        ? 3
        : 0;

  // Cap below 100 — a heuristic match is never a certainty.
  return Math.min(97, Math.round(base * 0.9 + activityBonus));
}

/**
 * Rank all communities for a product. Returns 15–25 entries sorted by
 * relevance desc, with the top `FREE_TIER_COUNT` unlocked and the rest locked
 * (until the map is paid for).
 */
export function rankCommunities(
  analysis: ProductAnalysis,
  communities: Community[],
  unlocked: boolean
): RankedCommunity[] {
  const scored = communities
    .map((community) => ({
      community,
      relevance: scoreCommunity(community, analysis.niche_tags),
    }))
    .filter((r) => r.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 25);

  return scored.map((r, i) => ({
    ...r,
    locked: unlocked ? false : i >= FREE_TIER_COUNT,
  }));
}
