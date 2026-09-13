"use client";

import { createContext, useContext } from "react";
import { dict, type Lang } from "@/lib/i18n";

// Carries the language the server already resolved from the cookie down to
// client components, so both halves of the tree render the same language on
// the first paint (no post-hydration swap).
const LangContext = createContext<Lang>("en");

export function LangProvider({
  lang,
  children,
}: {
  lang: Lang;
  children: React.ReactNode;
}) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export function useLang(): Lang {
  return useContext(LangContext);
}

/** The dictionary for the active language. */
export function useT() {
  return dict(useContext(LangContext));
}
