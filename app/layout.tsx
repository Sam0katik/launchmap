import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Inter = documented free substitute for Linear's proprietary display/text cut.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
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
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
