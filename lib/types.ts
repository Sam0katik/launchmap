// Shared types — mirror the `communities` and `runs` DB schema.

export type Platform =
  | "reddit"
  | "discord"
  | "x"
  | "hackernews"
  | "directory";

export type SelfPromoPolicy =
  | "welcome"
  | "megathread_only"
  | "comment_only"
  | "banned";

export type KarmaTier = "easy" | "medium" | "hard";

export type ActivityLevel = "active" | "moderate" | "low";

export interface Community {
  id: number;
  platform: Platform;
  name: string;
  url: string;
  niche_tags: string[];
  self_promo_policy: SelfPromoPolicy;
  self_promo_note: string | null;
  rules_summary: string | null;
  karma_tier: KarmaTier | null;
  karma_note: string | null;
  activity_level: ActivityLevel | null;
  best_time: string | null;
  submit_template: string | null;
  verified_at: string; // ISO date
  members?: number | null; // real subscriber/member count (reach)
  icon?: string | null; // avatar URL (Reddit community_icon / directory favicon)
  created_at?: string;
}

// Output of the landing-page analysis step (Haiku).
export interface ProductAnalysis {
  product_summary: string;
  category: string;
  icp: string;
  niche_tags: string[];
  // Concrete, specific strengths/angles a maker can lead a post with.
  strengths?: string[];
}

// One ranked entry in a generated map.
export interface RankedCommunity {
  community: Community;
  relevance: number; // 0–100
  locked: boolean; // true when behind the paywall (rules/draft/submit hidden)
}

export interface RunResult {
  analysis: ProductAnalysis;
  ranked: RankedCommunity[];
}
