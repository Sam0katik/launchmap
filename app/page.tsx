import Link from "next/link";
import { UrlForm } from "@/components/UrlForm";
import { VectorSketch } from "@/components/VectorSketch";
import { ClippedNote } from "@/components/ClippedNote";
import { ScrambleText } from "@/components/ScrambleText";
import { AuthButton } from "@/components/AuthButton";

// TODO: replace with the real destination for the "scan to launch" barcode.
const SCAN_TO_LAUNCH_URL = "#";

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
            <ScrambleText text="BEACON" className="leading-none" />
          </a>
          <AuthButton />
        </header>

        <main className="flex flex-1 items-center justify-center px-6 py-16">
          <div className="relative">
            {/* receipt-style card */}
            <div className="panel w-full max-w-xl px-12 pb-10 pt-7 text-center">
              {/* receipt meta line */}
              <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-widest text-ink-subtle">
                <span>Beacon Labs</span>
                <span>No. 0207</span>
              </div>
              <div className="receipt-rule mb-8" />

              <h1 className="display-xl mb-9 text-ink">
                Light the way
                <br />
                to first users
              </h1>

              <UrlForm />

              {/* receipt footer: barcode is a link (scan to launch) */}
              <div className="receipt-rule mb-5 mt-9" />
              <a
                href={SCAN_TO_LAUNCH_URL}
                className="block cursor-pointer transition-opacity hover:opacity-70"
                aria-label="Scan to launch"
              >
                <div className="barcode mx-auto w-3/4" />
                <p className="mt-3 text-xs uppercase tracking-[0.3em] text-ink-subtle">
                  * scan to launch *
                </p>
              </a>
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
            <FooterLink href="/contact">Contact</FooterLink>
          </div>
        </footer>
      </div>
    </>
  );
}
