import communitiesData from "@/data/communities.json";
import type { Community, ProductAnalysis } from "./types";
import { rankCommunities } from "./matching";

// Single source of truth = data/communities.json.
// /demo reads it directly; supabase/seed.sql is generated from it
// (scripts/gen-seed.mjs). No data duplication.
const COMMUNITIES = communitiesData as unknown as Community[];

export const DEMO_ANALYSIS: ProductAnalysis = {
  product_summary: "An AI tool that turns your product URL into a ranked launch map",
  category: "Developer tool / SaaS",
  icp: "indie makers and vibe-coders with zero audience",
  niche_tags: ["saas", "indie", "launch", "vibecoders", "ai", "devtool"],
};

// Ranked via the real matcher — top 4 unlocked, rest locked (free-tier split).
export const DEMO_RANKED = rankCommunities(DEMO_ANALYSIS, COMMUNITIES, false);
