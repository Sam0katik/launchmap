// Apify Reddit actor integration for the "where to jump in" feature.
//
// The proxy path is dead on the free plan (Reddit blocks datacenter IPs, and
// residential needs a paid plan), but running an *actor* works — it scrapes
// Reddit from Apify's own infra. We use the Reddit Scraper Lite actor to search
// recent posts for a product's keywords, so a maker sees live threads to engage.
//
// Set APIFY_TOKEN in the host env (Vercel), never in code.
//
// Actors take ~10–20s, which is over Vercel's function limit, so we START a run
// (returns fast) and POLL it, rather than running synchronously.

const API = "https://api.apify.com/v2";
// harshmaur/reddit-scraper — searches Reddit reliably (not 403-blocked like the
// others). Store actors are referenced as `username~actor-name`. Override with
// APIFY_REDDIT_ACTOR if needed.
const ACTOR_ID =
  process.env.APIFY_REDDIT_ACTOR || "harshmaur~reddit-scraper";

export function apifyConfigured(): boolean {
  return !!process.env.APIFY_TOKEN;
}

/** Per-product search terms from the analysis: up to 2 niche tags (hyphens →
 *  spaces), falling back to the category. Shared by the start route (to run
 *  the search) and the result route (to rank what came back). */
export function buildSearchTerms(analysis: {
  niche_tags?: string[];
  category?: string;
} | null): string[] {
  const clean = (s: string) => s.replace(/[-_]+/g, " ").trim();
  const terms = (analysis?.niche_tags ?? [])
    .filter(Boolean)
    .slice(0, 2)
    .map(clean)
    .filter((t) => t.length > 1);
  if (terms.length === 0 && analysis?.category) {
    const c = clean(analysis.category);
    if (c.length > 1) return [c];
  }
  return terms;
}

export interface RedditThread {
  title: string;
  url: string;
  subreddit: string | null;
  upvotes: number | null;
  comments: number | null;
  createdUtc?: number | null; // epoch seconds, for freshness ranking
}

/** Start an actor run searching recent posts for the given terms. Returns the
 *  run id, or an { error } with a short detail so failures are diagnosable. */
