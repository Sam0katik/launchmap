"use client";

import { useState } from "react";
import { PaperPlane } from "@/components/PaperPlane";

// The map's product summary used to render as a giant 6-line display heading —
// visually heavy and pushing the actual map below the fold. This wraps it in a
// receipt-style header: a compact 2-line clamp by default with a show-more
// toggle, plus the category / ICP meta line. Identity stays (pixel mono, dashed
// receipt rule, eyebrow), the bulk goes.
export function CollapsibleHeadline({
  summary,
  fallback,
  runNo,
}: {
  summary: string;
  fallback: string;
  runNo: string;
}) {
  const [open, setOpen] = useState(false);
  const text = summary || fallback;
  // Only offer the toggle when the summary is long enough to actually clamp.
  const longish = text.length > 90;

  return (
    <header className="panel mb-10 px-8 pb-7 pt-6">
      <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-widest text-ink-subtle">
        <span>Your launch map</span>
        <span className="tnum">No. {runNo}</span>
      </div>
      <div className="receipt-rule mb-5" />

      <div className="mb-3">
        <PaperPlane size={52} fly />
      </div>

      <h1
        className={`pixel text-ink ${open ? "" : longish ? "line-clamp-2" : ""}`}
        style={{
          fontSize: "clamp(22px, 2.6vw, 30px)",
          lineHeight: 1.18,
          letterSpacing: "0.3px",
        }}
      >
        {text}
      </h1>

      {longish && (
        <button
          onClick={() => setOpen((v) => !v)}
          className="menu-link focus-ring mt-4 rounded-sm text-xs uppercase tracking-widest text-ink-muted"
        >
          {open ? "− show less" : "+ show full"}
        </button>
      )}
    </header>
  );
}
