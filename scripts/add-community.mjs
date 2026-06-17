#!/usr/bin/env node
// Interactive "add a community" wizard. Prompts each field, validates, assigns
// the next id, stamps verified_at = today, appends to data/communities.json,
// and regenerates supabase/seed.sql. The convenient way to grow the DB.
//
// Usage: npm run db:add

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { execFileSync } from "node:child_process";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "data", "communities.json");

const PLATFORMS = ["reddit", "discord", "x", "hackernews", "directory"];
const POLICIES = ["welcome", "megathread_only", "comment_only", "banned"];
const KARMA = ["easy", "medium", "hard"];
const ACTIVITY = ["active", "moderate", "low"];

const rl = readline.createInterface({ input, output });

async function ask(label, { required = true, choices = null, def = null } = {}) {
  const hint = choices ? ` (${choices.join(" / ")})` : "";
  const dft = def !== null ? ` [${def || "none"}]` : "";
  for (;;) {
    const ans = (await rl.question(`${label}${hint}${dft}: `)).trim();
    if (!ans && def !== null) return def;
    if (!ans && !required) return null;
    if (!ans) {
      console.log("  ↳ required.");
      continue;
    }
    if (choices && !choices.includes(ans)) {
      console.log(`  ↳ pick one of: ${choices.join(", ")}`);
      continue;
    }
    return ans;
  }
}

const rows = JSON.parse(readFileSync(SRC, "utf8"));
const nextId = rows.reduce((m, r) => Math.max(m, r.id), 0) + 1;
const today = new Date().toISOString().slice(0, 10);

console.log(`\n🗺  Add community #${nextId} (verified ${today})\n`);

const platform = await ask("platform", { choices: PLATFORMS });
const name = await ask("name (e.g. r/SideProject)");
const url = await ask("url (https://…)");
const tagsRaw = await ask("niche_tags (comma-separated, lowercase)");
const self_promo_policy = await ask("self_promo_policy", { choices: POLICIES });
const self_promo_note = await ask("self_promo_note (one specific caveat)");
const rules_summary = await ask("rules_summary (what's removed + required format)");
const karma_tier = await ask("karma_tier", { choices: KARMA, required: false });
const karma_note = await ask("karma_note", { required: false });
const activity_level = await ask("activity_level", { choices: ACTIVITY, required: false });
const best_time = await ask("best_time (e.g. Tue-Thu 9-12 ET)", { required: false });
const submit_template = await ask("submit_template (optional, {title}/{body})", {
  required: false,
  def: "",
});

rl.close();

if (!/^https?:\/\//.test(url)) {
  console.error("\n✗ url must start with http(s):// — aborting, nothing written.");
  process.exit(1);
}

const row = {
  id: nextId,
  platform,
  name,
  url,
  niche_tags: tagsRaw.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean),
  self_promo_policy,
  self_promo_note: self_promo_note || null,
  rules_summary: rules_summary || null,
  karma_tier: karma_tier || null,
  karma_note: karma_note || null,
  activity_level: activity_level || null,
  best_time: best_time || null,
  submit_template: submit_template || null,
  verified_at: today,
};

rows.push(row);
writeFileSync(SRC, JSON.stringify(rows, null, 2) + "\n", "utf8");
console.log(`\n✓ Added "${name}" (id ${nextId}) → data/communities.json`);

// Regenerate the SQL so it stays in sync.
execFileSync(process.execPath, [join(ROOT, "scripts", "gen-seed.mjs")], {
  stdio: "inherit",
});
console.log("✓ seed.sql regenerated. Reload /demo or /communities to see it.\n");
