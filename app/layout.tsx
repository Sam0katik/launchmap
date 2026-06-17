import type { Metadata } from "next";
import { Inter, Silkscreen } from "next/font/google";
import "./globals.css";

// Body = Inter (free substitute for Linear's proprietary text cut) — kept for
// readability at small sizes.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
});

// Display = Silkscreen — a blockier, more retro pixel cut. Reserved for the
// wordmark, hero headline, and eyebrows only; never body (readability).
const pixel = Silkscreen({
  subsets: ["latin"],
  variable: "--font-pixel",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "LaunchMap — where to post your product for first users",
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
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
