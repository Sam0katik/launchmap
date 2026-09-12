import { promises as dns } from "dns";
import { isIP } from "net";

// Landing-page reader for /api/analyze: SSRF-guarded fetch, meta extraction and
// a small same-origin crawl when the landing itself is thin (JS-only shells,
// one-line hero pages). Everything here is best-effort and never throws.

// Sites that are never "your product": platforms, search engines, social
// networks, marketplaces and our own domain. Analyzing one burns a map slot and
// an AI call to produce a meaningless generic map, so we refuse early.
const NOT_A_PRODUCT = new Set([
  "google.com", "youtube.com", "facebook.com", "instagram.com", "tiktok.com",
  "x.com", "twitter.com", "reddit.com", "linkedin.com", "pinterest.com",
  "snapchat.com", "whatsapp.com", "telegram.org", "t.me", "discord.com",
  "twitch.tv", "netflix.com", "spotify.com", "apple.com", "microsoft.com",
  "amazon.com", "ebay.com", "aliexpress.com", "wikipedia.org", "yahoo.com",
  "yandex.ru", "vk.com", "ozon.ru", "wildberries.ru", "avito.ru",
  "producthunt.com", "github.com", "gitlab.com", "stackoverflow.com",
  "medium.com", "substack.com", "notion.so", "chatgpt.com", "openai.com",
  "anthropic.com", "claude.ai", "zerofans.org",
]);

/** True when the URL points at a platform rather than someone's own product. */
export function isNotAProductSite(raw: string): boolean {
  let host: string;
  try {
    host = new URL(raw).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return false;
  }
  if (NOT_A_PRODUCT.has(host)) return true;
  // youtube.co.uk, google.de … — apex + a country/second-level suffix.
  const parts = host.split(".");
  for (let i = 0; i < parts.length - 1; i++) {
    const brand = parts[i];
    if (["google", "youtube", "facebook", "amazon", "yandex"].includes(brand) && i === parts.length - 2) {
      return true;
    }
  }
  return false;
}

/** True only for public http(s) URLs — blocks localhost, link-local (cloud
 *  metadata at 169.254.169.254), private and reserved ranges to prevent SSRF.
 *  Hostname/literal-IP check only; the resolved address is re-checked with
 *  resolvesToPublicIp() right before each fetch. */
export function isSafePublicUrl(raw: string): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return false;

  const host = u.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost")) return false;
  if (host === "metadata" || host.endsWith(".internal")) return false;
  if (isIP(host) && isPrivateIp(host)) return false;
  return true;
}

/** Private / loopback / link-local / reserved — v4, v6 and v4-mapped v6. */
function isPrivateIp(ip: string): boolean {
  // v4-mapped v6 arrives dotted (::ffff:10.0.0.1) or, after URL parsing,
  // as hex groups (::ffff:a00:1) — normalise both to dotted v4.
  const dotted = ip.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
  const hexed = ip.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i);
  let v4: string | null = dotted ? dotted[1] : isIP(ip) === 4 ? ip : null;
  if (!v4 && hexed) {
    const hi = parseInt(hexed[1], 16);
    const lo = parseInt(hexed[2], 16);
    v4 = `${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`;
  }
  if (v4) {
    const [a, b] = v4.split(".").map(Number);
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true; // link-local / cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a >= 224) return true; // multicast + reserved
    return false;
  }
  const l = ip.toLowerCase();
  if (l === "::" || l === "::1") return true;
  if (/^f[cd]/.test(l)) return true; // fc00::/7 unique-local
  if (/^fe[89ab]/.test(l)) return true; // fe80::/10 link-local
  if (l.startsWith("ff")) return true; // multicast
  return false;
}

/** DNS-resolve the host and require EVERY address to be public. Stops a public
 *  hostname that points at 127.0.0.1 / 169.254.169.254 (DNS rebinding) from
 *  slipping past the hostname check. */
async function resolvesToPublicIp(hostname: string): Promise<boolean> {
  const host = hostname.replace(/^\[|\]$/g, "");
  if (isIP(host)) return !isPrivateIp(host);
  try {
    const addrs = await dns.lookup(host, { all: true, verbatim: true });
    return addrs.length > 0 && addrs.every((a) => !isPrivateIp(a.address));
  } catch {
    return false;
  }
}

// Landing pages are read for text only — never pull more than this.
const MAX_LANDING_BYTES = 1_000_000;

/** Read at most `limit` bytes of a response body as text. */
async function readCapped(res: Response, limit: number): Promise<string> {
  if (!res.body) return "";
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < limit) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.byteLength;
  }
  reader.cancel().catch(() => {});
  return Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf8", 0, limit);
}

const UA = "LaunchMapBot/0.1 (+https://zerofans.org)";
// Below this many characters of body text the landing is "thin" and we look
// for more pages on the same site.
const THIN_TEXT_CHARS = 1200;
const MAX_EXTRA_PAGES = 4;
const MAX_TOTAL_CHARS = 9000;
// Paths that usually describe the product when the home page doesn't.
const INTERESTING_PATH =
  /(about|pricing|price|features?|product|docs?|documentation|how|why|faq|start|use-?cases?|solutions?|tour|demo)/i;

export interface LandingContent {
  /** Meta (title/description/og) + stripped body text, capped. */
  text: string;
  /** How many pages were read (1 = just the landing). */
  pagesFetched: number;
}

