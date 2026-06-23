import { VectorSketch } from "@/components/VectorSketch";
import { SiteNav } from "@/components/SiteNav";

// ─── REPLACE BEFORE LAUNCH ──────────────────────────────────────────────
// Swap these placeholders for the real contacts when the user provides them.
const CONTACT = {
  email: "hello@launchmap.app", // TODO: real support email
  twitter: { handle: "", url: "" }, // TODO: e.g. { handle: "@beacon", url: "https://x.com/beacon" }
  github: { label: "Sam0katik/launchmap", url: "https://github.com/Sam0katik/launchmap" },
};
// ────────────────────────────────────────────────────────────────────────

export const metadata = { title: "Contact — Beacon" };

export default function Contact() {
  return (
    <>
      <VectorSketch variant="alt" />
      <div className="relative z-10 flex min-h-screen flex-col">
        <SiteNav />

        <main className="mx-auto w-full max-w-2xl px-6 pb-20 pt-4">
          <header className="panel mb-10 px-8 pb-7 pt-6">
            <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-widest text-ink-subtle">
              <span>Contact</span>
              <span>Beacon Labs</span>
            </div>
            <div className="receipt-rule mb-5" />
            <h1 className="pixel text-ink" style={{ fontSize: "clamp(26px,3.4vw,38px)" }}>
              Get in touch
            </h1>
            <p className="mt-3 text-sm text-ink-subtle">
              Questions, feedback, or a community to add? Reach out.
            </p>
          </header>

          <ul className="space-y-4 text-sm text-ink-muted">
            <ContactRow label="Email">
              <a className="text-primary hover:underline" href={`mailto:${CONTACT.email}`}>
                {CONTACT.email}
              </a>
            </ContactRow>

            {CONTACT.twitter.url && (
              <ContactRow label="X / Twitter">
                <a
                  className="text-primary hover:underline"
                  href={CONTACT.twitter.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {CONTACT.twitter.handle}
                </a>
              </ContactRow>
            )}

            <ContactRow label="GitHub">
              <a
                className="text-primary hover:underline"
                href={CONTACT.github.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {CONTACT.github.label}
              </a>
            </ContactRow>
          </ul>

          <p className="mt-8 text-xs text-ink-tertiary">
            Placeholder contacts — your real channels go here once you send them.
          </p>
        </main>
      </div>
    </>
  );
}

function ContactRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center justify-between gap-4 rounded-md border-2 border-hairline-strong bg-surface-1 px-5 py-4 shadow-[3px_4px_0_0_var(--color-hairline-strong)]">
      <span className="eyebrow">{label}</span>
      <span>{children}</span>
    </li>
  );
}
