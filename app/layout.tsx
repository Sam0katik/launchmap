import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

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
  return (
    <html lang="en" className={`${inter.variable} ${pixel.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
