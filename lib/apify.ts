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
    searchSort: "new",
    searchTime: "all",
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

    let score = 0;
    // A question / ask is the easiest thing to genuinely reply to.
    if (QUESTION_RE.test(t.title)) score += 4;
    // Actual discussion happening.
    if ((t.comments ?? 0) >= 2) score += 3;
    else if ((t.comments ?? 0) >= 1) score += 1;
    if ((t.upvotes ?? 0) >= 3) score += 1;
    // On-topic: title mentions the product's keywords.
    if (tokens.some((k) => title.includes(k))) score += 2;

    scored.push({ t, score });
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.t);
}
