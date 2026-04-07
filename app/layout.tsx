import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";
import { CookieConsent } from "@/components/layout/cookie-consent";

const BASE_URL = "https://leashly.dev";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Leashly — AI Cost Control & Proxy",
    template: "%s | Leashly",
  },
  description:
    "Leashly sits between your app and any LLM. Enforce spend caps, rate limits, and prompt injection protection — and cut your AI bill with smart routing, semantic caching, and prompt compression.",
  keywords: [
    "AI cost control", "LLM proxy", "OpenAI cost optimization", "AI spend cap",
    "rate limiting LLM", "prompt injection protection", "semantic cache AI",
    "smart routing LLM", "AI API proxy", "reduce OpenAI costs", "AI budget management", "leashly",
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
  // manifest handled by app/manifest.ts
  openGraph: {
    type: "website", locale: "en_US", url: BASE_URL, siteName: "Leashly",
    title:       "Leashly — AI Cost Control & Proxy",
    description: "Stop surprise AI bills. Smart routing, semantic cache, and prompt compression cut your AI costs by up to 60%.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Leashly — AI Cost Control & Proxy" }],
  },
  twitter: {
    card: "summary_large_image", site: "@leashlydev", creator: "@leashlydev",
    title:       "Leashly — AI Cost Control & Proxy",
    description: "Stop surprise AI bills. Smart routing, semantic cache, and prompt compression cut your AI costs by up to 60%.",
    images: ["/og-image.png"],
  },
  verification: { google: process.env.GOOGLE_SITE_VERIFICATION ?? "" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Leashly",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any",
  url: BASE_URL,
  description: "AI cost control and optimization proxy. Enforce spend caps, rate limits, and prompt injection protection for any LLM API.",
  offers: [
    { "@type": "Offer", price: "0",  priceCurrency: "USD", name: "Free Plan" },
    { "@type": "Offer", price: "9",  priceCurrency: "CAD", name: "Pro Plan", billingIncrement: "month" },
  ],
  featureList: ["Spend caps per user and model","Rate limiting","Prompt injection protection","Smart model routing","Semantic caching","Prompt compression","Real-time cost attribution","Email alerts"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <script dangerouslySetInnerHTML={{ __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-WNKK8SWN');` }} />
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
