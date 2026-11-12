import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About NexusPulse | Frontier Research, Autonomous Engines & Architecture",
  description:
    "Explore the architectural blueprint, frontier AI literature foundations, and 7-sponsor technology stack behind NexusPulse — built for the PayPal AI Hackathon 2026.",
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
