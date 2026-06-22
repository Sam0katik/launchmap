import Link from "next/link";
import { UrlForm } from "@/components/UrlForm";
import { PixelBg } from "@/components/PixelBg";
import { VectorSketch } from "@/components/VectorSketch";
import { ClippedNote } from "@/components/ClippedNote";
import { LighthouseIcon } from "@/components/LighthouseIcon";
import { ScrambleText } from "@/components/ScrambleText";
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
      <VectorSketch />
      <PixelBg />

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* brand (click = reload) + sign-in in the corners */}
        <header className="flex h-20 items-center justify-between px-8">
          {/* plain <a> to "/" forces a full page refresh */}
          <a href="/" className="wordmark flex items-end gap-2.5 text-4xl text-ink hover:text-primary">
            <LighthouseIcon size={46} />
            <ScrambleText text="BEACON" className="leading-none" />
          </a>
          <AuthButton />
        </header>

        <main className="flex flex-1 items-center justify-center px-6 py-16">
          <div className="relative">
            <div className="panel w-full max-w-xl px-14 pb-14 pt-12 text-center">
              <h1 className="display-xl mb-9 text-ink">
                Light the way
                <br />
                to first users
              </h1>

              <UrlForm />
            </div>

            {/* description lives on a beige note clipped to the card corner */}
            <div className="absolute -right-32 -top-14 hidden lg:block">
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
