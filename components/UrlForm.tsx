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

  const DESC_MAX = 100;
  const inputCls =
    "focus-ring w-full rounded-md border-2 border-hairline-strong bg-canvas px-5 py-4 text-xl text-ink placeholder:text-ink-tertiary";

  return (
    <form onSubmit={onSubmit} className="w-full">
      <div className="space-y-3">
        <input
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://your-product.com"
          className={inputCls}
        />
        <div>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, DESC_MAX))}
            maxLength={DESC_MAX}
            placeholder="One line about your product (sharpens matching)"
            className={inputCls}
          />
          <div className="mt-1.5 pr-1 text-right text-sm tabular-nums text-ink-tertiary">
            {description.length}/{DESC_MAX}
          </div>
        </div>
      </div>

      {/* emphasized print-style CTA, with a noticeable gap */}
      <button
        type="submit"
        disabled={loading}
        className="focus-ring btn-press mt-7 w-full rounded-md border-2 border-hairline-strong bg-primary px-6 py-5 text-2xl text-white shadow-[5px_5px_0_0_var(--color-hairline-strong)] hover:bg-primary-hover disabled:opacity-60"
      >
        {loading ? "Lighting the way…" : "Light my way →"}
      </button>
      {error && <p className="mt-3 text-base text-red-700">{error}</p>}
    </form>
  );
}

function messageFor(code: string): string {
  switch (code) {
    case "auth_required":
      return "Sign in with GitHub first.";
    case "map_limit":
      return "You can keep 2 maps at a time. Delete one in your profile to analyze a new product.";
    case "invalid_input":
      return "Enter a valid URL.";
    case "empty_landing":
      return "Couldn't read that page — add a one-line description and retry.";
    case "ai_not_configured":
      return "AI key not set in this environment. Add ANTHROPIC_API_KEY + restart/redeploy.";
    case "analysis_failed":
      return "Analysis failed (API). Try again in a moment.";
    default:
      return "Something went wrong. Try again.";
  }
}