export async function startRedditSearch(
  terms: string[]
): Promise<{ runId: string } | { error: string }> {
  const token = process.env.APIFY_TOKEN;
  if (!token) return { error: "no_token" };
  // Input matched to harshmaur/reddit-scraper's schema (from the working run).
  const input = {
    searchTerms: terms,
    searchPosts: true,
    searchComments: false,
    searchCommunities: false,
    // Relevance within the last month beats "new/all": fresh-but-random junk
    // (game subs, fanfic) drops out, on-topic problem threads float up.
    searchSort: "relevance",
    searchTime: "month",
    // Billed per result — keep runs cheap (~$0.02–0.04); quality comes from
    // ranking/filtering after, not from pulling more.
    maxPostsCount: 10,
    maxCommunitiesCount: 0,
    crawlCommentsPerPost: false,
    fastMode: true,
    includeNSFW: false,
    onlyWithFlair: false,
    proxy: { useApifyProxy: true, apifyProxyGroups: ["RESIDENTIAL"] },
  };
  let res: Response;
  try {
    res = await fetch(`${API}/acts/${ACTOR_ID}/runs?token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(9000),
    });
  } catch {
    return { error: "network" };
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { error: `apify_${res.status}: ${body.slice(0, 160)}` };
  }
  const data = await res.json().catch(() => null);
  const id = data?.data?.id;
  return typeof id === "string" ? { runId: id } : { error: "no_run_id" };
}

interface RunResult {
  status: "RUNNING" | "SUCCEEDED" | "FAILED";
  threads: RedditThread[];
}

/** Poll a run: while running, return status; when done, fetch + parse posts. */
export async function getRedditSearchResult(
  runId: string
): Promise<RunResult | null> {
  const token = process.env.APIFY_TOKEN;
  if (!token) return null;

  const runRes = await fetch(`${API}/actor-runs/${runId}?token=${token}`, {
    signal: AbortSignal.timeout(9000),
  });
  if (!runRes.ok) return null;
  const runData = await runRes.json().catch(() => null);
  const status = runData?.data?.status as string | undefined;
  const datasetId = runData?.data?.defaultDatasetId as string | undefined;

  if (status === "FAILED" || status === "ABORTED" || status === "TIMED-OUT") {
    return { status: "FAILED", threads: [] };
  }
  if (status !== "SUCCEEDED" || !datasetId) {
    return { status: "RUNNING", threads: [] };
  }

  const itemsRes = await fetch(
    `${API}/datasets/${datasetId}/items?clean=true&limit=40&token=${token}`,
    { signal: AbortSignal.timeout(9000) }
  );
  if (!itemsRes.ok) return { status: "SUCCEEDED", threads: [] };
  const items = (await itemsRes.json().catch(() => [])) as Record<
    string,
    unknown
  >[];

  const threads: RedditThread[] = [];
  for (const it of Array.isArray(items) ? items : []) {
    const type = (it.dataType ?? it.type) as string | undefined;
    if (type && type !== "post") continue;
    // Not joinable: pinned mod posts (years-old megathreads dominate a sub's
    // hot page), archived/locked threads can't be commented on at all.
    if (it.stickied === true || it.pinned === true) continue;
    if (it.archived === true || it.locked === true) continue;
    const url = (it.postUrl ?? it.url ?? it.link ?? it.permalink) as
      | string
      | undefined;
    const title = (it.title ?? it.postTitle) as string | undefined;
    if (!url || !title) continue;
    // createdAt arrives as an ISO string (or epoch); normalize to seconds.
    let createdUtc: number | null = null;
    const rawCreated = it.createdAt ?? it.created ?? it.createdUtc;
    if (typeof rawCreated === "number") {
      createdUtc = rawCreated > 1e12 ? rawCreated / 1000 : rawCreated;
    } else if (typeof rawCreated === "string") {
      const ms = Date.parse(rawCreated);
      if (!Number.isNaN(ms)) createdUtc = ms / 1000;
    }
    threads.push({
      title: String(title).slice(0, 160),
      url: String(url),
      subreddit:
        (it.communityName as string) ??
        (it.parsedCommunityName as string) ??
        (it.subreddit as string) ??
        null,
      upvotes: numOrNull(it.upVotes ?? it.score ?? it.numberOfUpVotes),
      comments: numOrNull(
        it.commentsCount ?? it.numberOfComments ?? it.numComments
      ),
      createdUtc,
    });
  }
  return { status: "SUCCEEDED", threads: threads.slice(0, 20) };
}

function numOrNull(v: unknown): number | null {
  return typeof v === "number" ? v : null;
}

/** The map's top reddit communities (from the stored ranked result) — used to
 *  scope the thread search to subs that are already on-topic. */
export function mapRedditSubs(result: unknown, max = 6): string[] {
  if (!Array.isArray(result)) return [];
  const subs: string[] = [];
  for (const r of result) {
    const c = (r as { community?: { platform?: string; name?: string } })
      ?.community;
    if (c?.platform === "reddit" && typeof c.name === "string") {
      const s = c.name.replace(/^r\//i, "").trim();
      if (s && !subs.includes(s)) subs.push(s);
    }
    if (subs.length >= max) break;
  }
  return subs;
}

/** Start an actor run pulling the current hot posts of specific subreddits
 *  (the map's own matched communities — guaranteed on-topic, unlike global
 *  search). Uses Direct URLs, the actor's most reliable mode. */
export async function startSubredditsScrape(
  subs: string[]
): Promise<{ runId: string } | { error: string }> {
  const token = process.env.APIFY_TOKEN;
  if (!token) return { error: "no_token" };
  const input = {
    // maxPostsCount bills PER start URL (a 6-sub run with 50 returned 300
    // results / $0.62) — keep it tight: 5 subs × 6 posts ≈ 30 results ≈ $0.06.
    startUrls: subs
      .slice(0, 5)
      .map((s) => ({ url: `https://www.reddit.com/r/${s}/` })),
    searchPosts: false,
    searchComments: false,
    searchCommunities: false,
    maxPostsCount: 6,
    maxCommentsCount: 1,
    crawlCommentsPerPost: false,
    fastMode: true,
    includeNSFW: false,
    onlyWithFlair: false,
    proxy: { useApifyProxy: true, apifyProxyGroups: ["RESIDENTIAL"] },
  };
  let res: Response;
  try {
    res = await fetch(`${API}/acts/${ACTOR_ID}/runs?token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(9000),
    });
  } catch {
    return { error: "network" };
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { error: `apify_${res.status}: ${body.slice(0, 160)}` };
  }
  const data = await res.json().catch(() => null);
  const id = data?.data?.id;
  return typeof id === "string" ? { runId: id } : { error: "no_run_id" };
}

// ── User karma via the same actor ───────────────────────────────
// The public relays never get through from Vercel, so the karma check runs the
// actor against the user's profile URL (Direct URLs input) and parses the
// "user" item from the dataset. Same async start + poll pattern.

export interface ScrapedUser {
  name: string;
  totalKarma: number;
  linkKarma: number;
  commentKarma: number;
  createdUtc: number; // seconds
}

/** Start an actor run scraping one user profile. */
export async function startUserScrape(
  username: string
): Promise<{ runId: string } | { error: string }> {
  const token = process.env.APIFY_TOKEN;
  if (!token) return { error: "no_token" };
  const input = {
    startUrls: [{ url: `https://www.reddit.com/user/${username}/` }],
    searchPosts: false,
    searchComments: false,
    searchCommunities: false,
    // Keep the billed result count minimal — we only need the profile item.
    maxPostsCount: 1,
    maxCommentsCount: 1,
    crawlCommentsPerPost: false,
    fastMode: true,
    includeNSFW: true,
    onlyWithFlair: false,
    proxy: { useApifyProxy: true, apifyProxyGroups: ["RESIDENTIAL"] },
  };
  let res: Response;
  try {
    res = await fetch(`${API}/acts/${ACTOR_ID}/runs?token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(9000),
    });
  } catch {
    return { error: "network" };
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { error: `apify_${res.status}: ${body.slice(0, 160)}` };
  }
  const data = await res.json().catch(() => null);
  const id = data?.data?.id;
  return typeof id === "string" ? { runId: id } : { error: "no_run_id" };
}

/** Poll a user-scrape run; on success, parse karma from the dataset. */
export async function getUserScrapeResult(
  runId: string
): Promise<
  | { status: "RUNNING" }
  | { status: "FAILED" }
  | { status: "SUCCEEDED"; user: ScrapedUser | null }
  | null
> {
  const token = process.env.APIFY_TOKEN;
  if (!token) return null;

  const runRes = await fetch(`${API}/actor-runs/${runId}?token=${token}`, {
    signal: AbortSignal.timeout(9000),
  });
  if (!runRes.ok) return null;
  const runData = await runRes.json().catch(() => null);
  const status = runData?.data?.status as string | undefined;
  const datasetId = runData?.data?.defaultDatasetId as string | undefined;

  if (status === "FAILED" || status === "ABORTED" || status === "TIMED-OUT") {
    return { status: "FAILED" };
  }
  if (status !== "SUCCEEDED" || !datasetId) {
    return { status: "RUNNING" };
  }

  const itemsRes = await fetch(
    `${API}/datasets/${datasetId}/items?clean=true&limit=20&token=${token}`,
    { signal: AbortSignal.timeout(9000) }
  );
  if (!itemsRes.ok) return { status: "SUCCEEDED", user: null };
  const items = (await itemsRes.json().catch(() => [])) as Record<
    string,
    unknown
  >[];

  // The profile row: dataType "user", or any item carrying karma fields.
  const u =
    (Array.isArray(items) ? items : []).find(
      (it) => (it.dataType ?? it.type) === "user"
    ) ??
    (Array.isArray(items) ? items : []).find(
      (it) =>
        "commentKarma" in it || "postKarma" in it || "karma" in it
    );
  if (!u) return { status: "SUCCEEDED", user: null };

  const link = numOrNull(u.postKarma ?? u.linkKarma) ?? 0;
  const comment = numOrNull(u.commentKarma) ?? 0;
  const total = numOrNull(u.karma ?? u.totalKarma) ?? link + comment;
  // createdAt may be an ISO string or epoch seconds.
  let createdUtc = 0;
  const rawCreated = u.createdAt ?? u.created ?? u.createdUtc;
  if (typeof rawCreated === "number") {
    createdUtc = rawCreated > 1e12 ? rawCreated / 1000 : rawCreated;
  } else if (typeof rawCreated === "string") {
    const ms = Date.parse(rawCreated);
    if (!Number.isNaN(ms)) createdUtc = ms / 1000;
  }
  const name =
    (typeof u.username === "string" && u.username) ||
    (typeof u.name === "string" && u.name) ||
    "";
  return {
    status: "SUCCEEDED",
    user: {
      name: name.replace(/^u\//i, ""),
      totalKarma: total,
      linkKarma: link,
      commentKarma: comment,
      createdUtc,
    },
  };
}

// ── Community scan (admin) ──────────────────────────────────────
// One actor run over every subreddit URL. The actor returns POSTS (not
// community cards), but every post carries `subredditSubscribers` — the real
// member count — and pinned moderator posts ARE the sub's live posting policy
// ("Addressing Self-Promotion…", "New rule banning…"). Icons are not present
// in the output at all, so avatars stay as monograms.

export interface ScannedCommunity {
  name: string; // subreddit name without "r/"
  members: number | null;
  rules: string[]; // the subreddit's own rules, straight from its rules widget
}

/** Pull rule strings out of whatever shape the actor hands back for a
 *  subreddit's rules — an array of strings, or of objects keyed by
 *  shortName/short_name/title/name/description. Returns [] for anything else,
 *  so we only ever store real rules (never fabricate). */
function parseRules(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const r of raw) {
    if (typeof r === "string") {
      const s = r.trim();
      if (s) out.push(s.slice(0, 160));
    } else if (r && typeof r === "object") {
      const o = r as Record<string, unknown>;
      const label =
        (o.shortName as string) ??
        (o.short_name as string) ??
        (o.title as string) ??
        (o.name as string) ??
        (o.description as string) ??
        "";
      const s = String(label).trim();
      if (s) out.push(s.slice(0, 160));
    }
    if (out.length >= 15) break;
  }
  return out;
}

/** Start an actor run scraping community info for the given subreddit names. */
export async function startCommunityScan(
  subs: string[]
): Promise<{ runId: string } | { error: string }> {
  const token = process.env.APIFY_TOKEN;
  if (!token) return { error: "no_token" };
  const input = {
    startUrls: subs.map((s) => ({ url: `https://www.reddit.com/r/${s}/` })),
    searchPosts: false,
    searchComments: false,
    searchCommunities: false,
    // 3 posts per sub: enough to catch the pinned mod-policy posts that sit at
    // the top of hot, while keeping a 35-sub scan around ~100 results (~$0.2).
    maxPostsCount: 3,
    maxCommentsCount: 1,
    crawlCommentsPerPost: false,
    fastMode: true,
    includeNSFW: true,
    onlyWithFlair: false,
    proxy: { useApifyProxy: true, apifyProxyGroups: ["RESIDENTIAL"] },
  };
  let res: Response;
  try {
    res = await fetch(`${API}/acts/${ACTOR_ID}/runs?token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(9000),
    });
  } catch {
    return { error: "network" };
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { error: `apify_${res.status}: ${body.slice(0, 160)}` };
  }
  const data = await res.json().catch(() => null);
  const id = data?.data?.id;
  return typeof id === "string" ? { runId: id } : { error: "no_run_id" };
}

/** Poll a community-scan run; on success, aggregate post items per sub. */
export async function getCommunityScanResult(
  runId: string
): Promise<
  | { status: "RUNNING" }
  | { status: "FAILED" }
  | { status: "SUCCEEDED"; communities: ScannedCommunity[]; sampleKeys: string[] }
  | null
> {
  const token = process.env.APIFY_TOKEN;
  if (!token) return null;

  const runRes = await fetch(`${API}/actor-runs/${runId}?token=${token}`, {
    signal: AbortSignal.timeout(9000),
  });
  if (!runRes.ok) return null;
  const runData = await runRes.json().catch(() => null);
  const status = runData?.data?.status as string | undefined;
  const datasetId = runData?.data?.defaultDatasetId as string | undefined;

  if (status === "FAILED" || status === "ABORTED" || status === "TIMED-OUT") {
    return { status: "FAILED" };
  }
  if (status !== "SUCCEEDED" || !datasetId) {
    return { status: "RUNNING" };
  }

  const itemsRes = await fetch(
    `${API}/datasets/${datasetId}/items?clean=true&limit=200&token=${token}`,
    { signal: AbortSignal.timeout(12000) }
  );
  if (!itemsRes.ok) return { status: "SUCCEEDED", communities: [], sampleKeys: [] };
  const items = (await itemsRes.json().catch(() => [])) as Record<
    string,
    unknown
  >[];

  // Aggregate per sub. `subredditSubscribers` (on every post) = real member
  // count. For rules we take ONLY the subreddit's own rules widget if the actor
  // surfaces it (subredditRules / communityRules / rules) — never pinned-post
  // titles, which aren't the actual rules. If it's absent, rules stay empty and
  // the brief falls back to the curated summary. sampleKeys exposes the raw
  // field names from the first item so the source can be verified.
  const sampleKeys = Object.keys(
    (Array.isArray(items) ? items : [])[0] ?? {}
  );
  const bySub = new Map<string, ScannedCommunity>();
  for (const it of Array.isArray(items) ? items : []) {
    const type = (it.dataType ?? it.type) as string | undefined;
    if (type && type !== "post") continue;
    const rawName =
      (it.parsedCommunityName as string) ??
      (it.communityName as string) ??
      "";
    const name = String(rawName).replace(/^r\//i, "").trim();
    if (!name) continue;
    const key = name.toLowerCase();
    const entry = bySub.get(key) ?? { name, members: null, rules: [] };

    const members = numOrNull(it.subredditSubscribers);
    if (members != null) entry.members = members;

    if (entry.rules.length === 0) {
      const parsed = parseRules(
        it.subredditRules ?? it.communityRules ?? it.rules
      );
      if (parsed.length) entry.rules = parsed;
    }
    bySub.set(key, entry);
  }
  return {
    status: "SUCCEEDED",
    communities: Array.from(bySub.values()),
    sampleKeys,
  };
}

// ── Quality ranking ─────────────────────────────────────────────
// Raw search results are noisy: bot cross-posts (same headline in 6 subs),
// promo spam, off-topic hits. Dedupe + score + keep only what a maker can
// actually jump into with a comment.

const QUESTION_RE =
  /\?|^(how|what|which|why|anyone|any |best |recommend|looking for|need |advice|thoughts|feedback|help)/i;
const SPAM_RE =
  /expert \||management \||specialist \||roi-focused|dm me|check out my|use code|discount|% off/i;

/** Dedupe, drop spam, score for engageability, return the best `limit`.
 *  `fromMapSubs`: threads already come from the map's own communities, so the
 *  gate relaxes to "mentions the product's keywords OR is an answerable
 *  question/ask" — a question inside the product's own community is exactly
 *  the kind of thread to jump into. */
export function rankThreads(
  threads: RedditThread[],
  terms: string[],
  limit = 12,
  fromMapSubs = false
): RedditThread[] {
  const tokens = terms
    .flatMap((t) => t.toLowerCase().split(/\s+/))
    .filter((t) => t.length > 2);
  // Whole-word matching, not substring: "ai" must NOT match "antiai"/"maid" —
  // substring matching is exactly how an anti-AI sub slipped into an AI
  // product's list. Subreddit names have no spaces, so allow word-start there.
  const wordRe = (k: string) =>
    new RegExp(`(^|[^a-z0-9])${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^a-z0-9])`);
  const tokenRes = tokens.map((k) => ({ k, re: wordRe(k) }));

  const seen = new Set<string>();
  const scored: { t: RedditThread; score: number }[] = [];

  for (const t of threads) {
    // Dedupe bot cross-posts by normalized title.
    const key = t.title.toLowerCase().replace(/\W+/g, " ").trim().slice(0, 80);
    if (seen.has(key)) continue;
    seen.add(key);

    const title = t.title.toLowerCase();
    if (SPAM_RE.test(title)) continue;
    // Multi-pipe headlines are almost always syndicated promo/news spam.
    if ((t.title.match(/\|/g) ?? []).length >= 2) continue;

    // ALIVE gate — every suggestion must be a joinable conversation. Dead
    // (0 comments + ≤1 upvote) or stale (>45 days) threads are worthless to
    // jump into, so they're dropped even if the list ends up short.
    const ageDays = t.createdUtc
      ? (Date.now() / 1000 - t.createdUtc) / 86400
      : null;
    if (ageDays !== null && ageDays > 45) continue;
    const cc = t.comments ?? 0;
    const uv = t.upvotes ?? 0;
    if (cc === 0 && uv <= 1) continue;

    // Relevance gate. Global search: must mention the product's space —
    // whole-word in the title or word-start in the subreddit name. Map-subs
    // mode: keyword match OR an answerable ask (the sub itself is on-topic).
    const sub = (t.subreddit ?? "").toLowerCase().replace(/^r\//, "");
    const keywordHit = tokenRes.some(
      ({ k, re }) => re.test(title) || sub.startsWith(k) || sub.endsWith(k)
    );
    const isAsk = QUESTION_RE.test(t.title);
    const onTopic = fromMapSubs ? keywordHit || isAsk : keywordHit;
    if (!onTopic) continue;

    let score = 0;
    // Mentioning the product's exact space beats everything else.
    if (keywordHit) score += 5;
    // A question / ask is the easiest thing to genuinely reply to.
    if (isAsk) score += 4;
    // Live-but-joinable dialog: a few comments is the sweet spot — dead
    // threads (0) and saturated ones (50+) are both hard to participate in.
    const c = t.comments ?? 0;
    if (c >= 2 && c <= 30) score += 3;
    else if (c === 1 || (c > 30 && c <= 100)) score += 1;
    if ((t.upvotes ?? 0) >= 3) score += 1;
    // Freshness: a conversation from this week is worth joining; older, less.
    if (t.createdUtc) {
      const days = (Date.now() / 1000 - t.createdUtc) / 86400;
      if (days <= 3) score += 3;
      else if (days <= 14) score += 1;
    }

    scored.push({ t, score });
  }

  // Diversity: at most 3 threads per subreddit, so one busy sub can't fill
  // the whole list.
  const PER_SUB_CAP = 3;
  const perSub = new Map<string, number>();
  const picked: RedditThread[] = [];
  for (const { t } of scored.sort((a, b) => b.score - a.score)) {
    const key = (t.subreddit ?? "?").toLowerCase();
    const n = perSub.get(key) ?? 0;
    if (n >= PER_SUB_CAP) continue;
    perSub.set(key, n + 1);
    picked.push(t);
    if (picked.length >= limit) break;
  }
  return picked;
}
