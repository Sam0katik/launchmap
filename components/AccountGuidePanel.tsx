import Link from "next/link";
import { KARMA_CHECK_PRICE_LABEL } from "@/lib/billing";
import { serverDict } from "@/lib/i18n-server";
import { fill } from "@/lib/i18n";

// Shown on an unlocked map: a styled panel with the account setup + behavior
// rules that actually keep a launch from getting banned. The drafts are only
// half the job — this is the other half, surfaced right where the user is about
// to post. Static (no state) so it renders on the server.
export function AccountGuidePanel() {
  const { t } = serverDict();
  const steps = [
    {
      n: "1",
      title: t.guide.step1Title,
      body: t.guide.step1Body,
      href: "/profile#reddit-check",
      cta: fill(t.guide.karmaCta, { price: KARMA_CHECK_PRICE_LABEL }),
    },
    { n: "2", title: t.guide.step2Title, body: t.guide.step2Body },
    { n: "3", title: t.guide.step3Title, body: t.guide.step3Body },
    { n: "4", title: t.guide.step4Title, body: t.guide.step4Body },
    { n: "5", title: t.guide.step5Title, body: t.guide.step5Body },
  ] as { n: string; title: string; body: string; href?: string; cta?: string }[];

  return (
    <section className="panel mb-10 px-8 pb-7 pt-6">
      <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-widest text-ink-subtle">
        <span>{t.guide.eyebrowLeft}</span>
        <span>{t.guide.eyebrowRight}</span>
      </div>
      <div className="receipt-rule mb-5" />
      <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((s) => (
          <li key={s.n} className="flex gap-3">
            <span className="tnum mt-0.5 inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-sm border-2 border-hairline-strong text-xs text-ink">
              {s.n}
            </span>
            <div>
              <p className="text-sm text-ink">{s.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                {s.body}
              </p>
              {s.href && s.cta && (
                <Link
                  href={s.href}
                  className="menu-link mt-1.5 inline-block rounded-sm text-xs text-primary hover:underline"
                >
                  {s.cta} →
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
