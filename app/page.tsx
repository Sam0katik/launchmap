import Link from "next/link";
import { UrlForm } from "@/components/UrlForm";
import { VectorSketch } from "@/components/VectorSketch";
import { ClippedNote } from "@/components/ClippedNote";
import { ScrambleText } from "@/components/ScrambleText";
import { AuthButton } from "@/components/AuthButton";

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="menu-link rounded-sm">
      {children}
    </Link>
  );
}

export default function Home() {
  return (
    <>
      <VectorSketch />

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* brand (click = reload) + sign-in in the corners */}
        <header className="flex h-20 items-center justify-between px-8">
          {/* plain <a> to "/" forces a full page refresh */}
          <a href="/" className="wordmark text-4xl text-ink hover:text-primary">
            <ScrambleText text="ZEROFANS" className="leading-none" />
          </a>
          <AuthButton />
        </header>

        <main className="flex flex-1 items-center justify-center px-6 py-16">
          <div className="relative">
            {/* receipt-style card */}
            <div className="panel w-full max-w-xl px-12 pb-10 pt-7 text-center">
              {/* receipt meta line */}
              <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-widest text-ink-subtle">
                <span>ZeroFans Labs</span>
                <span>No. 0207</span>
              </div>
              <div className="receipt-rule mb-8" />

              <h1 className="display-xl mb-9 text-ink">
                Light the way
                <br />
                to first users
              </h1>

              <UrlForm />

              {/* what you get — the offer in three lines */}
              <ul className="mx-auto mt-7 max-w-sm space-y-1.5 text-left text-sm text-ink-muted">
                <li className="flex gap-2">
                  <span className="text-primary">→</span>
                  Where to post without getting banned — per-sub rules &amp; briefs
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">→</span>
                  Is your Reddit account ready — karma &amp; age check
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">→</span>
                  Live threads in your niche to jump into today
                </li>
              </ul>
            </div>

            {/* beige note clipped to the card's top-right — the clip pinches
                both papers; the note slides out on hover */}
            <div className="absolute -right-32 -top-7 hidden xl:block">
              <ClippedNote />
            </div>
          </div>
        </main>

        <footer className="border-t-2 border-hairline-strong">
          <div className="mx-auto flex h-14 max-w-content items-center justify-center gap-6 px-6 text-base text-ink-subtle">
            <FooterLink href="/privacy">Privacy</FooterLink>
            <FooterLink href="/terms">Terms</FooterLink>
            <FooterLink href="/refunds">Refunds</FooterLink>
            <FooterLink href="/contact">Contact</FooterLink>
          </div>
        </footer>
      </div>
    </>
  );
}
