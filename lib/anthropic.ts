import Anthropic from "@anthropic-ai/sdk";
import type { Community, ProductAnalysis } from "./types";

// Two-model split per the spec:
//  - Haiku 4.5  → cheap landing analysis (fractions of a cent / run)
//  - Sonnet 4.6 → tailored post drafts (only for unlocked communities)
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL_ANALYZE =
  process.env.ANTHROPIC_MODEL_ANALYZE || "claude-haiku-4-5-20251001";
const MODEL_DRAFT =
  process.env.ANTHROPIC_MODEL_DRAFT || "claude-sonnet-4-6";

/**
 * Analyze landing-page text → product summary, category, ICP, niche tags.
 * `description` is the optional user-supplied one-liner (fallback when the
 * landing page is empty/unreachable).
 */
export async function analyzeProduct(
  landingText: string,
  description?: string
): Promise<ProductAnalysis> {
  const source = landingText.trim() || description?.trim() || "";

  const msg = await client.messages.create({
    model: MODEL_ANALYZE,
    max_tokens: 512,
    system:
      "You analyze a product's landing page and extract structured facts for " +
      "matching it to relevant launch communities. Respond ONLY with JSON.",
    messages: [
      {
        role: "user",
        content:
          `Product content:\n"""\n${source.slice(0, 6000)}\n"""\n\n` +
          (description ? `User note: ${description}\n\n` : "") +
          `Return JSON with exactly these keys:\n` +
          `{\n` +
          `  "product_summary": "one sentence on what it does",\n` +
          `  "category": "short product category",\n` +
          `  "icp": "ideal customer profile in one phrase",\n` +
          `  "niche_tags": ["5-8", "lowercase", "tags"]\n` +
          `}\n\n` +
          `Tag rules: order from MOST specific to most general. Prefer precise ` +
          `tags that describe THIS product (e.g. "nocode", "devtool", ` +
          `"opensource", "marketplace", "chrome-extension", "fintech") over ` +
          `generic ones like "saas" or "startup". Single words or hyphenated, ` +
          `no spaces. These tags decide which communities match, so be accurate, ` +
          `not broad.`,
      },
    ],
  });

  const text = msg.content.find((b) => b.type === "text");
  const raw = text && text.type === "text" ? text.text : "{}";
  return parseAnalysis(raw);
}

function parseAnalysis(raw: string): ProductAnalysis {
  // Strip code fences / prose around the JSON object.
  const match = raw.match(/\{[\s\S]*\}/);
  const parsed = match ? JSON.parse(match[0]) : {};
  return {
    product_summary: parsed.product_summary ?? "",
    category: parsed.category ?? "",
    icp: parsed.icp ?? "",
    niche_tags: Array.isArray(parsed.niche_tags)
      ? parsed.niche_tags.map((t: unknown) => String(t).toLowerCase())
      : [],
  };
}

/**
 * Generate a tailored post draft for ONE community. Community rules/tone are
 * passed as fact in the prompt — the model must not invent them from memory.
 * Lazy: call this only for unlocked communities, not the whole map.
 */
