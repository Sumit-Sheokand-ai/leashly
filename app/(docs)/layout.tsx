import type { Metadata } from "next";

const BASE_URL = "https://www.leashly.dev";

export const metadata: Metadata = {
  title: "Leashly Docs — LLM Proxy Integration Guide",
  description:
    "Complete guide to integrating Leashly. Set up spend caps, rate limits, injection protection, smart routing, and semantic caching for OpenAI, Anthropic, and Gemini in minutes.",
  keywords: [
    "leashly docs",
    "LLM proxy documentation",
    "OpenAI proxy setup",
    "AI cost control guide",
    "rate limit OpenAI API",
    "prompt injection detection",
    "semantic caching LLM",
    "smart model routing",
    "AI proxy quickstart",
    "openai baseURL proxy",
  ],
  alternates: {
    canonical: `${BASE_URL}/docs`,
  },
  openGraph: {
    title: "Leashly Documentation — LLM Proxy Integration Guide",
    description:
      "Set up spend caps, rate limits, and cost optimization for any LLM in minutes.",
    url: `${BASE_URL}/docs`,
  },
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
