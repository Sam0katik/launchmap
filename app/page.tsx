import { UrlForm } from "@/components/UrlForm";

// Landing page. Linear-style: near-black canvas, lavender accent used scarcely,
// dense type with negative tracking, product framed in a surface-1 panel.
export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-content flex-col items-center px-6">
      <section className="flex w-full max-w-2xl flex-1 flex-col items-center justify-center py-24 text-center">
        <span className="eyebrow mb-5">For indie makers with zero audience</span>

        <h1 className="display-xl mb-5 text-ink">
          Paste your URL.
          <br />
          Get your launch map.
        </h1>

        <p className="mb-10 max-w-lg text-lg leading-relaxed text-ink-muted">
          A ranked list of where to post your product for first users — with each
          community&apos;s rules, karma requirements, best time, a one-click
          submit link, and a tailored draft. So you launch without getting
          banned.
        </p>

        <UrlForm />

        <p className="mt-6 text-sm text-ink-tertiary">
          Free: top 4 communities. Full map: one-time unlock.
        </p>
      </section>

      <footer className="w-full border-t border-hairline py-8 text-center text-xs text-ink-subtle">
        LaunchMap — built for the first-100-users problem.
      </footer>
    </main>
  );
}
