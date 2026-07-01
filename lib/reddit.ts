// Reddit public-JSON access, routed through a public CORS/relay proxy.
//
// Why the proxy: Reddit blocks datacenter IPs (Vercel's), so a direct
// server-side fetch to reddit.com returns 403/429. Routing through a relay makes
// the request originate from the relay's IP instead. about.json / user about are
// anonymous public reads — no API app, no OAuth. Read-only; never posts.

const RELAY = "https://api.allorigins.win/raw?url=";

function cleanIcon(raw: unknown): string | null {
  if (!raw || typeof raw !== "string") return null;
  const url = raw
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
  return url.startsWith("http") ? url : null;
}

// Throws on a transport/relay failure (so callers can tell "relay down" apart
// from "Reddit returned no such thing"); resolves to parsed JSON or null.
async function relayJson(target: string): Promise<unknown | null> {
  const res = await fetch(RELAY + encodeURIComponent(target), {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`relay ${res.status}`);
  return res.json().catch(() => null);
}

export interface SubAbout {
  subscribers: number | null;
  icon: string | null;
}

/** Subscriber count + icon for one subreddit (name without the "r/"). */
export async function fetchSubAbout(sub: string): Promise<SubAbout | null> {
  const json = (await relayJson(
    `https://www.reddit.com/r/${sub}/about.json`
  )) as { data?: Record<string, unknown> } | null;
  const d = json?.data;
  if (!d) return null;
  return {
    subscribers: typeof d.subscribers === "number" ? d.subscribers : null,
    icon: cleanIcon(d.community_icon) || cleanIcon(d.icon_img),
  };
}

export interface UserKarma {
  name: string;
  totalKarma: number;
  linkKarma: number;
  commentKarma: number;
  createdUtc: number; // seconds
}

/** Public karma + account age for a Reddit username. */
export async function fetchUserKarma(name: string): Promise<UserKarma | null> {
  const clean = name.replace(/^u\//i, "").trim();
  if (!clean) return null;
  const json = (await relayJson(
    `https://www.reddit.com/user/${clean}/about.json`
  )) as { data?: Record<string, unknown> } | null;
  const d = json?.data;
  if (!d || typeof d.name !== "string") return null;
  return {
    name: d.name as string,
    totalKarma: Number(d.total_karma ?? 0),
    linkKarma: Number(d.link_karma ?? 0),
    commentKarma: Number(d.comment_karma ?? 0),
    createdUtc: Number(d.created_utc ?? 0),
  };
}
