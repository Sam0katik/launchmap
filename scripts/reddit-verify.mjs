#!/usr/bin/env node
// Verify subreddit data against the LIVE Reddit API and update
// data/communities.json with real subscriber counts (reach) + verified_at.
//
// Reddit doesn't publish karma thresholds (AutoMod configs are private), so the
// curated policy/karma fields stay as-is — this fills the objectively-knowable
// facts: subscriber count, whether the sub is public/restricted, and refreshes
// the verified date. After running, regenerate the seed: `npm run db:seed-gen`.
//
// SETUP (one-time):
//   1. Create a Reddit app: https://www.reddit.com/prefs/apps → "create app"
//      → type "script" (or "web app"). Note the client id + secret.
//   2. Export credentials:
//        export REDDIT_CLIENT_ID=...
//        export REDDIT_CLIENT_SECRET=...
//        export REDDIT_USER_AGENT="zerofans-verify/1.0 by u/yourname"
//   3. Run: node scripts/reddit-verify.mjs   (or: npm run db:reddit-verify)
//
// Respects Reddit's rate limit (~1 req/sec) and never auto-posts anything.

import { readFileSync, writeFileSync } from "node:fs";

const SRC = "data/communities.json";
const ID = process.env.REDDIT_CLIENT_ID;
const SECRET = process.env.REDDIT_CLIENT_SECRET;
const UA = process.env.REDDIT_USER_AGENT || "zerofans-verify/1.0";

if (!ID || !SECRET) {
  console.error(
    "[reddit-verify] Missing REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET. See the header of this file for setup."
  );
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const today = new Date().toISOString().slice(0, 10);

async function getToken() {
  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${ID}:${SECRET}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": UA,
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    throw new Error(`token request failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()).access_token;
}

async function aboutSub(token, sub) {
  const res = await fetch(`https://oauth.reddit.com/r/${sub}/about`, {
    headers: { Authorization: `Bearer ${token}`, "User-Agent": UA },
  });
  if (res.status === 404) return { notFound: true };
  if (res.status === 403) return { forbidden: true };
  if (!res.ok) throw new Error(`about ${sub}: ${res.status}`);
  const d = (await res.json()).data ?? {};
  return {
    subscribers: d.subscribers ?? null,
    type: d.subreddit_type ?? null, // public | restricted | private
    submission: d.submission_type ?? null, // any | link | self
    over18: !!d.over18,
  };
}

const rows = JSON.parse(readFileSync(SRC, "utf8"));
const token = await getToken();
let updated = 0;
const issues = [];

for (const r of rows) {
  if (r.platform !== "reddit") continue;
  const sub = r.name.replace(/^r\//i, "").trim();
  try {
    const info = await aboutSub(token, sub);
    if (info.notFound) {
      issues.push(`${r.name}: NOT FOUND (renamed/banned?)`);
    } else if (info.forbidden) {
      issues.push(`${r.name}: private/quarantined (403)`);
    } else {
      r.members = info.subscribers;
      r.verified_at = today;
      if (info.type === "restricted") {
        issues.push(`${r.name}: RESTRICTED — approved submitters only; review policy`);
      }
      if (info.over18) issues.push(`${r.name}: NSFW-flagged`);
      updated++;
      console.log(
        `  ${r.name}: ${info.subscribers?.toLocaleString() ?? "?"} members · ${info.type}`
      );
    }
  } catch (e) {
    issues.push(`${r.name}: ${e.message}`);
  }
  await sleep(1100); // ~1 req/sec
}

writeFileSync(SRC, JSON.stringify(rows, null, 2) + "\n");
console.log(`\n[reddit-verify] updated ${updated} subreddits → ${SRC}`);
if (issues.length) {
  console.log("[reddit-verify] review these:");
  issues.forEach((i) => console.log(`  - ${i}`));
}
console.log("\nNext: npm run db:seed-gen  → then load supabase/seed.sql");
