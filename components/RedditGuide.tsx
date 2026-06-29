"use client";

import { useState } from "react";

// In-product playbook: how to set up a Reddit account, avoid bans, and build
// karma before promoting. Lives next to the community list so the rules and the
// account hygiene are in one place. Collapsible to keep the page scannable.
const SECTIONS: { title: string; points: string[] }[] = [
  {
    title: "Account setup (before you post)",
    points: [
      "Age the account 2–4 weeks before any promo post. Brand-new accounts that post their own link first almost always get shadowbanned (post visible to you, hidden from everyone).",
      "Build 50–100+ comment karma before posting in larger subs. Smaller, friendly subs (r/SideProject, r/IMadeThis, r/alphaandbetausers) tolerate less — but not zero.",
      "Verify your email — an unverified email is a strong spam-filter signal.",
      "Leave 10–20 genuine comments in your niche first. This 'warms up' the account and clears the new-user filter.",
      "One account = one person. Multiple accounts from one IP, self-voting, or 'please upvote' asks is ban-evasion / vote manipulation — banned hard, often by IP.",
    ],
  },
  {
    title: "The 90/10 rule (critical)",
    points: [
      "No more than ~10% of your activity should be about yourself. For every promo post, leave ~9 genuinely helpful comments.",
      "Subs and AutoModerator actually measure the share of self-promo domains in your history — it's not just etiquette.",
    ],
  },
  {
    title: "Before posting in a specific sub",
    points: [
      "Read the rules and pinned posts. Many subs only allow megathreads — see the policy column in the table below.",
      "Check for karma/age requirements in the rules or AutoModerator's auto-reply (it often says exactly why a post was hidden).",
      "Post at the sub's best time (see the table) for more reach and less chance of being treated as spam.",
      "Never use link shorteners (bit.ly etc.) — near-universal auto-removal. Use the direct URL.",
    ],
  },
  {
    title: "Building karma fast (and safely)",
    points: [
      "Comment value, not volume: answer questions in your niche where you actually know the answer.",
      "Post genuinely useful content (a lesson learned, a teardown, a free resource) in relevant subs — these earn karma and goodwill without tripping self-promo filters.",
      "Don't farm karma in meme/karma subs and then immediately pivot to promo — the pattern is obvious to mods.",
    ],
  },
  {
    title: "Spot a shadowban / recover from a ban",
    points: [
      "Open your post in an incognito window (logged out). If it's not visible, you're shadowbanned in that sub or globally.",
      "If banned in a sub, don't make a new account to evade — that's worse than the original ban.",
      "Message the mods (modmail) politely: admit the mistake, ask to repost in the correct format. They often un-ban.",
    ],
  },
];

export function RedditGuide() {
  const [open, setOpen] = useState(false);

  return (
    <section className="mb-8 overflow-hidden rounded-lg border-2 border-primary/50 bg-primary/5 shadow-[4px_5px_0_0_var(--color-hairline-strong)]">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="focus-ring flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">🛟</span>
          <div>
            <h2 className="text-base text-ink">
              How to not get banned &amp; build Reddit karma
            </h2>
            <p className="mt-0.5 text-xs text-ink-subtle">
              Account setup, the 90/10 rule, karma, shadowban checks
            </p>
          </div>
        </div>
        <span className="focus-ring btn-press shrink-0 rounded-md border-2 border-hairline-strong bg-primary px-3 py-1.5 text-xs font-medium text-white">
          {open ? "− Hide" : "+ Read"}
        </span>
      </button>

      {open && (
        <div className="grid gap-6 border-t-2 border-hairline-strong px-5 py-5 sm:grid-cols-2">
          {SECTIONS.map((s) => (
            <div key={s.title}>
              <h3 className="eyebrow mb-2 text-ink">{s.title}</h3>
              <ul className="space-y-1.5 text-sm text-ink-muted">
                {s.points.map((p, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-ink-tertiary">·</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="text-xs text-ink-tertiary sm:col-span-2">
            Drafts from ZeroFans are a starting point — always adapt them in your
            own words before posting. Verbatim AI posts get detected and
            downvoted.
          </p>
        </div>
      )}
    </section>
  );
}