export async function generateDraft(
  analysis: ProductAnalysis,
  community: Community,
  productUrl: string
): Promise<{ title: string; body: string }> {
  const platformGuide = platformGuidance(community.platform);
  const tags = analysis.niche_tags.filter(Boolean).join(", ");

  const msg = await client.messages.create({
    model: MODEL_DRAFT,
    max_tokens: 700,
    // A touch of temperature so two products never get the same shaped post.
    temperature: 0.85,
    system:
      "You write ONE launch post draft for a specific online community, on " +
      "behalf of the indie maker who built the product. Your single most " +
      "important job is that this post does NOT get the user removed, " +
      "shadowbanned, or flagged as spam — that is the entire reason this tool " +
      "exists. To achieve that the post must: (1) obey the community's stated " +
      "self-promo rules exactly, (2) sound like a real human wrote it about " +
      "this specific product — never a template that could describe any tool, " +
      "(3) lead with substance (a problem, a story, or a concrete detail), not " +
      "a pitch, and mention the product/link only once and naturally, (4) be " +
      "SHORT. Long promotional walls of text are the #1 thing that gets " +
      "removed. Output PLAIN TEXT only: no markdown, asterisks, bold, headings, " +
      "or emoji.",
    messages: [
      {
        role: "user",
        content:
          `Write a post for ${community.name} (${community.platform}).\n\n` +
          `THIS SPECIFIC PRODUCT (make the post unmistakably about it)\n` +
          `- What it is: ${analysis.product_summary}\n` +
          `- Category: ${analysis.category}\n` +
          `- Who it's for: ${analysis.icp}\n` +
          (tags ? `- Specifics: ${tags}\n` : "") +
          `- URL: ${productUrl}\n\n` +
          `COMMUNITY RULES (follow exactly — breaking these = a ban)\n` +
          `- Self-promo policy: ${community.self_promo_policy}` +
          (community.self_promo_note ? `\n- Note: ${community.self_promo_note}` : "") +
          (community.rules_summary ? `\n- Rules: ${community.rules_summary}` : "") +
          `\n\n` +
          `HOW THIS PLATFORM EXPECTS POSTS\n${platformGuide}\n\n` +
          `HARD REQUIREMENTS\n` +
          `- Reference at least one concrete detail of THIS product (a real ` +
          `feature, the specific problem it solves, or who uses it). Zero ` +
          `interchangeable filler.\n` +
          `- Ask a genuine question or invite specific feedback at the end so ` +
          `it reads as a discussion starter, not an ad.\n` +
          `- No hype words (best, revolutionary, game-changer, ultimate, ` +
          `amazing, effortless). Plain, honest, slightly understated.\n` +
          `- If the policy is megathread_only or comment_only, write a short ` +
          `comment for that thread, NOT a standalone post, and set the title to ` +
          `the thread/comment context.\n\n` +
          `Return ONLY JSON, plain-text values, no markdown:\n` +
          `{ "title": "...", "body": "..." }`,
      },
    ],
  });

  const text = msg.content.find((b) => b.type === "text");
  const raw = text && text.type === "text" ? text.text : "{}";
  const match = raw.match(/\{[\s\S]*\}/);
  const parsed = match ? JSON.parse(match[0]) : {};
  return {
    title: stripMarkdown(parsed.title ?? ""),
    body: stripMarkdown(parsed.body ?? ""),
  };
}

/** Per-platform posting culture + length budget, injected into the draft
 *  prompt. Length caps matter most: over-long posts are the top trigger for
 *  spam removal, and they make the on-card draft unwieldy. */
function platformGuidance(platform: string): string {
  switch (platform) {
    case "reddit":
      return (
        "Reddit: casual, first-person, story-first. Open with the problem or " +
        "the reason you built it, then what it does in one or two plain " +
        "sentences, then the specific feedback you want. Keep the whole body " +
        "under ~120 words / 5 short paragraphs max — Reddit punishes long " +
        "self-promo. One link, in-line, not a bare link. Title: lowercase-ish, " +
        "specific, no clickbait, under ~12 words."
      );
    case "hackernews":
      return (
        "Hacker News (Show HN): modest and technical, to fellow engineers. NO " +
        "superlatives. 2–4 sentences on what it does and the one genuinely " +
        'interesting technical decision. Title must start with "Show HN: ". ' +
        "Keep the body under ~90 words."
      );
    case "x":
      return (
        "X: one tight hook, concrete and specific, conversational, under ~280 " +
        "characters total. Title = the tweet itself; keep body empty or a one-" +
        "line follow-up."
      );
    case "discord":
      return (
        "Discord: friendly and brief, like talking to peers in a channel. 2–3 " +
        "sentences, no pitch energy, under ~60 words."
      );
    default:
      return (
        "Directory: one concrete paragraph (under ~60 words) on the value and " +
        "who it's for. Title = the product's tagline, specific and plain."
      );
  }
}

/** Strip markdown so submit forms get clean plain text (asterisks etc. render
 * as literal characters on most submit pages). */
function stripMarkdown(s: string): string {
  return s
    .replace(/\*\*(.*?)\*\*/g, "$1") // bold
    .replace(/\*(.*?)\*/g, "$1") // italic
    .replace(/`(.*?)`/g, "$1") // inline code
    .replace(/^#{1,6}\s+/gm, "") // headings
    .replace(/^\s*[-*]\s+/gm, "• ") // bullets → plain bullet
    .trim();
}
