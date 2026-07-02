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
    const url = (it.postUrl ?? it.url ?? it.link ?? it.permalink) as
      | string
      | undefined;
    const title = (it.title ?? it.postTitle) as string | undefined;
    if (!url || !title) continue;
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
    });
  }
  return { status: "SUCCEEDED", threads: threads.slice(0, 20) };
}

function numOrNull(v: unknown): number | null {
  return typeof v === "number" ? v : null;
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
// One actor run over every subreddit URL: pulls real member counts, icons and
// community rules/description into the DB. Same start + poll pattern.

export interface ScannedCommunity {
  name: string; // subreddit name without "r/"
  members: number | null;
  icon: string | null;
  rules: string[]; // scraped rule titles/lines (may be empty)
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
    // One post per sub keeps billing minimal; the community item rides along.
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

function asRuleList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((r) => {
      if (typeof r === "string") return r;
      if (r && typeof r === "object") {
        const o = r as Record<string, unknown>;
        const title = typeof o.title === "string" ? o.title : "";
        const desc =
          typeof o.description === "string"
            ? o.description
            : typeof o.shortName === "string"
              ? o.shortName
              : "";
        return [title, desc].filter(Boolean).join(" — ");
      }
      return "";
    })
    .filter((s) => s.length > 2)
    .slice(0, 8);
}

/** Poll a community-scan run; on success, parse community items. */
export async function getCommunityScanResult(
  runId: string
): Promise<
  | { status: "RUNNING" }
  | { status: "FAILED" }
  | { status: "SUCCEEDED"; communities: ScannedCommunity[] }
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
  if (!itemsRes.ok) return { status: "SUCCEEDED", communities: [] };
  const items = (await itemsRes.json().catch(() => [])) as Record<
    string,
    unknown
  >[];

  const out: ScannedCommunity[] = [];
  for (const it of Array.isArray(items) ? items : []) {
    const type = (it.dataType ?? it.type) as string | undefined;
    if (type && type !== "community" && type !== "subreddit") continue;
    // Community name may come as "r/SaaS", "SaaS", or a URL.
    const rawName =
      (it.communityName as string) ??
      (it.parsedCommunityName as string) ??
      (it.displayName as string) ??
      (it.name as string) ??
      "";
    const name = String(rawName).replace(/^r\//i, "").trim();
    if (!name) continue;
    out.push({
      name,
      members: numOrNull(
        it.numberOfMembers ?? it.members ?? it.subscribers ?? it.memberCount
      ),
      icon:
        cleanIcon(
          (it.communityIcon as string) ??
            (it.icon as string) ??
            (it.iconUrl as string) ??
            null
        ) ?? null,
      rules: asRuleList(it.rules ?? it.communityRules),
    });
  }
  return { status: "SUCCEEDED", communities: out };
}

function cleanIcon(raw: string | null): string | null {
  if (!raw || typeof raw !== "string") return null;
  const url = raw.replace(/&amp;/g, "&").replace(/\\u0026/g, "&").trim();
  return url.startsWith("http") ? url : null;
}

// ── Quality ranking ─────────────────────────────────────────────
// Raw search results are noisy: bot cross-posts (same headline in 6 subs),
// promo spam, off-topic hits. Dedupe + score + keep only what a maker can
// actually jump into with a comment.

const QUESTION_RE =
  /\?|^(how|what|which|why|anyone|any |best |recommend|looking for|need |advice|thoughts|feedback|help)/i;
const SPAM_RE =
  /expert \||management \||specialist \||roi-focused|dm me|check out my|use code|discount|% off/i;

/** Dedupe, drop spam, score for engageability, return the best `limit`. */
export function rankThreads(
  threads: RedditThread[],
  terms: string[],
  limit = 10
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

    // HARD relevance gate: the thread must actually mention the product's
    // space — whole-word in the title, or word-start in the subreddit name.
    // Without this, Reddit search noise (game subs, fanfic) floods the list.
    const sub = (t.subreddit ?? "").toLowerCase().replace(/^r\//, "");
    const onTopic = tokenRes.some(
      ({ k, re }) => re.test(title) || sub.startsWith(k) || sub.endsWith(k)
    );
    if (!onTopic) continue;

    let score = 0;
    // A question / ask is the easiest thing to genuinely reply to.
    if (QUESTION_RE.test(t.title)) score += 4;
    // Actual discussion happening.
    if ((t.comments ?? 0) >= 2) score += 3;
    else if ((t.comments ?? 0) >= 1) score += 1;
    if ((t.upvotes ?? 0) >= 3) score += 1;

    scored.push({ t, score });
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.t);
}
