import type { Metadata } from "next";
import { Inter, Jersey_10 } from "next/font/google";
import "./globals.css";

// Inter kept only for dense data (the communities table / legal copy) via
// .readable — everything else on the site is pixel.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600"],
});

// Pixel font everywhere = Jersey 10 — a thin, neat pixel typeface.
const pixel = Jersey_10({
  subsets: ["latin"],
  variable: "--font-pixel",
  weight: "400",
});

export const metadata: Metadata = {
  title: "Beacon — light the way to your first users",
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
