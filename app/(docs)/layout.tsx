import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation",
  description: "Complete guide to integrating Leashly. Learn how to set up spend caps, rate limits, smart routing, and semantic caching for any LLM API in minutes.",
  alternates: {
    canonical: "https://leashly.dev/docs",
  },
  openGraph: {
    title: "Leashly Documentation",
    description: "Complete integration guide for Leashly — AI cost control and optimization proxy.",
    url: "https://leashly.dev/docs",
  },
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
