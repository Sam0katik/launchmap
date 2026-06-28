import type { Community } from "./types";

// Build a one-click "open the submit form pre-filled" link per platform.
//
// IMPORTANT (verified 2026-06): Reddit closed its unauthenticated .json API
// (403 since 2026-05-30), but the WEB submit form at /r/<sub>/submit still
// accepts ?title= and ?text= query params because it is plain client-side
// navigation, not an API call. The user lands on a pre-filled compose form
// and posts manually. No auto-posting, ever.
//
// ⚠️ Pre-launch checklist item #1: manually verify the live Reddit submit URL
// still pre-fills on both old and new Reddit before shipping the UI around it.

interface SubmitDraft {
  title: string;
  body: string;
}

/**
 * Returns a ready-to-open submit URL for a community, or null when the
 * platform has no deep-link submit flow (e.g. directories submitted via a form
 * we can't pre-fill, or Discord).
 *
 * `community.submit_template` may contain a template with {title}/{body}
 * placeholders; when present it wins over the platform default.
 */
export function buildSubmitLink(
  community: Community,
  draft: SubmitDraft
): string | null {
  const title = encodeURIComponent(draft.title);
  const body = encodeURIComponent(draft.body);

  if (community.submit_template) {
    return community.submit_template
      .replace("{title}", title)
      .replace("{body}", body)
      .replace("{text}", body);
  }

  switch (community.platform) {
    case "reddit": {
      // name stored as "r/SideProject" → strip the "r/" prefix.
      const sub = community.name.replace(/^r\//i, "").trim();
      return `https://www.reddit.com/r/${sub}/submit?title=${title}&text=${body}`;
    }
    case "hackernews":
      // HN's submit form only pre-fills the URL + title, not a text body.
      return `https://news.ycombinator.com/submitlink?t=${title}`;
    case "x":
      return `https://x.com/intent/tweet?text=${title}`;
    case "discord":
    case "directory":
    default:
      // No reliable pre-fill deep link — the card shows a plain "Open" link.
      return null;
  }
}

/**
 * An EMPTY submit/compose link — opens the community's posting surface with no
 * pre-filled text, so the user writes their own post (following the brief).
 * Returns null when there's no compose deep-link (Discord, most directories).
 */
export function bareSubmitLink(community: Community): string | null {
  switch (community.platform) {
    case "reddit": {
      const sub = community.name.replace(/^r\//i, "").trim();
      return `https://www.reddit.com/r/${sub}/submit`;
    }
    case "hackernews":
      return "https://news.ycombinator.com/submit";
    case "x":
      return "https://x.com/compose/tweet";
    default:
      return null;
  }
}
