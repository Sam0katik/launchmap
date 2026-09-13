import Link from "next/link";
import { serverDict } from "@/lib/i18n-server";

export default function AuthError() {
  const { t } = serverDict();

  return (
    <main className="relative z-10 mx-auto flex min-h-screen max-w-content flex-col items-center justify-center px-6 text-center">
      <h1 className="display-lg mb-4 text-ink">{t.authError.title}</h1>
      <p className="mb-6 text-sm text-ink-muted">
        {t.authError.body}
      </p>
      <Link
        href="/"
        className="focus-ring btn-press rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
      >
        {t.authError.back}
      </Link>
    </main>
  );
}
