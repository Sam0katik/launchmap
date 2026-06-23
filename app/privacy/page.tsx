import Link from "next/link";
import { VectorSketch } from "@/components/VectorSketch";
import { SiteNav } from "@/components/SiteNav";

export const metadata = {
  title: "Privacy & data handling — Beacon",
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
              <span>Beacon Labs</span>
            </div>
            <div className="receipt-rule mb-5" />
            <h1 className="pixel text-ink" style={{ fontSize: "clamp(26px,3.4vw,38px)" }}>
              What we store, and why
            </h1>
            <p className="mt-3 text-sm text-ink-subtle">
              Last updated {new Date().toLocaleDateString()}. MVP policy — replace
              with finalized terms before public launch.
            </p>
          </header>

          <div className="space-y-9 text-sm leading-relaxed text-ink-muted">
            <Section title="What we collect">
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  Your GitHub account identifier, username, and avatar — for
                  sign-in and per-day run limits.
                </li>
                <li>
                  The product URLs and optional descriptions you submit — to
                  build and cache your launch maps.
                </li>
                <li>
                  The generated maps (matched communities, scores, drafts) tied
                  to your account.
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
                  analysis and draft generation. Submitted text is sent to their
                  API.
                </li>
                <li>
                  <strong className="text-ink">GitHub</strong> — OAuth sign-in
                  identity only.
                </li>
                <li>
                  <strong className="text-ink">Lemon Squeezy</strong> — merchant
                  of record for payments. They handle checkout and card data; we
                  never see your card details.
                </li>
              </ul>
              <p className="mt-3">We do not sell your data.</p>
            </Section>

            <Section title="Payments">
              <p>
                Unlocking a full map is a one-time purchase processed entirely by
                Lemon Squeezy. We receive only a confirmation (which map was
                paid for) via a signature-verified webhook, and we store nothing
                more than a paid/unpaid flag on that map.
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
