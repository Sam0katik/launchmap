"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Landing-page input: product URL (required) + optional one-line description.
// When the backend (Supabase) is configured it POSTs /api/analyze and routes to
// the real map. Until then it runs in DEMO MODE: validate the URL client-side
// and route to /demo so entering a URL actually shows something.
const BACKEND_READY = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

export function UrlForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Basic client-side validation (defense in depth; server validates too).
    try {
      const u = new URL(url);
      if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error();
    } catch {
      setError("Enter a valid http(s) URL.");
      return;
    }

    // Demo mode — no backend yet.
    if (!BACKEND_READY) {
      const qs = new URLSearchParams({ url });
      if (description) qs.set("note", description);
      router.push(`/demo?${qs.toString()}`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url, description: description || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(messageFor(data.error));
        return;
      }
      router.push(`/map/${data.runId}`);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "focus-ring w-full rounded-md border border-hairline bg-surface-1 px-4 py-3 text-base text-ink placeholder:text-xs placeholder:uppercase placeholder:tracking-wide placeholder:text-ink-tertiary";

  return (
    <form onSubmit={onSubmit} className="w-full">
      <div className="space-y-3">
        <input
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="product url"
          className={inputCls}
        />
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={280}
          placeholder="one line · optional"
          className={inputCls}
        />
      </div>

      {/* noticeable gap before the CTA */}
      <button
        type="submit"
        disabled={loading}
        className="focus-ring btn-press pixel mt-8 w-full rounded-md bg-primary px-5 py-4 text-lg tracking-wide text-canvas hover:bg-primary-hover disabled:opacity-60"
      >
        {loading ? "BUILDING…" : "LIGHT MY WAY"}
      </button>
      {error && <p className="readable mt-2 text-sm text-red-400">{error}</p>}
    </form>
  );
}

function messageFor(code: string): string {
  switch (code) {
    case "auth_required":
      return "Sign in with GitHub first.";
    case "rate_limited":
      return "Daily free limit reached. Come back tomorrow or upgrade.";
    case "invalid_input":
      return "Enter a valid URL.";
    default:
      return "Something went wrong. Try again.";
  }
}