/** Fetch one URL with the SSRF guard on every redirect hop. Returns the final
 *  HTML (capped) or "" on any failure. */
async function fetchHtml(url: string, timeoutMs: number, cap: number): Promise<string> {
  try {
    let current = url;
    let res: Response | null = null;
    for (let hop = 0; hop < 5; hop++) {
      if (!isSafePublicUrl(current)) return "";
      if (!(await resolvesToPublicIp(new URL(current).hostname))) return "";
      res = await fetch(current, {
        headers: { "user-agent": UA, accept: "text/html,*/*;q=0.5" },
        signal: AbortSignal.timeout(timeoutMs),
        redirect: "manual",
      });
      // 3xx with a Location → re-validate the next hop before following it.
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get("location");
        if (!loc) break;
        current = new URL(loc, current).toString();
        continue;
      }
      break;
    }
    if (!res || !res.ok) return "";
    const type = res.headers.get("content-type") ?? "";
    if (type && !/html|xml|text\/plain/i.test(type)) return "";
    return await readCapped(res, cap);
  } catch {
    return "";
  }
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

/** Strip HTML to whitespace-normalised text. */
function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
  ).trim();
}

/** Title, meta description, OpenGraph/Twitter descriptions and JSON-LD
 *  descriptions — often the only real product copy on a JS-rendered page. */
function extractMeta(html: string): string {
  const head = html.slice(0, 200_000);
  const out: string[] = [];
  const title = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  if (title) out.push(`Title: ${htmlToText(title)}`);
  const metaRe = /<meta\s+[^>]*>/gi;
  let m: RegExpExecArray | null;
  const seen = new Set<string>();
  while ((m = metaRe.exec(head))) {
    const tag = m[0];
    const key = (tag.match(/(?:name|property)\s*=\s*["']([^"']+)["']/i)?.[1] ?? "").toLowerCase();
    if (!/^(description|og:title|og:description|twitter:description|twitter:title|keywords|application-name)$/.test(key)) continue;
    const content = tag.match(/content\s*=\s*["']([^"']*)["']/i)?.[1];
    if (!content) continue;
    const val = htmlToText(content);
    if (val && !seen.has(val)) {
      seen.add(val);
      out.push(`${key}: ${val}`);
    }
  }
  const ldRe = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  while ((m = ldRe.exec(head))) {
    const descs = m[1].match(/"description"\s*:\s*"([^"]{10,400})"/g) ?? [];
    for (const d of descs.slice(0, 2)) {
      const val = d.replace(/^"description"\s*:\s*"/, "").replace(/"$/, "");
      if (!seen.has(val)) {
        seen.add(val);
        out.push(`ld: ${val}`);
      }
    }
  }
  return out.join("\n").slice(0, 1500);
}

/** Same-origin links from the landing that look like product pages. */
function candidateLinks(html: string, base: URL): string[] {
  const hrefRe = /<a\s+[^>]*href\s*=\s*["']([^"'#?]+)[^"']*["']/gi;
  const found = new Map<string, number>();
  let m: RegExpExecArray | null;
  while ((m = hrefRe.exec(html))) {
    let u: URL;
    try {
      u = new URL(m[1], base);
    } catch {
      continue;
    }
    if (u.origin !== base.origin) continue;
    if (u.pathname === base.pathname || u.pathname === "/") continue;
    if (/\.(png|jpe?g|gif|svg|webp|pdf|zip|css|js|ico|mp4|woff2?)$/i.test(u.pathname)) continue;
    const key = u.origin + u.pathname.replace(/\/$/, "");
    if (found.has(key)) continue;
    // Prefer descriptive paths; keep others as low-priority fallbacks.
    found.set(key, INTERESTING_PATH.test(u.pathname) ? 0 : 1);
  }
  return Array.from(found.entries())
    .sort((a, b) => a[1] - b[1])
    .map(([k]) => k)
    .slice(0, MAX_EXTRA_PAGES);
}

/**
 * Read the landing page for analysis. Always returns meta + body text of the
 * landing itself; when the body is thin, also reads up to MAX_EXTRA_PAGES
 * same-origin pages (about / pricing / docs …) in parallel so a JS-only or
 * one-liner home page still yields something to analyze.
 */
export async function fetchLandingContent(url: string): Promise<LandingContent> {
  const html = await fetchHtml(url, 8000, MAX_LANDING_BYTES);
  if (!html) return { text: "", pagesFetched: 0 };

  const meta = extractMeta(html);
  let body = htmlToText(html);
  let pages = 1;

  if (body.length < THIN_TEXT_CHARS) {
    let base: URL | null = null;
    try {
      base = new URL(url);
    } catch {
      base = null;
    }
    const links = base ? candidateLinks(html, base) : [];
    if (links.length > 0) {
      const extra = await Promise.all(
        links.map((l) => fetchHtml(l, 4000, 300_000))
      );
      for (let i = 0; i < extra.length; i++) {
        const t = htmlToText(extra[i]);
        if (t.length < 80) continue;
        pages++;
        body += `\n\n[${new URL(links[i]).pathname}] ${t.slice(0, 2500)}`;
        if (body.length >= MAX_TOTAL_CHARS) break;
      }
    }
  }

  const text = [meta, body].filter(Boolean).join("\n\n").slice(0, MAX_TOTAL_CHARS);
  return { text, pagesFetched: pages };
}
