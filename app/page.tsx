import Link from "next/link";
import { UrlForm } from "@/components/UrlForm";
import { PixelClusters } from "@/components/PixelClusters";
import { RadarMascot } from "@/components/RadarMascot";
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
      <PixelClusters />
      <div className="relative z-10 flex min-h-screen flex-col">
        <main className="mx-auto flex w-full max-w-content flex-1 flex-col px-6">
          {/* LAUNCHMAP left, Sign in pinned top-right */}
          <nav className="flex h-16 items-center justify-between">
            <span className="wordmark text-xl text-ink">LAUNCHMAP</span>
            <AuthButton />
          </nav>

          <section className="flex flex-1 flex-col items-center justify-center py-10">
            {/* Solid panel so the content never blends into the background */}
            <div className="panel flex w-full max-w-sm flex-col items-center px-7 pt-8 pb-6 text-center">
              <div className="mb-5">
                <RadarMascot size={132} />
              </div>

              <h1 className="display-xl mb-4 text-ink">
                Paste URL
                <br />
                Make first users
              </h1>

              <p className="pretty mb-7 max-w-[15rem] text-[11px] leading-relaxed text-ink-muted">
                Ranked communities to post in — rules, karma, best time, and a
                ready submit link
              </p>

              <UrlForm />
            </div>
          </section>
        </main>

        {/* Solid footer bar so it never blends with the background */}
        <footer className="border-t border-hairline bg-canvas">
          <div className="mx-auto flex h-14 max-w-content items-center justify-center gap-5 px-6 text-[10px] text-ink-muted">
            <FooterLink href="/communities">COMMUNITIES</FooterLink>
            <FooterLink href="/privacy">PRIVACY</FooterLink>
            <FooterLink href="/contact">CONTACT</FooterLink>
          </div>
        </footer>
      </div>
    </>
  );
}
