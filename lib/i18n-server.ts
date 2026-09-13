// Server-side language read. Kept out of lib/i18n.ts so client components can
// import the dictionary without pulling next/headers into the browser bundle.
//
// Reading the cookie opts a route into dynamic rendering — that is deliberate:
// a statically prerendered page would be baked in one language and could be
// served from the CDN to a reader who picked the other one.
import { cookies } from "next/headers";
import { LANG_COOKIE, dict, normalizeLang, type Lang } from "@/lib/i18n";

export function serverLang(): Lang {
  return normalizeLang(cookies().get(LANG_COOKIE)?.value);
}

export function serverDict() {
  const lang = serverLang();
  return { lang, t: dict(lang) };
}
