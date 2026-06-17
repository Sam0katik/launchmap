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
        <nav className="flex h-14 items-center justify-between">
          <span className="wordmark text-sm text-ink">LAUNCHMAP</span>
          <AuthButton />
        </nav>

        <section className="flex flex-1 flex-col items-center justify-center py-10">
          {/* Compact card-tight hero column */}
          <div className="flex w-full max-w-lg flex-col items-center text-center">
            <div className="mascot-bob mb-5">
              <Mascot size={80} />
            </div>

            <span className="eyebrow mb-4">first users · zero audience</span>

            <h1 className="display-xl mb-4 text-ink">
              Paste URL.
              <br />
              Get launch map.
            </h1>

            <p className="pretty mb-7 max-w-sm text-sm leading-relaxed text-ink-muted">
              Ranked list of where to post — each community&apos;s rules, karma
              bar, best time, one-click submit link, and a tailored draft.
              Launch without getting banned.
            </p>

            <UrlForm />

            <p className="mt-4 text-xs text-ink-tertiary">
              Free: top 4. Full map: one-time unlock.
            </p>
          </div>
        </section>

        <footer className="flex h-14 items-center justify-center text-xs text-ink-subtle">
          Built for the first-100-users problem.
        </footer>
      </main>
    </>
  );
}
