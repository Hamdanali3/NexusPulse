import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — NexusPulse",
  description:
    "How NexusPulse handles price monitoring, subscription reviews, task verification, and milestone escrow.",
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
