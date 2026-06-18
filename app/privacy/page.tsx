import Link from "next/link";

export default function Privacy() {
  return (
    <main className="relative z-10 mx-auto max-w-2xl px-6 py-12">
      <nav className="mb-10 flex h-12 items-center">
        <Link href="/" className="wordmark text-lg text-ink">
          BEACON
        </Link>
      </nav>
      <h1 className="display-lg mb-6 text-ink">Privacy</h1>
      <div className="readable space-y-4 text-sm leading-relaxed text-ink-muted">
        <p>
          LaunchMap stores only what it needs to run: your GitHub account
          identifier (for sign-in and run limits) and the product URLs you submit
          (to build and cache your launch maps).
        </p>
        <p>
          Submitted URLs are sent to Anthropic&apos;s API for analysis. We do not
          sell data. We never auto-post on your behalf — every submission to a
          community is made manually by you.
        </p>
        <p>
          Payments are handled by Lemon Squeezy (merchant of record); we never see
          your card details.
        </p>
        <p className="text-ink-tertiary">
          This is an MVP placeholder policy — replace with your finalized terms
          before public launch.
        </p>
      </div>
    </main>
  );
}
