"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dots } from "@/components/Dots";
import communities from "@/data/communities.json";

// Rotating example URLs — cycled through the placeholder for a bit of life and
// to hint at what to paste.
const EXAMPLES = [
  "https://your-product.com",
  "https://linear.app",
  "https://cal.com",
  "https://tldraw.com",
  "https://your-saas.io",
];

// Landing-page input: product URL (required) + optional one-line description.
// When the backend (Supabase) is configured it POSTs /api/analyze and routes to
// the real map. Until then it runs in DEMO MODE: validate the URL client-side
// and route to /demo so entering a URL actually shows something.
const BACKEND_READY = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

// What the scan is actually doing, surfaced while it runs — the analyze call
// really does these steps, so the button narrates real work, not theater.
const SCAN_STEPS = [
  "Reading your landing page",
  "Extracting your niche",
  `Matching ${communities.length} communities`,
  "Checking posting rules",
  "Ranking your map",
];

export function UrlForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [showDescription, setShowDescription] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placeholder, setPlaceholder] = useState(EXAMPLES[0]);
  const [step, setStep] = useState(0);

  // Cycle the placeholder while the field is empty.
  useEffect(() => {
    if (url) return;
    let i = 0;
    const t = setInterval(() => {
      i = (i + 1) % EXAMPLES.length;
      setPlaceholder(EXAMPLES[i]);
    }, 2200);
    return () => clearInterval(t);
  }, [url]);

  // Walk through the scan steps while the analysis runs (~8-15s total).
  useEffect(() => {
    if (!loading) return;
    setStep(0);
    const t = setInterval(
      () => setStep((s) => Math.min(s + 1, SCAN_STEPS.length - 1)),
      2600
    );
    return () => clearInterval(t);
  }, [loading]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Basic client-side validation (defense in depth; server validates too).
    let u: URL;
    try {
      u = new URL(url);
      if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error();
    } catch {
      setError("Enter a valid http(s) URL.");
      return;
    }

    // Easter egg: scanning our own marketing domain. Narrow to the brand word
    // only — "launchmap" would also match the Vercel preview domain, which is a
    // perfectly valid product URL to scan.
    if (/(^|\.)zerofans\.(app|com|io)$/i.test(u.hostname)) {
      setError("nice try 😏 — go map a real product.");
      return;
    }

    // Demo mode — no backend yet.
    if (!BACKEND_READY) {
      router.push(`/demo?${new URLSearchParams({ url }).toString()}`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          url,
          description: description.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(messageFor(data.error));
        // A page we couldn't read: open the description field so the retry
        // has something to analyze.
        if (data.error === "empty_landing") setShowDescription(true);
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
    "focus-ring w-full rounded-md border-2 border-hairline-strong bg-canvas px-4 py-3.5 text-lg text-ink placeholder:text-ink-tertiary";

  return (
    <form onSubmit={onSubmit} className="w-full">
      <input
        type="url"
        required
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder={placeholder}
        className={inputCls}
      />

      {/* optional one-liner — the fallback when the landing page is thin or
          JS-only; opens automatically after an "empty_landing" error */}
      {showDescription ? (
        <input
          type="text"
          value={description}
          maxLength={280}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="One line: what it does, for whom (optional)"
          className={`${inputCls} mt-3 text-base`}
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowDescription(true)}
          className="focus-ring mt-2 text-sm text-ink-subtle hover:text-ink"
        >
          + add a one-line description (optional)
        </button>
      )}

      {/* emphasized print-style CTA, with a noticeable gap */}
      <button
        type="submit"
        disabled={loading}
        className="focus-ring btn-press mt-6 w-full rounded-md border-2 border-hairline-strong bg-primary px-5 py-4 text-xl text-white shadow-[5px_5px_0_0_var(--color-hairline-strong)] hover:bg-primary-hover disabled:opacity-60"
      >
        {loading ? (
          <>
            {SCAN_STEPS[step]}
            <Dots />
          </>
        ) : (
          "Scan to launch →"
        )}
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
    case "blocked":
      return "This account is blocked. Contact us if you think that's a mistake.";
    case "daily_limit":
      return "Daily analysis limit reached — try again tomorrow.";
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
