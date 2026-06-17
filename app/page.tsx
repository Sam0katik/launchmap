import Link from "next/link";
import { UrlForm } from "@/components/UrlForm";
import { PixelField } from "@/components/PixelField";
import { EyeMascot } from "@/components/EyeMascot";
import { AuthButton } from "@/components/AuthButton";

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="tracking-wide transition-colors hover:text-primary">
      {children}
    </Link>
  );
}

export default function Home() {
  return (
    <>
      <PixelField />
      <main className="relative z-10 mx-auto flex min-h-screen max-w-content flex-col px-6">
        {/* LAUNCHMAP + Sign in kept close together, top-left */}
        <nav className="flex h-16 items-center gap-4">
          <span className="wordmark text-xl text-ink">LAUNCHMAP</span>
          <AuthButton />
        </nav>

        <section className="flex flex-1 flex-col items-center justify-center py-10">
          {/* Floating panel so the content never blends into the pixel field */}
          <div className="panel flex w-full max-w-sm flex-col items-center px-7 py-9 text-center">
            <div className="mascot-bob mb-6">
              <EyeMascot size={150} />
            </div>

            <h1 className="display-xl mb-4 text-ink">
              Paste URL.
              <br />
              Make first users.
            </h1>

            <p className="pretty mb-7 max-w-[15rem] text-[11px] leading-relaxed text-ink-muted">
              Ranked communities to post in — rules, karma, best time, and a
              ready submit link.
            </p>

            <UrlForm />
          </div>
        </section>

        <footer className="flex h-14 items-center justify-center gap-5 text-[10px] text-ink-subtle">
          <FooterLink href="/communities">COMMUNITIES</FooterLink>
          <FooterLink href="/privacy">PRIVACY</FooterLink>
          <FooterLink href="/contact">CONTACT</FooterLink>
        </footer>
      </main>
    </>
  );
}
