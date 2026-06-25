// Shown on an unlocked map: a styled panel with the account setup + behavior
// rules that actually keep a launch from getting banned. The drafts are only
// half the job — this is the other half, surfaced right where the user is about
// to post. Static (no state) so it renders on the server.
const STEPS: { n: string; title: string; body: string }[] = [
  {
    n: "1",
    title: "Age the account",
    body: "Use an account that's at least 2–4 weeks old with a verified email. Brand-new accounts that post their own link first get shadowbanned.",
  },
  {
    n: "2",
    title: "Build 50–100+ comment karma",
    body: "Leave genuine comments in your niche for a few days first. This clears the new-user spam filter so your post is actually visible.",
  },
  {
    n: "3",
    title: "Keep the 90/10 ratio",
    body: "No more than ~10% of your activity about yourself. For every promo post, leave ~9 helpful comments. Subs measure this.",
  },
  {
    n: "4",
    title: "Match each sub's format",
    body: "Read the rules. If a sub is megathread- or comment-only (see each card), post there — not a standalone link. One direct link, no shorteners.",
  },
  {
    n: "5",
    title: "Adapt the draft, post at the best time",
    body: "Rewrite the draft in your own words (verbatim AI posts get detected), then post at the card's best time. Check visibility from an incognito window after.",
  },
];

export function AccountGuidePanel() {
  return (
    <section className="panel mb-10 px-8 pb-7 pt-6">
      <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-widest text-ink-subtle">
        <span>Before you post · don&apos;t get banned</span>
        <span>Account playbook</span>
      </div>
      <div className="receipt-rule mb-5" />
      <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {STEPS.map((s) => (
          <li key={s.n} className="flex gap-3">
            <span className="tnum mt-0.5 inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-sm border-2 border-hairline-strong text-xs text-ink">
              {s.n}
            </span>
            <div>
              <p className="text-sm text-ink">{s.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                {s.body}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
