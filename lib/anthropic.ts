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
  const msg = await client.messages.create({
    model: MODEL_DRAFT,
    max_tokens: 800,
    system:
      "You write a launch post draft for a specific community. Follow the " +
      "community's stated rules and tone exactly. Write it as a genuine story, " +
      "not an ad. The draft is a STARTING POINT the user must adapt — " +
      "template posts get detected and banned.",
    messages: [
      {
        role: "user",
        content:
          `Product: ${analysis.product_summary}\n` +
          `URL: ${productUrl}\n` +
          `Audience: ${analysis.icp}\n\n` +
          `Community: ${community.name} (${community.platform})\n` +
          `Self-promo policy: ${community.self_promo_policy}` +
          (community.self_promo_note ? ` — ${community.self_promo_note}` : "") +
          `\n` +
          `Rules: ${community.rules_summary ?? "n/a"}\n\n` +
          `Return JSON: { "title": "...", "body": "..." }`,
      },
    ],
  });

  const text = msg.content.find((b) => b.type === "text");
  const raw = text && text.type === "text" ? text.text : "{}";
  const match = raw.match(/\{[\s\S]*\}/);
  const parsed = match ? JSON.parse(match[0]) : {};
  return {
    title: parsed.title ?? "",
    body: parsed.body ?? "",
  };
}
