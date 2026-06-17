import { UrlForm } from "@/components/UrlForm";

// Landing page. Linear-style: near-black canvas, lavender accent used scarcely,
// dense type with negative tracking, product framed in a surface-1 panel.
export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-content flex-col px-6">
      <nav className="flex h-14 items-center">
        <span className="wordmark text-sm text-ink">LAUNCHMAP</span>
      </nav>

      <section className="flex w-full max-w-2xl flex-1 flex-col items-center justify-center self-center py-24 text-center">
        <span className="eyebrow mb-6">first users · zero audience</span>

        <h1 className="display-xl mb-6 text-ink">
          Paste URL.
          <br />
          Get launch map.
        </h1>

        <p className="pretty mb-10 max-w-md text-base leading-relaxed text-ink-muted">
          Ranked list of where to post your product — each community&apos;s
          rules, karma bar, best time, one-click submit link, and a tailored
          draft. Launch without getting banned.
        </p>

        <UrlForm />

        <p className="mt-6 text-sm text-ink-tertiary">
          Free: top 4. Full map: one-time unlock.
        </p>
      </section>

      <footer className="flex h-16 items-center justify-center border-t border-hairline text-xs text-ink-subtle">
        Built for the first-100-users problem.
      </footer>
    </main>
  );
}
