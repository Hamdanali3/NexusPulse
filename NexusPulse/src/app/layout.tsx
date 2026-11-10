import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-50 antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
