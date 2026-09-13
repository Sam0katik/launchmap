"use client";

// Language switcher for the landing page: a small chip pinned bottom-right
// that shows the current language and reveals the list on hover/focus.
// UI only — no localization behind it yet, so Russian is marked "soon".
import { useState } from "react";

// Flags drawn as SVG (not emoji: flag emoji don't render on Windows at all).
// One viewBox unit = one stripe, in the site's muted ink/cream palette.
function FlagUS() {
  return (
    <svg width="18" height="9" viewBox="0 0 26 13" aria-hidden="true">
      <rect width="26" height="13" fill="#efece2" />
      {[0, 2, 4, 6, 8, 10, 12].map((y) => (
        <rect key={y} y={y} width="26" height="1" fill="#b4241f" />
      ))}
      <rect width="10" height="7" fill="#2a3a6b" />
      <g fill="#efece2">
        {[1, 3, 5].map((y) =>
          (y === 3 ? [2, 4, 6, 8] : [1, 3, 5, 7]).map((x) => (
            <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />
          )),
        )}
      </g>
      <rect x="0.5" y="0.5" width="25" height="12" fill="none" stroke="#1b1a16" />
    </svg>
  );
}

function FlagRU() {
  return (
    <svg width="18" height="9" viewBox="0 0 26 13" aria-hidden="true">
      <rect width="26" height="13" fill="#efece2" />
      <rect y="4.333" width="26" height="4.333" fill="#2a3a6b" />
      <rect y="8.666" width="26" height="4.334" fill="#b4241f" />
      <rect x="0.5" y="0.5" width="25" height="12" fill="none" stroke="#1b1a16" />
    </svg>
  );
}

const LANGS = [
  { code: "en", label: "EN", name: "English", Flag: FlagUS },
  { code: "ru", label: "RU", name: "Русский", Flag: FlagRU },
] as const;

type LangCode = (typeof LANGS)[number]["code"];

export function LanguageSwitcher() {
  const [lang, setLang] = useState<LangCode>("en");
  const current = LANGS.find((l) => l.code === lang)!;

  return (
    <div className="group fixed bottom-4 right-4 z-30 select-none">
      {/* list — hidden until the chip is hovered or focused */}
      <div className="pointer-events-none absolute bottom-full right-0 mb-2 origin-bottom-right scale-95 opacity-0 transition-[opacity,transform] duration-150 ease-out group-hover:pointer-events-auto group-hover:scale-100 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:scale-100 group-focus-within:opacity-100">
        <ul className="w-max rounded-sm border-2 border-hairline-strong bg-surface-1 p-1 shadow-[4px_5px_0_0_var(--color-hairline-strong)]">
          {LANGS.map(({ code, name, Flag }) => (
            <li key={code}>
              <button
                type="button"
                onClick={() => setLang(code)}
                aria-current={code === lang}
                className={`focus-ring flex w-full items-center gap-2 rounded-xs px-2 py-1.5 text-left text-[13px] ${
                  code === lang ? "bg-[#b9c4a0] text-ink" : "text-ink-muted hover:bg-surface-3"
                }`}
              >
                <Flag />
                <span>{name}</span>
                {code === "ru" && (
                  <span className="ml-1 text-[10px] uppercase tracking-widest text-ink-subtle">
                    soon
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        aria-label={`Language: ${current.name}`}
        className="btn-press focus-ring flex items-center gap-1.5 rounded-sm border-2 border-hairline-strong bg-surface-1 px-2 py-1.5 text-[13px] text-ink shadow-[3px_4px_0_0_var(--color-hairline-strong)] hover:bg-surface-2"
      >
        <current.Flag />
        <span>{current.label}</span>
      </button>
    </div>
  );
}
