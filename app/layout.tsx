import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { LangProvider } from "@/components/LangProvider";
import { serverLang } from "@/lib/i18n-server";

// Inter kept only for dense data (the communities table / legal copy) via
// .readable — everything else on the site is the pixel mono.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600"],
});

// Departure Mono — self-hosted (SIL OFL). The site's pixel mono typeface.
const pixel = localFont({
  src: "../public/fonts/DepartureMono-Regular.woff2",
  variable: "--font-pixel",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ZeroFans",
  description:
    "Paste your product URL, get a ranked map of communities to launch in — with the rules, karma requirements, best time, a one-click submit link, and a tailored draft.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Reading the language cookie here makes every route render per-request.
  // That is the point: the page must come back in the reader's language on the
  // very first paint, including after a reload.
  const lang = serverLang();

  return (
    <html lang={lang} className={`${inter.variable} ${pixel.variable}`}>
      <body className="antialiased">
        <LangProvider lang={lang}>{children}</LangProvider>
      </body>
    </html>
  );
}
