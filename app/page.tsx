import Link from "next/link";
import { UrlForm } from "@/components/UrlForm";
import { PixelField } from "@/components/PixelField";
import { Mascot } from "@/components/Mascot";
import { AuthButton } from "@/components/AuthButton";

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="transition-colors hover:text-ink">
      {children}
    </Link>
  );
}

// Landing page. Compact central column over a shimmering pixel field.
// Linear dark canvas, Silkscreen pixel display, single lavender accent.
export default function Home() {
  return (
    <>
      <PixelField />
      <main className="relative z-10 mx-auto flex min-h-screen max-w-content flex-col px-6">
        <nav className="flex h-16 items-center justify-between px-1">
          <span className="wordmark text-xl text-ink">LAUNCHMAP</span>
          <AuthButton />
        </nav>

        <section className="flex flex-1 flex-col items-center justify-center py-10">
          {/* Compact card-tight hero column */}
          <div className="flex w-full max-w-sm flex-col items-center text-center">
            <div className="mascot-bob mb-6">
              <Mascot size={88} />
            </div>

            <h1 className="display-xl mb-4 text-ink">
              Paste URL.
              <br />
              Make first users.
            </h1>

            <p className="pretty mb-7 max-w-xs text-sm leading-relaxed text-ink-muted">
              Ranked communities to post in — with rules, karma, best time, and a
              ready submit link.
            </p>

            <UrlForm />
          </div>
        </section>

        <footer className="flex h-14 items-center justify-center gap-5 text-[11px] text-ink-subtle">
          <FooterLink href="/communities">Communities</FooterLink>
          <FooterLink href="/privacy">Privacy</FooterLink>
          <FooterLink href="/contact">Contact</FooterLink>
        </footer>
      </main>
    </>
  );
}
