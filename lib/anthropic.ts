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
          `  "niche_tags": ["3-5", "lowercase", "tags"]\n` +
          `}`,
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

  const msg = await client.messages.create({
    model: MODEL_DRAFT,
    max_tokens: 900,
    system:
      "You write ONE launch post draft for a specific community. The post must " +
      "obey that community's stated rules and match its culture exactly — a " +
      "draft that ignores the rules gets the user removed or banned, which is " +
      "the whole problem this product exists to prevent. Write a genuine, " +
      "specific, first-person story, never an ad or a generic template. " +
      "Output PLAIN TEXT only: no markdown, no asterisks, no bold, no headings.",
    messages: [
      {
        role: "user",
        content:
          `Write a post for ${community.name} (${community.platform}).\n\n` +
          `PRODUCT\n` +
          `- What it is: ${analysis.product_summary}\n` +
          `- Category: ${analysis.category}\n` +
          `- Audience: ${analysis.icp}\n` +
          `- URL: ${productUrl}\n\n` +
          `COMMUNITY RULES (follow exactly)\n` +
          `- Self-promo policy: ${community.self_promo_policy}` +
          (community.self_promo_note ? `\n- Note: ${community.self_promo_note}` : "") +
          (community.rules_summary ? `\n- Rules: ${community.rules_summary}` : "") +
          `\n\n` +
          `HOW THIS PLATFORM EXPECTS POSTS\n${platformGuide}\n\n` +
          `Make the post unmistakably about THIS product and audience — no ` +
          `interchangeable filler that could describe any tool. If the policy ` +
          `is megathread/comment-only, write it to fit that thread/comment, not ` +
          `a standalone ad.\n\n` +
          `Return ONLY JSON, plain text values, no markdown: ` +
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

/** Per-platform posting culture, injected into the draft prompt. */
function platformGuidance(platform: string): string {
  switch (platform) {
    case "reddit":
      return (
        "Reddit: casual, first-person, story-first. Open with context/why you " +
        "built it, what it does, the tech, and the SPECIFIC feedback you want. " +
        "No marketing voice, no superlatives. A bare link reads as spam."
      );
    case "hackernews":
      return (
        "Hacker News (Show HN): modest and technical, addressed to fellow " +
        "engineers. NO superlatives (best/fastest/first). Go deep on how it " +
        "works and the interesting technical decisions."
      );
    case "x":
      return "X: one tight hook, concrete and specific, conversational. Short.";
    case "discord":
      return "Discord: friendly and brief, like talking to peers in a channel.";
    default:
      return "Directory: a clear, concrete one-paragraph description of the value.";
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
