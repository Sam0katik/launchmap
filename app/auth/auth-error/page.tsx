import Link from "next/link";

export default function AuthError() {
  return (
    <main className="relative z-10 mx-auto flex min-h-screen max-w-content flex-col items-center justify-center px-6 text-center">
      <h1 className="display-lg mb-4 text-ink">Sign-in failed</h1>
      <p className="mb-6 text-sm text-ink-muted">
        Could not complete GitHub sign-in. Try again.
      </p>
      <Link
        href="/"
        className="focus-ring btn-press rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
      >
        Back home
      </Link>
    </main>
  );
}
