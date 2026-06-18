import Link from "next/link";
import { UrlForm } from "@/components/UrlForm";
import { InteractivePixels } from "@/components/InteractivePixels";
import { Lighthouse } from "@/components/Lighthouse";
import { AuthButton } from "@/components/AuthButton";

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="tracking-wide transition-colors hover:text-ink">
      {children}
    </Link>
  );
}

function Wordmark() {
  return (
    <span className="wordmark text-2xl text-ink">
      BEACON
      <span className="blink ml-0.5">▮</span>
    </span>
  );
}

export default function Home() {
  return (
    <>
      <InteractivePixels />
      {/* rotating lighthouse beam sweeping the whole page */}
      <div className="beam" aria-hidden="true" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <main className="flex flex-1 items-center justify-center px-6">
          <div className="flex w-full max-w-md flex-col items-center">
            {/* brand + sign-in, lowered toward the card */}
            <div className="z-20 mb-3 flex w-full items-center justify-between px-1">
              <Wordmark />
              <AuthButton />
            </div>

            {/* card with the lighthouse rising from behind it */}
            <div className="relative mt-12 w-full">
              <div className="pointer-events-none absolute left-1/2 top-0 z-0 -translate-x-1/2 -translate-y-[78%]">
                <Lighthouse size={92} />
              </div>

              <div className="panel relative z-10 flex w-full flex-col items-center px-9 pb-9 pt-11 text-center">
                <h1 className="display-xl mb-5 text-ink">
                  Paste URL
                  <br />
                  Make first users
                </h1>

                <p className="pretty mb-8 max-w-xs text-base leading-relaxed text-ink-muted">
                  Ranked communities to post in — rules, karma, best time, and a
                  ready submit link
                </p>

                <UrlForm />
              </div>
            </div>
          </div>
        </main>

        <footer className="border-t border-hairline bg-canvas">
          <div className="mx-auto flex h-14 max-w-content items-center justify-center gap-6 px-6 text-xs text-ink-subtle">
            <FooterLink href="/privacy">PRIVACY</FooterLink>
            <FooterLink href="/contact">CONTACT</FooterLink>
          </div>
        </footer>
      </div>
    </>
  );
}
