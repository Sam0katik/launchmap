import { VectorSketch } from "@/components/VectorSketch";
import { SiteNav } from "@/components/SiteNav";
import { LegalNav } from "@/components/LegalNav";

const CONTACT = {
  email: "1awqfes@gmail.com",
  telegram: { handle: "@rasfikus", url: "https://t.me/rasfikus" },
};

export const metadata = { title: "Contact — ZeroFans" };

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
              <span>ZeroFans Labs</span>
            </div>
            <div className="receipt-rule mb-5" />
            <h1 className="pixel text-ink" style={{ fontSize: "clamp(26px,3.4vw,38px)" }}>
              Get in touch
            </h1>
            <p className="mt-3 text-sm text-ink-subtle">
              Questions, feedback, or a community to add? Reach out.
            </p>
          </header>

          <LegalNav active="contact" />

          <ul className="mt-8 space-y-4 text-sm text-ink-muted">
            <ContactRow label="Email">
              <a className="text-primary hover:underline" href={`mailto:${CONTACT.email}`}>
                {CONTACT.email}
              </a>
            </ContactRow>

            <ContactRow label="Telegram">
              <a
                className="text-primary hover:underline"
                href={CONTACT.telegram.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {CONTACT.telegram.handle}
              </a>
            </ContactRow>
          </ul>
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
