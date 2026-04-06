import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Leashly — AI Cost Control & Optimization Proxy",
  description:
    "Stop surprise AI bills. Leashly enforces spend caps, rate limits, and prompt injection protection — and now actively cuts your AI bill with smart routing, semantic caching, and prompt compression.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logo-icon.svg", type: "image/svg+xml" },
    ],
    apple: "/logo-icon-180.png",
    other: [{ rel: "icon", url: "/logo-icon-192.png", sizes: "192x192" }],
  },
  openGraph: {
    title: "Leashly — AI Cost Control & Optimization Proxy",
    description: "Stop surprise AI bills. Smart routing, semantic cache, and prompt compression cut your AI costs by up to 60%.",
    type: "website",
    images: [{ url: "/logo-icon.png", width: 512, height: 512 }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-WNKK8SWN');`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-[#0a0a0a] text-[#f0f0f0]">
        {/* GTM noscript */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-WNKK8SWN"
            height="0" width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {children}
        {/* Google Analytics (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-DMXRLQSK33"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-DMXRLQSK33');
          `}
        </Script>
      </body>
    </html>
  );
}
