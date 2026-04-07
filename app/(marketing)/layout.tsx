import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: {
    canonical: "https://leashly.dev",
  },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
