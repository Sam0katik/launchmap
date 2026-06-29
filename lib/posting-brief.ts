import type { Community, ProductAnalysis } from "./types";

// Per-community posting brief — the rules to follow here (derived from the
// curated community fields + platform conventions) plus a fill-in skeleton and,
// when a product analysis is available, a tailored angle to lead with. No
// per-request AI: accurate, free, and specific to THIS community.

export interface PostingBrief {
  policyLabel: string;
  policyTone: "ok" | "warn" | "bad";
  where: string;
  linkChip: string; // short can/can't summary
  linkTone: "ok" | "warn" | "bad";
  length: string;
  title: string;
  karmaTier: string | null; // "Easy" | "Medium" | "Hard"
  karmaNote: string;
  bestTime: string | null;
  rules: string | null; // real per-community removal reasons (from the DB)
  angle: string | null; // a product strength to lead with
  skeleton: string[];
  warn: string; // the single most important "don't"
}

const POLICY: Record<string, { label: string; tone: "ok" | "warn" | "bad" }> = {
  welcome: { label: "Welcome", tone: "ok" },
  megathread_only: { label: "Megathread only", tone: "warn" },
  comment_only: { label: "Comments only", tone: "warn" },
  banned: { label: "No self-promo", tone: "bad" },
};

function lengthFor(platform: string): string {
  switch (platform) {
    case "reddit":
      return "A few sentences, under ~110 words.";
    case "hackernews":
      return "Under ~90 words + the URL.";
    case "x":
      return "One line, under 280 chars.";
    case "discord":
      return "2–3 sentences (~55 words).";
    default:
      return "One short paragraph (~55 words).";
  }
}

function titleFor(platform: string): string {
  switch (platform) {
    case "reddit":
      return "Specific, lowercase-ish, ≤12 words.";
    case "hackernews":
      return 'Start with "Show HN:".';
    case "x":
      return "The post itself.";
    case "discord":
      return "No headline — just start.";
    default:
      return "A plain, specific tagline.";
  }
}

function linkInfo(community: Community): { chip: string; tone: "ok" | "warn" | "bad" } {
  if (community.platform === "reddit") {
    switch (community.self_promo_policy) {
      case "welcome":
        return { chip: "Link OK, in context", tone: "ok" };
      case "megathread_only":
      case "comment_only":
        return { chip: "Link in comments only", tone: "warn" };
      case "banned":
        return { chip: "No links", tone: "bad" };
    }
  }
  if (community.platform === "hackernews") return { chip: "URL is the post", tone: "ok" };
  if (community.platform === "discord") return { chip: "Link inline, once", tone: "ok" };
  return { chip: "Link in the listing", tone: "ok" };
}

function whereFor(community: Community): string {
  if (community.platform !== "reddit") {
    switch (community.platform) {
      case "hackernews":
        return "Submit as a Show HN with your URL.";
      case "discord":
        return "Post in #showcase / #i-made-this.";
      default:
        return "Submit through the listing form.";
    }
  }
  switch (community.self_promo_policy) {
    case "welcome":
      return "Post it as a normal standalone post.";
    case "megathread_only":
      return "Only in the weekly / megathread.";
    case "comment_only":
      return "Share it as a comment in a relevant thread.";
    case "banned":
      return "Engage only — don't post your product.";
    default:
      return "Check the rules for where promo is allowed.";
  }
}

function skeletonFor(platform: string): string[] {
  switch (platform) {
    case "reddit":
      return [
        "the problem you hit, or why you built it",
        "what it does, plainly + your link in context",
        "a specific question so it reads as discussion",
      ];
    case "hackernews":
      return [
        "Show HN: [specific, plain title]",
        "what it is + the one interesting technical decision",
      ];
    case "x":
      return ["one concrete hook — what it is, who it's for (≤280 chars)"];
    case "discord":
      return ["casual intro — what you made + why", "your link", "light ask: 'lmk what you think'"];
    default:
      return ["plain tagline", "one paragraph: what it is, who it's for, the clearest benefit"];
  }
}

function angleFor(community: Community, analysis?: ProductAnalysis | null): string | null {
  const strengths = analysis?.strengths?.filter(Boolean) ?? [];
  if (strengths.length === 0) return null;
  // Pick a stable strength per community so different cards surface different
  // angles instead of all repeating the first one.
  return strengths[community.id % strengths.length];
}

export function buildBrief(
  community: Community,
  analysis?: ProductAnalysis | null
): PostingBrief {
  const policy = POLICY[community.self_promo_policy] ?? POLICY.welcome;
  const link = linkInfo(community);
  const karmaTier = community.karma_tier
    ? community.karma_tier[0].toUpperCase() + community.karma_tier.slice(1)
    : null;

  const warn =
    community.platform === "reddit"
      ? "No bare links, no shorteners, no verbatim AI text — all get auto-removed."
      : "No hype words, no verbatim AI text.";

  return {
    policyLabel: policy.label,
    policyTone: policy.tone,
    where: whereFor(community),
    linkChip: link.chip,
    linkTone: link.tone,
    length: lengthFor(community.platform),
    title: titleFor(community.platform),
    karmaTier,
    karmaNote: community.karma_note ?? "",
    bestTime: community.best_time ?? null,
    rules: community.rules_summary ?? community.self_promo_note ?? null,
    angle: angleFor(community, analysis),
    skeleton: skeletonFor(community.platform),
    warn,
  };
}
