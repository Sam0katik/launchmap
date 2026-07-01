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
// Reddit Scraper Lite (the actor id from the run you kicked off).
const ACTOR_ID = process.env.APIFY_REDDIT_ACTOR || "oAuClx3ItNrs2okjQ";

export function apifyConfigured(): boolean {
  return !!process.env.APIFY_TOKEN;
}

export interface RedditThread {
  title: string;
  url: string;
  subreddit: string | null;
  upvotes: number | null;
  comments: number | null;
}

/** Start an actor run searching recent posts for `query`. Returns the run id,
 *  or an { error } with a short detail so failures are diagnosable. */
export async function startRedditSearch(
  query: string
): Promise<{ runId: string } | { error: string }> {
  const token = process.env.APIFY_TOKEN;
  if (!token) return { error: "no_token" };
  // Input matched to trudax/reddit-scraper-lite's schema. includeMediaLinks
  // must be true to get up-votes + comment counts. The actor scrapes through
  // Apify's own residential proxy (billed per result), which is why it works
  // where our direct proxy didn't.
  const input = {
    searches: [query],
    searchPosts: true,
    searchComments: false,
    searchCommunities: false,
    searchUsers: false,
    searchMedia: false,
    sort: "new",
    includeMediaLinks: true,
    includeNSFW: false,
    maxItems: 25,
    maxPostCount: 25,
    maxComments: 0,
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
    const url = (it.url ?? it.link ?? it.permalink) as string | undefined;
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
      comments: numOrNull(it.numberOfComments ?? it.numComments),
    });
  }
  return { status: "SUCCEEDED", threads: threads.slice(0, 20) };
}

function numOrNull(v: unknown): number | null {
  return typeof v === "number" ? v : null;
}
