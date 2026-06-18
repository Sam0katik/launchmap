import type { Metadata } from "next";
import { Inter, Pixelify_Sans } from "next/font/google";
import "./globals.css";

// Body/UI text = Inter (clean, readable) — the default everywhere.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
});

// Pixel display = Pixelify Sans — used for the brand + hero headline only, so
// the UI reads polished, not crunchy.
const pixel = Pixelify_Sans({
  subsets: ["latin"],
  variable: "--font-pixel",
  weight: ["400", "500", "600", "700"],
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
