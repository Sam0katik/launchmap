#!/usr/bin/env node
// Pull REAL subreddit data from Reddit's PUBLIC about.json — no API app, no
// OAuth, no login required. Fills data/communities.json with real subscriber
// counts (reach) + community icon (avatar) + refreshes verified_at.
//
// Why this exists: creating a Reddit "script" app (for the OAuth flow in
// reddit-verify.mjs) can be blocked for some accounts. The public endpoint
// https://www.reddit.com/r/<sub>/about.json returns the same `subscribers`
// plus the icon with zero credentials — it's anonymous read by IP, so a
// banned *account* doesn't matter. Run this from a normal machine (NOT a
// datacenter/proxy IP, which Reddit 403s).
//
// SETUP: none. Just run it on your own computer:
//   node scripts/reddit-fetch.mjs        (or: npm run db:reddit-fetch)
//
// Optional, recommended — set a descriptive UA:
//   export REDDIT_USER_AGENT="launchmap-fetch/1.0 by u/yourname"
//
// After running, regenerate the seed: npm run db:seed-gen → load supabase/seed.sql.
// Never posts anything; read-only; ~1 req/sec.

import { readFileSync, writeFileSync } from "node:fs";

const SRC = "data/communities.json";
const UA =
  process.env.REDDIT_USER_AGENT || "launchmap-fetch/1.0 (public read-only)";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const today = new Date().toISOString().slice(0, 10);

// Reddit double-encodes icon URLs in JSON (&amp; -> &). Decode the few entities
// that actually show up, and drop the empty-string case.
function cleanIcon(raw) {
  if (!raw || typeof raw !== "string") return null;
  const url = raw
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
  return url.startsWith("http") ? url : null;
}

async function aboutSub(sub) {
  const res = await fetch(`https://www.reddit.com/r/${sub}/about.json`, {
    headers: { "User-Agent": UA, Accept: "application/json" },
  });
  if (res.status === 404) return { notFound: true };
  if (res.status === 403) return { forbidden: true };
  if (res.status === 429) return { rateLimited: true };
  if (!res.ok) throw new Error(`about ${sub}: ${res.status}`);
  const d = (await res.json())?.data ?? {};
  // Prefer the styled community icon; fall back to the plain icon_img.
  const icon = cleanIcon(d.community_icon) || cleanIcon(d.icon_img);
  return {
    subscribers: typeof d.subscribers === "number" ? d.subscribers : null,
    icon,
    type: d.subreddit_type ?? null, // public | restricted | private
    over18: !!d.over18,
  };
}

const rows = JSON.parse(readFileSync(SRC, "utf8"));
let updated = 0;
const issues = [];

for (const r of rows) {
  if (r.platform !== "reddit") continue;
  const sub = r.name.replace(/^r\//i, "").trim();
  try {
    let info = await aboutSub(sub);
    // One gentle retry on rate limit.
    if (info.rateLimited) {
      await sleep(5000);
      info = await aboutSub(sub);
    }
    if (info.notFound) {
      issues.push(`${r.name}: NOT FOUND (renamed/banned?)`);
    } else if (info.forbidden) {
      issues.push(`${r.name}: private/quarantined (403)`);
    } else if (info.rateLimited) {
      issues.push(`${r.name}: rate-limited (429) — re-run later`);
    } else {
      if (info.subscribers != null) r.members = info.subscribers;
      if (info.icon) r.icon = info.icon;
      r.verified_at = today;
      if (info.type === "restricted")
        issues.push(`${r.name}: RESTRICTED — approved submitters only; review policy`);
      if (info.over18) issues.push(`${r.name}: NSFW-flagged`);
      updated++;
      console.log(
        `  ${r.name}: ${info.subscribers?.toLocaleString() ?? "?"} members` +
          `${info.icon ? " · icon ✓" : " · no icon"}`
      );
    }
  } catch (e) {
    issues.push(`${r.name}: ${e.message}`);
  }
  await sleep(1100); // ~1 req/sec — stay under Reddit's anonymous limit
}

writeFileSync(SRC, JSON.stringify(rows, null, 2) + "\n");
console.log(`\n[reddit-fetch] updated ${updated} subreddits → ${SRC}`);
if (issues.length) {
  console.log("[reddit-fetch] review these:");
  issues.forEach((i) => console.log(`  - ${i}`));
}
console.log("\nNext: npm run db:seed-gen  → then load supabase/seed.sql");
