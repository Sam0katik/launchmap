import type { Community } from "./types";

// Build a per-community "posting brief" — the rules a user must follow to post
// here without getting removed/banned, plus a fill-in skeleton so they write
// their OWN post in the correct shape. No AI: this is derived from the curated
// community fields + platform conventions, so it's accurate and free.

export interface PostingBrief {
  where: string; // where/how to post (standalone vs thread vs comment)
  links: string; // link policy
  length: string; // recommended length for this platform
  title: string; // title/headline format
  karma: string; // karma bar (honest)
  account: string; // account-age guidance
  bestTime: string | null;
  dos: string[];
  donts: string[];
  skeleton: string[]; // fill-in lines the user completes
}

function lengthFor(platform: string): string {
  switch (platform) {
    case "reddit":
      return "Short — a few sentences, under ~110 words. Long self-promo gets removed.";
    case "hackernews":
      return "Under ~90 words. One sentence on what it is + the one interesting technical detail.";
    case "x":
      return "One line, under 280 characters. No thread, no hashtags.";
    case "discord":
      return "2–3 sentences (~55 words). A message, not a post.";
    default:
      return "One short paragraph (~55 words).";
  }
}

function titleFor(platform: string): string {
  switch (platform) {
    case "reddit":
      return "Specific, lowercase-ish, under ~12 words. No clickbait, no Title Case.";
    case "hackernews":
      return 'Must start with "Show HN:" then a plain, specific title.';
    case "x":
      return "The post itself is the title — make the first words count.";
    case "discord":
      return "No headline — just start the message.";
    default:
      return "A plain, specific tagline (no hype words).";
  }
}

function karmaFor(community: Community): string {
  const note = community.karma_note ? ` ${community.karma_note}` : "";
  // Honest: Reddit doesn't publish exact thresholds — these are practical bars.
  switch (community.karma_tier) {
    case "easy":
      return `Low bar. New-ish accounts are usually fine, but comment for a few days first to clear the spam filter.${note}`;
    case "medium":
      return `Medium bar. Build some history first — roughly 50–100+ comment karma helps you clear the filter.${note}`;
    case "hard":
      return `High bar. Established account with real karma; brand-new accounts get filtered or auto-removed.${note}`;
    default:
      return `Comment a bit first to clear the new-user spam filter.${note}`;
  }
}

function linksFor(community: Community): string {
  if (community.platform === "reddit") {
    switch (community.self_promo_policy) {
      case "welcome":
        return "One link allowed, in context (not a bare link).";
      case "megathread_only":
      case "comment_only":
        return "Put your link in a comment or the allowed thread — posts that contain external links are often auto-removed here.";
      case "banned":
        return "No links / no self-promo.";
      default:
        return "Keep links in context; never post a bare link.";
    }
  }
  if (community.platform === "hackernews") return "The link is the submission (URL field).";
  if (community.platform === "discord") return "Drop the link inline, once.";
  return "Link is part of the listing.";
}

function whereFor(community: Community): string {
  if (community.platform !== "reddit") {
    switch (community.platform) {
      case "hackernews":
        return "Submit as a Show HN with your URL.";
      case "discord":
        return "Post in the right channel (usually #showcase / #i-made-this).";
      default:
        return "Submit through the listing form.";
    }
  }
  switch (community.self_promo_policy) {
    case "welcome":
      return "Post it as a normal standalone post.";
    case "megathread_only":
      return `Only in the weekly / megathread — standalone launch posts get removed.${community.self_promo_note ? ` (${community.self_promo_note})` : ""}`;
    case "comment_only":
      return "Share it as a comment in the relevant thread, not a new post.";
    case "banned":
      return "No self-promotion here — engage only, don't post your product.";
    default:
      return "Check the rules for where self-promo is allowed.";
  }
}

function skeletonFor(platform: string): string[] {
  switch (platform) {
    case "reddit":
      return [
        "[1 line — the problem you hit, or why you built it]",
        "[1–2 lines — what it does, plainly + your link in context]",
        "[a specific question for this community so it reads as a discussion]",
      ];
    case "hackernews":
      return [
        "Show HN: [specific, plain title]",
        "[what it is in one sentence + the one genuinely interesting technical decision]",
      ];
    case "x":
      return ["[one concrete hook line — what it is, who it's for — under 280 chars]"];
    case "discord":
      return [
        "[casual intro — what you made and why, 1–2 sentences]",
        "[your link]",
        "[light ask: 'lmk what you think']",
      ];
    default:
      return [
        "[plain tagline]",
        "[one paragraph: what it is, who it's for, the clearest single benefit]",
      ];
  }
}

export function buildBrief(community: Community): PostingBrief {
  const dos = [
    "Write it in your own words — a real, specific human voice.",
    "Reference one concrete detail (a real feature or the exact problem it solves).",
  ];
  const donts = [
    "No hype words (best, revolutionary, game-changer, seamless, effortless).",
    "No emoji, hashtags, or sign-off. No verbatim AI text — it gets detected.",
  ];
  if (community.platform === "reddit") {
    dos.push("Comment on other posts here first so you're not a drive-by.");
    donts.push("No link shorteners (bit.ly etc.) — near-universal auto-removal.");
  }

  return {
    where: whereFor(community),
    links: linksFor(community),
    length: lengthFor(community.platform),
    title: titleFor(community.platform),
    karma: karmaFor(community),
    account: "Use an account 2–4+ weeks old with a verified email.",
    bestTime: community.best_time ?? null,
    dos,
    donts,
    skeleton: skeletonFor(community.platform),
  };
}
