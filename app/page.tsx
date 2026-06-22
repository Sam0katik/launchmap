import Link from "next/link";
import { UrlForm } from "@/components/UrlForm";
import { PixelBg } from "@/components/PixelBg";
import { LighthouseIcon } from "@/components/LighthouseIcon";
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
      <PixelBg />

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* brand (click = reload) + sign-in in the corners */}
        <header className="flex h-20 items-center justify-between px-8">
          {/* plain <a> to "/" forces a full page refresh */}
          <a href="/" className="wordmark flex items-center gap-2.5 text-4xl text-ink hover:text-primary">
            <LighthouseIcon size={28} />
            BEACON
          </a>
          <AuthButton />
        </header>

        <main className="flex flex-1 items-center justify-center px-6 pb-12">
          <div className="panel w-full max-w-xl px-12 pb-14 pt-12 text-center">
            <h1 className="display-xl mb-6 text-ink">
              Light the way
              <br />
              to first users
            </h1>

            <p className="mx-auto mb-10 max-w-sm text-xl leading-snug text-ink-muted">
              Paste your URL. Get a ranked map of where to post for your first
              users.
            </p>

            <UrlForm />
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
