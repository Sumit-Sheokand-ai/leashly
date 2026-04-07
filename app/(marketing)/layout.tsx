import type { Metadata } from "next";

const BASE_URL = "https://www.leashly.dev";

export const metadata: Metadata = {
  title: "Leashly — AI Cost Control & LLM Proxy | Stop Surprise AI Bills",
  description:
    "Leashly is an AI cost control proxy for OpenAI, Anthropic, and Gemini. Enforce spend caps, rate limits, and prompt injection protection. Cut your AI bill by up to 60% with smart routing and semantic caching.",
  keywords: [
    "AI cost control",
    "LLM proxy",
    "OpenAI cost optimization",
    "reduce OpenAI bill",
    "AI spend cap",
    "rate limiting LLM",
    "prompt injection protection",
    "semantic cache AI",
    "smart model routing",
    "AI API proxy",
    "ChatGPT cost control",
    "Anthropic Claude proxy",
    "Gemini proxy",
    "AI budget management",
    "leashly",
    "openai proxy server",
    "llm cost monitoring",
    "ai token tracking",
  ],
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    title: "Leashly — AI Cost Control & LLM Proxy",
    description:
      "Stop surprise AI bills. Smart routing, semantic cache, and prompt compression cut your AI costs by up to 60%. Works with OpenAI, Anthropic, and Gemini.",
    url: BASE_URL,
    type: "website",
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
