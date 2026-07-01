// Reddit public-JSON access.
//
// Reddit blocks datacenter IPs (Vercel's), so we can't fetch reddit.com
// directly. Preferred path: route the request through Apify's residential proxy
// (reliable, uses your Apify account) when APIFY_PROXY_PASSWORD is set. Fallback:
// a cascade of free public relays. Fields are extracted with tolerant regexes
// (some sources return raw JSON, some wrap it). about.json / user about are
// anonymous public reads — no API app, no OAuth. Read-only; never posts.

const RELAYS: ((target: string) => string)[] = [
  (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  (u) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
  (u) => `https://thingproxy.freeboard.io/fetch/${u}`,
  (u) => `https://r.jina.ai/${u}`,
];

const HEADERS = {
  Accept: "application/json, text/plain, */*",
  "User-Agent": "Mozilla/5.0 (compatible; launchmap/1.0)",
};

function looksLikeData(text: string): boolean {
  return !!text && text.length > 20 && /[:{]/.test(text);
}

// Fetch reddit.com directly through Apify's residential proxy. Returns null when
// no proxy password is configured or the request failed.
async function apifyProxyText(target: string): Promise<string | null> {
  const pw = process.env.APIFY_PROXY_PASSWORD;
  if (!pw) return null;
  try {
    // Use undici's own fetch + ProxyAgent together (Node's global fetch may not
    // honour a dispatcher from a separately-installed undici copy).
    const { fetch: undiciFetch, ProxyAgent } = await import("undici");
    // Reddit blocks datacenter IPs, so RESIDENTIAL is the group that actually
    // gets through. Override via APIFY_PROXY_GROUP if needed (e.g. "auto").
    const group = process.env.APIFY_PROXY_GROUP || "RESIDENTIAL";
    const user = group === "auto" ? "auto" : `groups-${group}`;
    const dispatcher = new ProxyAgent(
      `http://${user}:${pw}@proxy.apify.com:8000`
    );
    const res = await undiciFetch(target, {
      headers: HEADERS,
      dispatcher,
      signal: AbortSignal.timeout(7000),
    });
    if (!res.ok) return null;
    const text = await res.text();
    return looksLikeData(text) ? text : null;
  } catch {
    return null;
  }
}

// Fetch a URL via Apify proxy first, then whichever public relay responds. Null
// when everything failed (treat that as "Reddit unreachable"). Pass apifyOnly
// to skip the slow public relays (used by the batched admin refresh so each
// request stays within the serverless time limit).
async function relayText(
  target: string,
  apifyOnly = false
): Promise<string | null> {
  const viaApify = await apifyProxyText(target);
  if (viaApify) return viaApify;
  if (apifyOnly) return null;

  for (const build of RELAYS) {
    try {
      const res = await fetch(build(target), {
        headers: HEADERS,
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const text = await res.text();
      if (looksLikeData(text)) return text;
    } catch {
      /* try the next relay */
    }
  }
  return null;
}

function pickNumber(text: string, key: string): number | null {
  const m = text.match(new RegExp(`"${key}"\\s*:\\s*(\\d+(?:\\.\\d+)?)`));
  return m ? Number(m[1]) : null;
}

function pickString(text: string, key: string): string | null {
  const m = text.match(new RegExp(`"${key}"\\s*:\\s*"([^"]*)"`));
  return m ? m[1] : null;
}

function cleanIcon(raw: string | null): string | null {
  if (!raw) return null;
  const url = raw
    .replace(/\\u0026/g, "&")
    .replace(/&amp;/g, "&")
    .replace(/\\\//g, "/")
    .trim();
  return url.startsWith("http") ? url : null;
}

export interface SubAbout {
  subscribers: number | null;
  icon: string | null;
}

/** Subscriber count + icon for one subreddit (name without the "r/").
 *  Throws when every relay failed (unreachable), vs returning null for
 *  "responded but nothing parseable". */
export async function fetchSubAbout(
  sub: string,
  apifyOnly = false
): Promise<SubAbout | null> {
  const text = await relayText(
    `https://www.reddit.com/r/${sub}/about.json`,
    apifyOnly
  );
  if (text === null) throw new Error("relay_unreachable");
  const subscribers = pickNumber(text, "subscribers");
  const icon =
    cleanIcon(pickString(text, "community_icon")) ||
    cleanIcon(pickString(text, "icon_img"));
  if (subscribers == null && !icon) return null;
  return { subscribers, icon };
}

// (The relay-based user-karma fetch moved to lib/apify.ts — relays never get
// through from Vercel; the karma check now runs the Apify actor instead.)
