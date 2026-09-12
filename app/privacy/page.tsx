import Link from "next/link";
import { VectorSketch } from "@/components/VectorSketch";
import { SiteNav } from "@/components/SiteNav";
import { LegalNav } from "@/components/LegalNav";

export const metadata = {
  title: "Privacy & data handling — ZeroFans",
};

// Plain-language privacy + data-handling page. Still an MVP policy (not legal
// advice), but it now states concretely what's collected, who it's shared with,
// how long it's kept, and how to delete it — enough to put real payment and
// account flows behind.
export default function Privacy() {
  return (
    <>
      <VectorSketch variant="alt" />
      <div className="relative z-10 flex min-h-screen flex-col">
        <SiteNav />

        <main className="mx-auto w-full max-w-2xl px-6 pb-20 pt-4">
          <header className="panel mb-10 px-8 pb-7 pt-6">
            <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-widest text-ink-subtle">
              <span>Privacy &amp; data handling</span>
              <span>ZeroFans Labs</span>
            </div>
            <div className="receipt-rule mb-5" />
            <h1 className="pixel text-ink" style={{ fontSize: "clamp(26px,3.4vw,38px)" }}>
              What we store, and why
            </h1>
            <p className="mt-3 text-xs text-ink-subtle">
              Last updated 12 September 2026
            </p>
          </header>

          <LegalNav active="privacy" />

          <div className="mt-8 space-y-9 text-sm leading-relaxed text-ink-muted">
            <Section title="What we collect">
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  Your GitHub account identifier, username, and avatar — for
                  sign-in and per-account limits.
                </li>
                <li>
                  The product URLs and optional descriptions you submit — to
                  build and cache your launch maps.
                </li>
                <li>
                  The generated maps (matched communities, scores, posting
                  briefs) and any saved thread searches, tied to your account.
                </li>
                <li>
                  Reddit usernames you choose to check, and the public karma /
                  account-age figures returned for them.
                </li>
                <li>
                  Your balance and a record of each balance movement (top-ups and
                  what you spent credit on) — needed for billing and refunds.
                </li>
              </ul>
              <p className="mt-3">
                We do not collect payment card data, location, or any tracking
                beyond what&apos;s needed to run the product.
              </p>
            </Section>

            <Section title="How your data is processed">
              <p>
                When you submit a URL we fetch the public landing page and send
                its text to Anthropic&apos;s API to extract a product summary and
                tags. That output is matched against our curated community
                catalog and the result is saved to your account so re-opening a
                map doesn&apos;t re-run the analysis.
              </p>
              <p className="mt-3">
                Identical URLs are cached for a short window to avoid duplicate
                processing. We never auto-post anywhere — every submission to a
                community is made manually by you.
              </p>
            </Section>

            <Section title="Who we share it with (sub-processors)">
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  <strong className="text-ink">Supabase</strong> — database,
                  authentication, and hosting of your account and maps.
                </li>
                <li>
                  <strong className="text-ink">Anthropic</strong> — landing-page
                  analysis. Submitted URL text is sent to their API to extract a
                  product summary and tags.
                </li>
                <li>
                  <strong className="text-ink">GitHub</strong> — OAuth sign-in
                  identity only.
                </li>
                <li>
                  <strong className="text-ink">Vercel</strong> — hosting; it
                  processes the requests to this site and keeps short-lived
                  server logs.
                </li>
                <li>
                  <strong className="text-ink">Apify</strong> — the service that
                  fetches public Reddit data for the live-thread search and the
                  Reddit account check. A username you ask us to check is sent to
                  them for that lookup.
                </li>
                <li>
                  <strong className="text-ink">Telegram</strong> — we send
                  ourselves operational alerts (a new sign-up, a new map, a
                  purchase). These contain your GitHub username, the email your
                  GitHub account exposes, your account id and the product URL —
                  they go to a private chat owned by the operator, and nowhere
                  else.
                </li>
                <li>
                  <strong className="text-ink">Platega</strong> (platega.io) —
                  payment provider for balance top-ups; the payment is made on
                  their hosted page and we never see or store your card or
                  wallet details, only a confirmation that a top-up succeeded.
                </li>
              </ul>
              <p className="mt-3">We do not sell your data.</p>
            </Section>

            <Section title="Cookies">
              <p>
                We use a single essential cookie: the Supabase session that keeps
                you signed in. It is strictly necessary for the site to work, so
                no consent banner is required. We set no advertising, analytics,
                or cross-site tracking cookies.
              </p>
            </Section>

            <Section title="Payments">
              <p>
                We keep a small internal USD balance on your account. You top it
                up through our payment provider&apos;s (Platega) hosted checkout
                — the payment happens entirely on their page, and we receive
                only an authenticated confirmation that a top-up succeeded,
                which we re-verify with the provider before crediting. Unlocking a full map then spends $2 from that balance.
              </p>
              <p className="mt-3">
                We store only your balance and a paid/unpaid flag per map. We
                never receive or store card numbers, wallet keys, or transaction
                details beyond the processor&apos;s confirmation.
              </p>
            </Section>

            <Section title="Retention & your rights">
              <p>
                Your maps stay until you delete them or your account. You can
                permanently delete your account — and every saved map — at any
                time from your{" "}
                <Link href="/profile" className="text-primary hover:underline">
                  profile page
                </Link>
                . Deletion is immediate and irreversible.
              </p>
              <p className="mt-3">
                Two things outlive deletion, because we are legally required to
                keep billing records: rows describing your payments and balance
                movements. They keep the amounts and dates, and the link to your
                account is severed when the account is deleted.
              </p>
              <p className="mt-3">
                For data questions or export requests, contact us via the{" "}
                <Link href="/contact" className="text-primary hover:underline">
                  contact page
                </Link>
                .
              </p>
            </Section>
          </div>
        </main>
      </div>
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="eyebrow mb-3 text-ink">{title}</h2>
      {children}
    </section>
  );
}
