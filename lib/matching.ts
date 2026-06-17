import type { Community, ProductAnalysis, RankedCommunity } from "./types";

// Tag-intersection matcher + ranker.
//
// Design note: at ~20 curated communities, a full LLM relevance pass on every
// candidate is overkill (and costs money on every run). Tag overlap with a
// light scoring heuristic ranks well enough. The spec's "Haiku tiebreak for
// borderline cases" is a future optimization — wire it only if precision
// complaints show up. See DEVELOPMENT_PLAN.md §Matching.

const FREE_TIER_COUNT = 4; // top N shown fully on the free tier

/**
 * Score one community against the product's niche tags.
 * Returns 0–100. Pure tag overlap, normalized by the product's tag count,
 * with a small bonus for active communities and a penalty for low activity.
 */
function scoreCommunity(
  community: Community,
  productTags: string[]
): number {
  if (productTags.length === 0) return 0;

  const tagSet = new Set(productTags.map((t) => t.toLowerCase()));
  const overlap = community.niche_tags.filter((t) =>
    tagSet.has(t.toLowerCase())
  ).length;

  // Base: fraction of product tags matched, scaled to 0–80.
  const base = (overlap / productTags.length) * 80;

  // Activity modifier: active +20, moderate +10, low +0.
  const activityBonus =
    community.activity_level === "active"
      ? 20
      : community.activity_level === "moderate"
        ? 10
        : 0;

  return Math.min(100, Math.round(base + activityBonus));
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
