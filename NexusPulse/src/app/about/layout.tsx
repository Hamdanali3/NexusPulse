import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About NexusPulse | 50-Year AGI Thesis, Engines & Sponsor Architecture",
  description:
    "Explore the architectural blueprint, macroeconomic 50-year AGI thesis, and 7-sponsor technology stack behind NexusPulse — built for the PayPal AI Hackathon 2026.",
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
