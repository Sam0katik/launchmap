import Link from "next/link";
import { serverDict } from "@/lib/i18n-server";

// Tab strip linking the legal pages together (Privacy / Terms / Refunds /
// Contact). Payment processors expect these to be cross-linked and reachable.
export function LegalNav({ active }: { active: string }) {
  const { t } = serverDict();
  const TABS = [
    { key: "privacy", label: t.footer.privacy, href: "/privacy" },
    { key: "terms", label: t.footer.terms, href: "/terms" },
    { key: "refunds", label: t.footer.refunds, href: "/refunds" },
    { key: "contact", label: t.footer.contact, href: "/contact" },
  ];

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
