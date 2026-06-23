"use client";

import { useEffect, useState } from "react";
import { DAILY_LIMITS } from "@/lib/billing";

// Plan status next to the profile nick. The "FREE" pill is a button — clicking
// it (or the disabled Upgrade button, once live) opens the Beacon Pro upsell.
// Billing isn't wired yet (Stage 6), so the modal CTA stays inert.
export function PlanControls({ plan }: { plan: string }) {
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

  return (
    <div className="flex items-center gap-3">
      {isPaid ? (
        <span className="rounded-sm border-2 border-success/60 bg-success/10 px-3 py-1 text-sm text-success">
          PRO
        </span>
      ) : (
        <>
          <button
            onClick={() => setOpen(true)}
            className="focus-ring btn-press rounded-sm border-2 border-hairline-strong bg-surface-2 px-3 py-1 text-sm text-ink-muted hover:bg-surface-3"
            title="View Beacon Pro"
          >
            FREE
          </button>
          <button
            disabled
            title="Pro upgrade goes live in Stage 6"
            className="rounded-sm border-2 border-hairline-strong bg-primary px-3 py-1 text-sm font-medium text-white opacity-50"
          >
            Upgrade to Pro
          </button>
        </>
      )}

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
              <span>Beacon Pro</span>
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
    </div>
  );
}
