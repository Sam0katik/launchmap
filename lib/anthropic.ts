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
      "You ghost-write ONE launch post for an indie maker, in their voice. The " +
      "post must NOT get them removed, shadowbanned, or flagged as spam — that " +
      "is the whole point. Rules: (1) obey the community's stated self-promo " +
      "policy exactly; (2) sound like a specific tired human who built one real " +
      "thing, not marketing copy; (3) lead with a concrete problem or moment, " +
      "mention the product and link ONCE, naturally; (4) be short.\n\n" +
      "Write the way real people write on these platforms: lowercase is fine, " +
      "small asides are fine, slightly unpolished is GOOD. Use concrete nouns " +
      "and one real detail. \n\n" +
      "NEVER do these AI tells (they get posts detected and downvoted): no " +
      "'I'm excited to share', no 'game-changer / revolutionary / seamless / " +
      "effortless / powerful / cutting-edge', no rhetorical-question openers " +
      "('Ever wished...?'), no tidy three-item lists of benefits, no em-dash " +
      "essay cadence, no emoji, no hashtags, no sign-off, no title-case " +
      "headlines. Output PLAIN TEXT only — no markdown.",
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
          `VOICE EXAMPLE (match the TONE, not the content — this is a different ` +
          `product):\n` +
          `"""\n` +
          `spent the last two months building a tiny tool because i kept losing ` +
          `track of which subreddits i'd already posted my side project in. it ` +
          `just keeps a checklist per launch and warns me about each sub's ` +
          `rules so i stop getting auto-removed. still rough but it's saved me ` +
          `a couple bans already. would love to know how you all keep your ` +
          `launches organized — spreadsheet? notion? something better?\n` +
          `"""\n\n` +
          `HARD REQUIREMENTS\n` +
          `- Tailor the angle and the opening line specifically to THIS ` +
          `community's audience and why THEY would care — do not reuse a ` +
          `one-size-fits-all hook. The version for this community should read ` +
          `differently from how you'd pitch the same product elsewhere.\n` +
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
        "Reddit — a forum post to strangers who owe you nothing.\n" +
        "Structure: (1) one line on the itch/problem or why you built it; (2) " +
        "one or two plain sentences on what it does, with the link in-line " +
        "once; (3) end with a specific question that invites discussion.\n" +
        "Voice: first person, lowercase ok, a little self-deprecating ('still " +
        "rough'). Title: specific, lowercase-ish, under ~12 words, no clickbait. " +
        "Body under ~110 words. A bare link or a pitch deck = instant removal."
      );
    case "hackernews":
      return (
        "Hacker News (Show HN) — an audience of engineers who smell marketing " +
        "instantly.\n" +
        "Structure: what it is in one sentence, then the ONE technically " +
        "interesting decision or constraint (stack, an algorithm, a tradeoff). " +
        "No benefits talk, no superlatives.\n" +
        'Title MUST start with "Show HN: ". Body under ~90 words.'
      );
    case "x":
      return (
        "X/Twitter — one scroll-stopping line, not a thread.\n" +
        "Concrete and specific, conversational, under ~280 characters total. " +
        "Title = the tweet itself; leave body empty or a single follow-up line. " +
        "No hashtags."
      );
    case "discord":
      return (
        "Discord — a casual message in a peers channel, NOT a post.\n" +
        "Structure: talk like you're dropping a line to people you know — 2–3 " +
        "short sentences, what you made + why, link once, then a light ask " +
        "('lmk what you think'). No headline energy, no formatting, no pitch. " +
        "Under ~55 words. The 'title' field should just be a short intro line."
      );
    default:
      return (
        "Directory listing — a scannable description, not a story.\n" +
        "One concrete paragraph (under ~55 words): what it is, who it's for, " +
        "the single clearest benefit. Title = a plain, specific tagline (no " +
        "hype words)."
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
