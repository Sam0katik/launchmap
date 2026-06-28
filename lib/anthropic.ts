import Anthropic from "@anthropic-ai/sdk";
import type { ProductAnalysis } from "./types";

// Landing analysis only (Haiku 4.5 — fractions of a cent per run). We no longer
// generate post drafts: each community ships a rules-derived posting brief
// (see lib/posting-brief.ts) so users write their own compliant post.
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL_ANALYZE =
  process.env.ANTHROPIC_MODEL_ANALYZE || "claude-haiku-4-5-20251001";

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
