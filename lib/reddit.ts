// Reddit public-JSON access via a cascade of public relays.
//
// Reddit blocks datacenter IPs (Vercel's), so we can't fetch reddit.com
// directly. We try several public relays in order and use the first that
// answers, then extract fields with tolerant regexes (some relays return raw
// JSON, some wrap/markdownify it). about.json / user about are anonymous public
// reads — no API app, no OAuth. Read-only; never posts.

const RELAYS: ((target: string) => string)[] = [
  (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  (u) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
  (u) => `https://thingproxy.freeboard.io/fetch/${u}`,
  (u) => `https://r.jina.ai/${u}`,
];

// Fetch a URL through whichever relay responds first. Returns the raw body, or
// null when every relay failed (treat that as "Reddit unreachable").
async function relayText(target: string): Promise<string | null> {
  for (const build of RELAYS) {
    try {
      const res = await fetch(build(target), {
        headers: {
          Accept: "application/json, text/plain, */*",
          "User-Agent": "Mozilla/5.0 (compatible; launchmap/1.0)",
        },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const text = await res.text();
      // Guard against relay error pages / empties.
      if (text && text.length > 20 && /[:{]/.test(text)) return text;
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
export async function fetchSubAbout(sub: string): Promise<SubAbout | null> {
  const text = await relayText(`https://www.reddit.com/r/${sub}/about.json`);
  if (text === null) throw new Error("relay_unreachable");
  const subscribers = pickNumber(text, "subscribers");
  const icon =
    cleanIcon(pickString(text, "community_icon")) ||
    cleanIcon(pickString(text, "icon_img"));
  if (subscribers == null && !icon) return null;
  return { subscribers, icon };
}

export interface UserKarma {
  name: string;
  totalKarma: number;
  linkKarma: number;
  commentKarma: number;
  createdUtc: number; // seconds
}

/** Public karma + account age for a Reddit username. Throws when every relay
 *  failed (unreachable); returns null when no such user. */
export async function fetchUserKarma(name: string): Promise<UserKarma | null> {
  const clean = name.replace(/^u\//i, "").trim();
  if (!clean) return null;
  const text = await relayText(
    `https://www.reddit.com/user/${clean}/about.json`
  );
  if (text === null) throw new Error("relay_unreachable");
  const total = pickNumber(text, "total_karma");
  const link = pickNumber(text, "link_karma");
  const comment = pickNumber(text, "comment_karma");
  const created = pickNumber(text, "created_utc");
  // A real user page always has karma fields; their absence = no such user.
  if (total == null && link == null && comment == null) return null;
  return {
    name: clean,
    totalKarma: total ?? (link ?? 0) + (comment ?? 0),
    linkKarma: link ?? 0,
    commentKarma: comment ?? 0,
    createdUtc: created ?? 0,
  };
}
