"use client";

import { useState } from "react";
import { useT } from "@/components/LangProvider";

// In-product playbook: how to set up a Reddit account, avoid bans, and build
// karma before promoting. Lives next to the community list so the rules and the
// account hygiene are in one place. Collapsible to keep the page scannable.
export function RedditGuide() {
  const [open, setOpen] = useState(false);
  const t = useT();
  const sections = [
    { title: t.guidePanel.s1Title, points: t.guidePanel.s1Points },
    { title: t.guidePanel.s2Title, points: t.guidePanel.s2Points },
    { title: t.guidePanel.s3Title, points: t.guidePanel.s3Points },
    { title: t.guidePanel.s4Title, points: t.guidePanel.s4Points },
    { title: t.guidePanel.s5Title, points: t.guidePanel.s5Points },
    { title: t.guidePanel.s6Title, points: t.guidePanel.s6Points },
  ];

  return (
    <section className="mb-8 overflow-hidden rounded-lg border-2 border-primary/50 bg-primary/5 shadow-[4px_5px_0_0_var(--color-hairline-strong)]">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="focus-ring flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">🛟</span>
          <div>
            <h2 className="text-base text-ink">
              {t.guidePanel.title}
            </h2>
            <p className="mt-0.5 text-xs text-ink-subtle">
              {t.guidePanel.subtitle}
            </p>
          </div>
        </div>
        <span className="focus-ring btn-press shrink-0 rounded-md border-2 border-hairline-strong bg-primary px-3 py-1.5 text-xs font-medium text-white">
          {open ? t.guidePanel.hide : t.guidePanel.read}
        </span>
      </button>

      {open && (
        <div className="grid gap-6 border-t-2 border-hairline-strong px-5 py-5 sm:grid-cols-2">
          {sections.map((s) => (
            <div key={s.title}>
              <h3 className="eyebrow mb-2 text-ink">{s.title}</h3>
              <ul className="space-y-1.5 text-sm text-ink-muted">
                {s.points.map((p, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-ink-tertiary">·</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="text-xs text-ink-tertiary sm:col-span-2">
            {t.guidePanel.footer}
          </p>
        </div>
      )}
    </section>
  );
}
