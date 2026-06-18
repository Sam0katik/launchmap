import Link from "next/link";
import { UrlForm } from "@/components/UrlForm";
import { Lighthouse } from "@/components/Lighthouse";
import { AuthButton } from "@/components/AuthButton";
import type { CSSProperties } from "react";

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="tracking-wide transition-colors hover:text-ink">
      {children}
    </Link>
  );
}

function Wordmark() {
  return (
    <span className="wordmark inline-flex items-center text-3xl text-ink">
      BEACON
      <span className="beacon-dot ml-2" />
    </span>
  );
}

export default function Home() {
  return (
    <>
      <div className="stars" aria-hidden="true" />
      {/* rotating beam emanating from the lighthouse lamp */}
      <div
        className="beam"
        aria-hidden="true"
        style={{ "--beam-y": "30%" } as CSSProperties}
      />

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* brand + sign-in pinned to the top corners */}
        <header className="flex h-20 items-center justify-between px-7">
          <Wordmark />
          <AuthButton />
        </header>

        <main className="flex flex-1 items-center justify-center px-6 pb-10">
          <div className="flex w-full max-w-md flex-col items-center">
            {/* tall lighthouse standing above the card */}
            <Lighthouse size={140} />

            {/* taller solid info card */}
            <div className="panel -mt-3 flex w-full flex-col items-center px-9 pb-11 pt-10 text-center">
              <h1 className="display-xl mb-5 text-ink">
                Light the way
                <br />
                to first users
              </h1>

              <p className="pretty mb-9 max-w-xs text-[15px] leading-relaxed text-ink-muted">
                Paste your product URL and get a ranked map of communities to
                post in — rules, karma, best time, and a ready submit link.
              </p>

              <UrlForm />
            </div>
          </div>
        </main>

        <footer className="border-t border-hairline bg-canvas">
          <div className="mx-auto flex h-14 max-w-content items-center justify-center gap-6 px-6 text-xs text-ink-subtle">
            <FooterLink href="/privacy">Privacy</FooterLink>
            <FooterLink href="/contact">Contact</FooterLink>
          </div>
        </footer>
      </div>
    </>
  );
}
