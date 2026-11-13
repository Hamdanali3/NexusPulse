import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import BrandIntroSplash from "@/components/brand/BrandIntroSplash";
import "./globals.css";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

export const metadata: Metadata = {
  title: "NexusPulse — Smarter spending, verified payouts, and escrow",
  description:
    "Track prices, spot unused subscriptions, pay for verified tasks, and hold milestone funds until work is approved.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-[#fafafa] text-zinc-950 antialiased">
        <BrandIntroSplash />
        {children}
      </body>
    </html>
  );
}
