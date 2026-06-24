import Link from "next/link";
import { VectorSketch } from "@/components/VectorSketch";
import { SiteNav } from "@/components/SiteNav";
import { LegalNav } from "@/components/LegalNav";

export const metadata = { title: "Refund & Cancellation Policy — ZeroFans" };

// Refund & Cancellation policy. Payment providers / merchants of record require
// a clear, honest refund policy for digital goods before approving payments.
export default function Refunds() {
  return (
    <>
      <VectorSketch variant="alt" />
      <div className="relative z-10 flex min-h-screen flex-col">
        <SiteNav />
        <main className="mx-auto w-full max-w-2xl px-6 pb-20 pt-4">
          <header className="panel mb-8 px-8 pb-7 pt-6">
            <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-widest text-ink-subtle">
              <span>Refund &amp; Cancellation</span>
              <span>ZeroFans Labs</span>
            </div>
            <div className="receipt-rule mb-5" />
            <h1 className="pixel text-ink" style={{ fontSize: "clamp(26px,3.4vw,38px)" }}>
              Refund &amp; cancellation
            </h1>
          </header>

          <LegalNav active="refunds" />

          <div className="mt-8 space-y-9 text-sm leading-relaxed text-ink-muted">
            <Section title="Digital goods">
              <p>
                ZeroFans sells digital access (map unlocks and/or a Pro plan).
                Because access and AI generation are delivered immediately, sales
                are generally final once the purchased feature has been used.
              </p>
            </Section>

            <Section title="When we refund">
              <ul className="list-disc space-y-1.5 pl-5">
                <li>You were charged twice for the same purchase.</li>
                <li>
                  The feature you paid for did not unlock and we could not fix it.
                </li>
                <li>You were charged in error / for something you did not buy.</li>
              </ul>
              <p className="mt-3">
                Requests within 14 days of purchase, where the purchased feature
                was not meaningfully used, are reviewed case by case and usually
                approved.
              </p>
            </Section>

            <Section title="Cancellation">
              <p>
                If a recurring Pro plan is offered, you can cancel anytime; access
                continues until the end of the paid period and is not prorated.
                One-time map unlocks are not recurring and require no cancellation.
              </p>
            </Section>

            <Section title="How to request">
              <p>
                Email{" "}
                <a href="mailto:1awqfes@gmail.com" className="text-primary hover:underline">
                  1awqfes@gmail.com
                </a>{" "}
                or reach us on{" "}
                <Link href="/contact" className="text-primary hover:underline">
                  Telegram
                </Link>{" "}
                with your purchase details. We respond within a few business days.
                Approved refunds return to your original payment method via our
                payment provider.
              </p>
            </Section>
          </div>
        </main>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="eyebrow mb-3 text-ink">{title}</h2>
      {children}
    </section>
  );
}
