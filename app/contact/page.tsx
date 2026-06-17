import Link from "next/link";

export default function Contact() {
  return (
    <main className="relative z-10 mx-auto max-w-2xl px-6 py-12">
      <nav className="mb-10 flex h-12 items-center">
        <Link href="/" className="wordmark text-lg text-ink">
          LAUNCHMAP
        </Link>
      </nav>
      <h1 className="display-lg mb-6 text-ink">Contact</h1>
      <div className="space-y-4 text-sm leading-relaxed text-ink-muted">
        <p>Questions, feedback, or a community to add? Reach out:</p>
        <ul className="space-y-2">
          <li>
            Email:{" "}
            <a className="text-primary hover:underline" href="mailto:hello@launchmap.app">
              hello@launchmap.app
            </a>
          </li>
          <li>
            GitHub:{" "}
            <a
              className="text-primary hover:underline"
              href="https://github.com/Sam0katik/launchmap"
              target="_blank"
              rel="noopener noreferrer"
            >
              Sam0katik/launchmap
            </a>
          </li>
        </ul>
        <p className="text-ink-tertiary">
          Placeholder contact — swap in your real address before launch.
        </p>
      </div>
    </main>
  );
}
