import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Leashly — AI Cost Control & Abuse Prevention Proxy",
  description:
    "Stop surprise AI bills. Leashly enforces spend caps, rate limits, and prompt injection protection between your app and any LLM provider.",
  icons: {
    icon: "/logo-icon.svg",
    shortcut: "/logo-icon.svg",
  },
  openGraph: {
    title: "Leashly — AI Cost Control & Abuse Prevention Proxy",
    description: "Stop surprise AI bills. Leashly enforces spend caps, rate limits, and prompt injection protection.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-[#0a0a0a] text-[#f0f0f0]">
        {children}
      </body>
    </html>
  );
}
