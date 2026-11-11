import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact & Judge Support Desk | NexusPulse",
  description:
    "Direct communications channel for PayPal AI Hackathon judges, developers integrating APIMatic & PayPal SDKs, and enterprise partners deploying NexusPulse A2A Smart Escrow.",
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
