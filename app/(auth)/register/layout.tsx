import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account — Leashly",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://www.leashly.dev/register" },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
