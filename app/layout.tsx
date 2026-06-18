import type { Metadata } from "next";
import { Inter, VT323 } from "next/font/google";
import "./globals.css";

// Readable cut for dense / long text.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
});

// Pixel display = VT323 — a readable retro-terminal mono. The whole UI runs on
// this; long-form text opts into .readable (Inter).
const pixel = VT323({
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
      <body className="antialiased">
        {children}
        <div className="crt-overlay" aria-hidden="true" />
      </body>
    </html>
  );
}
