import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

export const metadata: Metadata = {
  title:
    "NexusPulse | Connecting AI Agents, Human Oracles & Smart Payments on PayPal",
  description:
    "PayPal AI Hackathon Flagship: Autonomous AI CFO (Channel3 + PayPal JS SDK v6 + Subscriptions v1), Proof-of-Human Oracle Micro-Bounties (PayPal Payouts v1), and Zero-Dispute A2A Smart Escrow (PayPal Orders v2 AUTHORIZE + Bryntum + AG Grid + APIMatic + Google Gemini Interactions API + Supabase).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-zinc-50 text-zinc-950 antialiased">
        {children}
      </body>
    </html>
  );
}
