import type { Community, ProductAnalysis, RankedCommunity } from "./types";

// Mock data so the map UI is viewable on localhost before Supabase is wired.
// Mirrors supabase/seed.sql. Used only by /demo.

const COMMUNITIES: Community[] = [
  {
    id: 1, platform: "reddit", name: "r/SideProject",
    url: "https://www.reddit.com/r/SideProject/",
    niche_tags: ["saas", "indie", "vibecoders", "sideproject", "ai", "webapp", "launch"],
    self_promo_policy: "welcome",
    self_promo_note: "Sharing what you built is the point of the sub. Keep it genuine, no pure ad copy.",
    rules_summary: "Removed: low-effort drops with no context. Required: explain what it is and why you built it.",
    karma_tier: "easy", karma_note: "New accounts tolerated.",
    activity_level: "active", best_time: "Tue-Thu 9-12 ET",
    submit_template: null, verified_at: "2026-06-17",
  },
  {
    id: 2, platform: "reddit", name: "r/microsaas",
    url: "https://www.reddit.com/r/microsaas/",
    niche_tags: ["microsaas", "saas", "indie", "bootstrapped", "solofounder", "launch"],
    self_promo_policy: "welcome",
    self_promo_note: "Build-in-public and small-launch posts welcome when they add insight.",
    rules_summary: "Required: share numbers/learnings, not just a link.",
    karma_tier: "easy", karma_note: "Low barrier.",
    activity_level: "moderate", best_time: "Tue-Thu 10-13 ET",
    submit_template: null, verified_at: "2026-06-17",
  },
  {
    id: 3, platform: "directory", name: "Indie Hackers",
    url: "https://www.indiehackers.com/",
    niche_tags: ["indie", "bootstrapped", "saas", "solofounder", "buildinpublic", "launch"],
    self_promo_policy: "welcome",
    self_promo_note: "Product-Hunt-style exposure without the extreme competition.",
    rules_summary: "Lead with the story/lessons, not a bare link.",
    karma_tier: "easy", karma_note: "No karma gate.",
    activity_level: "moderate", best_time: "Tue-Thu mornings ET",
    submit_template: null, verified_at: "2026-06-17",
  },
  {
    id: 4, platform: "directory", name: "BetaList",
    url: "https://betalist.com/submit",
    niche_tags: ["beta", "earlyaccess", "startup", "waitlist", "saas", "launch"],
    self_promo_policy: "welcome",
    self_promo_note: "Curated early-stage directory; strong email subscriber base for beta signups.",
    rules_summary: "Manual curation; has a paid skip-the-line option.",
    karma_tier: "easy", karma_note: "Editorial quality bar.",
    activity_level: "moderate", best_time: "N/A — submission-based",
    submit_template: null, verified_at: "2026-06-17",
  },
  {
    id: 5, platform: "reddit", name: "r/alphaandbetausers",
    url: "https://www.reddit.com/r/alphaandbetausers/",
    niche_tags: ["beta", "earlyaccess", "feedback", "indie", "testers", "launch"],
    self_promo_policy: "welcome",
    self_promo_note: "Purpose-built for recruiting early users/testers.",
    rules_summary: "Label stage (alpha/beta) and what feedback you want.",
    karma_tier: "easy", karma_note: "Minimal karma needs.",
    activity_level: "low", best_time: "Any weekday morning ET",
    submit_template: null, verified_at: "2026-06-17",
  },
  {
    id: 6, platform: "reddit", name: "r/SaaS",
    url: "https://www.reddit.com/r/SaaS/",
    niche_tags: ["saas", "b2b", "indie", "startup", "launch", "pricing"],
    self_promo_policy: "megathread_only",
    self_promo_note: "Direct promo limited; use the weekly self-promo / feedback threads.",
    rules_summary: "Removed: standalone launch posts outside allowed threads.",
    karma_tier: "medium", karma_note: "Brand-new accounts often filtered.",
    activity_level: "active", best_time: "Mon-Wed 8-11 ET",
    submit_template: null, verified_at: "2026-06-17",
  },
  {
    id: 7, platform: "reddit", name: "r/Entrepreneur",
    url: "https://www.reddit.com/r/Entrepreneur/",
    niche_tags: ["startup", "business", "founder", "saas", "marketing"],
    self_promo_policy: "megathread_only",
    self_promo_note: "Strict on self-promo; use the designated threads only.",
    rules_summary: "Removed: launch/promo posts in the main feed.",
    karma_tier: "hard", karma_note: "Established account strongly recommended.",
    activity_level: "active", best_time: "Mon/Thu 9-12 ET",
    submit_template: null, verified_at: "2026-06-17",
  },
];

export const DEMO_ANALYSIS: ProductAnalysis = {
  product_summary: "An AI tool that turns your product URL into a ranked launch map",
  category: "Developer tool / SaaS",
  icp: "indie makers and vibe-coders with zero audience",
  niche_tags: ["saas", "indie", "launch", "vibecoders", "ai"],
};

// Top 4 unlocked, rest locked — mirrors the free-tier split.
const RELEVANCE = [96, 88, 84, 80, 64, 58, 41];

export const DEMO_RANKED: RankedCommunity[] = COMMUNITIES.map((community, i) => ({
  community,
  relevance: RELEVANCE[i],
  locked: i >= 4,
}));
