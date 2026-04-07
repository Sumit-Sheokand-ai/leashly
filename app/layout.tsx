import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";
import { CookieConsent } from "@/components/layout/cookie-consent";

const BASE_URL = "https://www.leashly.dev";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Leashly — AI Cost Control & LLM Proxy",
    template: "%s | Leashly",
  },
  description:
    "Leashly is an AI cost control proxy. Enforce spend caps, rate limits, and prompt injection protection for OpenAI, Anthropic, and Gemini. Cut your AI bill by up to 60%.",
  keywords: [
    "AI cost control", "LLM proxy", "OpenAI cost optimization", "AI spend cap",
    "rate limiting LLM", "prompt injection protection", "semantic cache AI",
    "smart routing LLM", "AI API proxy", "reduce OpenAI costs",
    "AI budget management", "leashly", "chatgpt cost control",
    "anthropic proxy", "gemini proxy", "llm cost monitoring",
  ],
  authors:   [{ name: "Leashly", url: BASE_URL }],
  creator:   "Leashly",
  publisher: "Leashly",
  category:  "Technology",
  robots: {
    index: true, follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
  },
  alternates: { canonical: BASE_URL },
  icons: {
    icon:     [{ url: "/favicon.ico", sizes: "any" }, { url: "/favicon-16.png", sizes: "16x16", type: "image/png" }, { url: "/favicon-32.png", sizes: "32x32", type: "image/png" }, { url: "/logo-icon.svg", type: "image/svg+xml" }],
    apple:    [{ url: "/logo-icon-180.png", sizes: "180x180" }],
    other:    [{ rel: "icon", url: "/logo-icon-192.png", sizes: "192x192" }],
    shortcut: "/favicon.ico",
  },
  openGraph: {
    type: "website", locale: "en_US", url: BASE_URL, siteName: "Leashly",
    title:       "Leashly — AI Cost Control & LLM Proxy",
    description: "Stop surprise AI bills. Smart routing, semantic cache, and prompt compression cut your AI costs by up to 60%. Works with OpenAI, Anthropic, and Gemini.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Leashly — AI Cost Control & LLM Proxy" }],
  },
  twitter: {
    card: "summary_large_image", site: "@leashlydev", creator: "@leashlydev",
    title:       "Leashly — AI Cost Control & LLM Proxy",
    description: "Stop surprise AI bills. Smart routing, semantic cache, and prompt compression cut your AI costs by up to 60%.",
    images: ["/og-image.png"],
  },
  verification: { google: process.env.GOOGLE_SITE_VERIFICATION ?? "" },
};

const softwareAppSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Leashly",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any",
  url: BASE_URL,
  description: "AI cost control and LLM proxy. Enforce spend caps, rate limits, and prompt injection protection for OpenAI, Anthropic, and Gemini APIs.",
  offers: [
    { "@type": "Offer", price: "0", priceCurrency: "USD", name: "Free Plan" },
    { "@type": "Offer", price: "9", priceCurrency: "CAD", name: "Pro Plan", billingIncrement: "month" },
  ],
  aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", ratingCount: "47" },
  featureList: ["Spend caps per user and model","Rate limiting","Prompt injection protection","Smart model routing","Semantic caching","Prompt compression","Real-time cost attribution","Email alerts"],
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Leashly",
  url: BASE_URL,
  logo: `${BASE_URL}/logo.svg`,
  description: "AI cost control and LLM proxy for developers.",
  sameAs: ["https://github.com/Sumit-Sheokand-ai/leashly"],
  contactPoint: { "@type": "ContactPoint", email: "support@leashly.dev", contactType: "customer support" },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "What is an AI cost control proxy?", acceptedAnswer: { "@type": "Answer", text: "An AI cost control proxy sits between your application and LLM providers like OpenAI or Anthropic. It enforces spend caps, rate limits, and security filters on every request, and can actively reduce costs through smart routing and semantic caching." } },
    { "@type": "Question", name: "How do I reduce my OpenAI API costs?", acceptedAnswer: { "@type": "Answer", text: "Leashly reduces OpenAI costs through smart routing (automatically using cheaper models for simple tasks), semantic caching (returning cached responses for similar prompts at zero cost), and prompt compression (shrinking system prompts before they reach the model). Average savings are 60%." } },
    { "@type": "Question", name: "How do I add rate limiting to my OpenAI API calls?", acceptedAnswer: { "@type": "Answer", text: "With Leashly, add one line of code — change your OpenAI base URL to https://www.leashly.dev/api/proxy and your API key to your Leashly proxy key. Then configure rate limiting rules in the dashboard with no additional code changes." } },
    { "@type": "Question", name: "What is prompt injection and how do I prevent it?", acceptedAnswer: { "@type": "Answer", text: "Prompt injection is an attack where malicious users insert instructions into prompts to hijack AI behavior. Leashly scans every request against 50+ known attack patterns and blocks them before they reach the model." } },
    { "@type": "Question", name: "Does Leashly work with Anthropic Claude?", acceptedAnswer: { "@type": "Answer", text: "Yes. Leashly supports OpenAI, Anthropic Claude, Google Gemini, and any OpenAI-compatible endpoint." } },
    { "@type": "Question", name: "How much latency does an LLM proxy add?", acceptedAnswer: { "@type": "Answer", text: "Leashly adds less than 5ms of overhead in typical operation. Rule evaluation happens in-memory with no additional database round-trips on the hot path." } },
  ],
};

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to add spend caps and rate limits to OpenAI API",
  description: "Set up AI cost control for your OpenAI, Anthropic, or Gemini API calls in under 5 minutes using Leashly.",
  totalTime: "PT5M",
  step: [
    { "@type": "HowToStep", name: "Create a free Leashly account", text: "Go to leashly.dev/register and sign up. No credit card required.", url: `${BASE_URL}/register` },
    { "@type": "HowToStep", name: "Add your provider API key", text: "In the dashboard, go to API Keys and add your OpenAI, Anthropic, or Gemini key. Encrypted with AES-256 immediately." },
    { "@type": "HowToStep", name: "Update your base URL", text: "Change your SDK base URL to https://www.leashly.dev/api/proxy and use your Leashly proxy key. Only code change needed." },
    { "@type": "HowToStep", name: "Set a spend cap rule", text: "In the dashboard under Rules, create a spend cap rule with a daily limit." },
  ],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Leashly",
  url: BASE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${BASE_URL}/docs#{search_term_string}` },
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* JSON-LD structured data */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
        {/* Google Tag Manager */}
        <script dangerouslySetInnerHTML={{ __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-WNKK8SWN');` }} />
        {/* Microsoft Clarity */}
        <script dangerouslySetInnerHTML={{ __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i+"?ref=bwt";y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","w7tqs3l3dt");` }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased bg-[#0a0a0a] text-[#f0f0f0]">
        <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-WNKK8SWN" height="0" width="0" style={{ display: "none", visibility: "hidden" }} /></noscript>
        {children}
        <CookieConsent />
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-DMXRLQSK33" strategy="afterInteractive" />
        <Script id="gtag-init" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-DMXRLQSK33');`}</Script>
      </body>
    </html>
  );
}
