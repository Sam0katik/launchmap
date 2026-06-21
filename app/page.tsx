import Link from "next/link";
import { UrlForm } from "@/components/UrlForm";
import { PixelBg } from "@/components/PixelBg";
import { Lighthouse } from "@/components/Lighthouse";
import { AuthButton } from "@/components/AuthButton";
import type { CSSProperties } from "react";

// Lamp sits ~20% down the viewport — the beam + glow originate there.
const beamVars = { "--beam-x": "50%", "--beam-y": "21%" } as CSSProperties;

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="tracking-wide transition-colors hover:text-ink">
      {children}
    </Link>
  );
}

export default function Home() {
  return (
    <>
      <PixelBg />
      <div className="beam" aria-hidden="true" style={beamVars} />
      <div className="lampglow" aria-hidden="true" style={beamVars} />

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* brand + sign-in in the top corners */}
        <header className="flex h-20 items-center justify-between px-7">
          <span className="wordmark text-3xl text-ink">BEACON</span>
          <AuthButton />
        </header>

        <main className="flex flex-1 items-center justify-center px-6 pb-10">
          <div className="flex w-full max-w-md flex-col items-center">
            {/* tall lighthouse standing above the card */}
            <Lighthouse size={132} />

            {/* tall solid info card; text given even vertical rhythm */}
            <div className="panel -mt-2 flex w-full flex-col items-center px-9 pb-12 pt-11 text-center">
              <span className="eyebrow mb-5">First users · Zero audience</span>

              <h1 className="display-xl mb-6 text-ink">
                Light the way
                <br />
                to first users
              </h1>

              <p className="mb-9 max-w-[18rem] text-lg leading-snug text-ink-muted">
                Paste your product URL. Get a ranked map of where to post —
                with each community&apos;s rules, karma, and best time.
              </p>

              <UrlForm />
            </div>
          </div>
        </main>

        <footer className="border-t border-hairline bg-canvas">
          <div className="mx-auto flex h-14 max-w-content items-center justify-center gap-6 px-6 text-sm text-ink-subtle">
            <FooterLink href="/privacy">Privacy</FooterLink>
            <FooterLink href="/contact">Contact</FooterLink>
          </div>
        </footer>
      </div>
    </>
  );
}
