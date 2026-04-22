import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — Leashly",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://www.leashly.dev/login" },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
