"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Landing-page input: product URL (required) + optional one-line description.
// Posts to /api/analyze, then routes to the generated map.
export function UrlForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
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

  return (
    <form onSubmit={onSubmit} className="w-full max-w-xl space-y-3">
      <input
        type="url"
        required
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://your-product.com"
        className="focus-ring w-full rounded-md border border-hairline bg-surface-1 px-3 py-2.5 text-ink placeholder:text-ink-tertiary"
      />
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={280}
        placeholder="One line about what it does (optional)"
        className="focus-ring w-full rounded-md border border-hairline bg-surface-1 px-3 py-2.5 text-ink placeholder:text-ink-tertiary"
      />
      <button
        type="submit"
        disabled={loading}
        className="focus-ring w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
      >
        {loading ? "Building your map…" : "Build my launch map"}
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
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
