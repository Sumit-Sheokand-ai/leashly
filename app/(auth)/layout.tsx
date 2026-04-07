import type { Metadata } from "next";
import Image from "next/image";
import { ReactNode } from "react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-start pt-12 p-4">
      <div className="mb-8">
        <a href="/" className="inline-block">
          <Image src="/logo.svg" alt="Leashly" width={130} height={32} priority />
        </a>
      </div>
      {children}
    </div>
  );
}
