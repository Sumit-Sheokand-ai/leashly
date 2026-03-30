import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Leashly — AI Cost Control & Abuse Prevention Proxy",
  description:
    "Stop surprise AI bills. Leashly enforces spend caps, rate limits, and prompt injection protection between your app and any LLM provider.",
  openGraph: {
    title: "Leashly — AI Cost Control & Abuse Prevention Proxy",
    description: "Stop surprise AI bills. Leashly enforces spend caps, rate limits, and prompt injection protection.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${ibmPlexMono.variable} antialiased bg-[#0a0a0a] text-[#f0f0f0]`}>
        {children}
      </body>
    </html>
  );
}
