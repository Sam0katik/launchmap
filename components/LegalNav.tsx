import Link from "next/link";

// Tab strip linking the legal pages together (Privacy / Terms / Refunds /
// Contact). Payment processors expect these to be cross-linked and reachable.
const TABS = [
  { key: "privacy", label: "Privacy", href: "/privacy" },
  { key: "terms", label: "Terms", href: "/terms" },
  { key: "refunds", label: "Refunds", href: "/refunds" },
  { key: "contact", label: "Contact", href: "/contact" },
] as const;

export function LegalNav({ active }: { active: string }) {
  return (
    <nav className="flex flex-wrap gap-2">
      {TABS.map((t) => {
        const isActive = t.key === active;
        return (
          <Link
            key={t.key}
            href={t.href}
            aria-current={isActive ? "page" : undefined}
            className={`rounded-sm border-2 px-3 py-1.5 text-sm ${
              isActive
                ? "border-hairline-strong bg-ink text-canvas"
                : "border-hairline-strong bg-surface-1 text-ink-muted hover:bg-surface-2"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
