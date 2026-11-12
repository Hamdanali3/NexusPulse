import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact — NexusPulse",
  description:
    "Contact the NexusPulse team for product questions, sandbox evaluation guidance, or integration support.",
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
