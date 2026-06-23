"use client";

import { useEffect, useState } from "react";
import { DAILY_LIMITS } from "@/lib/billing";

// ZeroFans Pro upsell trigger + modal. Two presentations of the same thing:
//   - variant="badge"  → the status pill that sits right next to the nick
//   - variant="button" → the larger "Upgrade to Pro" call to action
// Either opens the same modal. Real checkout is Stage 6, so the modal CTA is
// inert for now.
export function ProUpsell({
  plan,
  variant,
}: {
  plan: string;
  variant: "badge" | "button";
}) {
  const [open, setOpen] = useState(false);
  const isPaid = plan === "paid";

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Paid users: the badge shows PRO and the button disappears.
  if (isPaid) {
    return variant === "badge" ? (
      <span className="rounded-md border-2 border-success/60 bg-success/10 px-3 py-1.5 text-sm font-medium text-success">
        PRO
      </span>
    ) : null;
  }

  const trigger =
    variant === "badge" ? (
      <button
        onClick={() => setOpen(true)}
        title="View ZeroFans Pro"
        className="focus-ring btn-press rounded-md border-2 border-hairline-strong bg-surface-2 px-3 py-1.5 text-sm font-medium text-ink-muted hover:bg-surface-3"
      >
        FREE
      </button>
    ) : (
      <button
        onClick={() => setOpen(true)}
        className="focus-ring btn-press rounded-md border-2 border-hairline-strong bg-primary px-5 py-2.5 text-base font-medium text-white hover:bg-primary-hover"
      >
        Upgrade to Pro
      </button>
    );

  return (
    <>
      {trigger}
      {open && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="panel w-full max-w-md px-8 pb-8 pt-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-widest text-ink-subtle">
              <span>ZeroFans Pro</span>
              <button
                onClick={() => setOpen(false)}
                className="menu-link rounded-sm"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="receipt-rule mb-5" />
            <h2 className="pixel mb-4 text-ink" style={{ fontSize: "26px" }}>
              Go Pro
            </h2>
            <ul className="space-y-2 text-sm text-ink-muted">
              <li>
                · <span className="tnum">{DAILY_LIMITS.paid}</span> maps per day
                (free is {DAILY_LIMITS.free})
              </li>
              <li>· Full community list unlocked — no per-map paywall</li>
              <li>· Tailored post drafts for every community</li>
              <li>· One-click prefilled submit links everywhere</li>
            </ul>
            <button
              disabled
              className="mt-6 w-full rounded-md border-2 border-hairline-strong bg-primary px-5 py-3 text-base font-medium text-white opacity-50"
            >
              Checkout coming soon (Stage 6)
            </button>
          </div>
        </div>
      )}
    </>
  );
}
