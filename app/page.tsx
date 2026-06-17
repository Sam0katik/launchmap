import { UrlForm } from "@/components/UrlForm";
import { PixelField } from "@/components/PixelField";
import { Mascot } from "@/components/Mascot";
import { AuthButton } from "@/components/AuthButton";

// Landing page. Compact central column over a shimmering pixel field.
// Linear dark canvas, Silkscreen pixel display, single lavender accent.
export default function Home() {
  return (
    <>
      <PixelField />
      <main className="relative z-10 mx-auto flex min-h-screen max-w-content flex-col px-6">
        <nav className="flex h-14 items-center justify-between px-2">
          <AuthButton />
          <span className="wordmark text-sm text-ink">LAUNCHMAP</span>
        </nav>

        <section className="flex flex-1 flex-col items-center justify-center py-10">
          {/* Compact card-tight hero column */}
          <div className="flex w-full max-w-sm flex-col items-center text-center">
            <div className="mascot-bob mb-5">
              <Mascot size={84} />
            </div>

            <span className="eyebrow mb-4">first users · zero audience</span>

            <h1 className="display-xl mb-4 text-ink">
              Paste URL.
              <br />
              Get launch map.
            </h1>

            <p className="pretty mb-7 max-w-xs text-sm leading-relaxed text-ink-muted">
              Where to post for first users — rules, karma bar, best time,
              one-click submit link, and a draft. Launch without getting banned.
            </p>

            <UrlForm />
          </div>
        </section>

        <footer className="flex h-14 items-center justify-center text-xs text-ink-subtle">
          Built for the first-100-users problem.
        </footer>
      </main>
    </>
  );
}
