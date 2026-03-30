import Image from "next/image";

export const dynamic = "force-dynamic";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <a href="/" className="inline-block">
            <Image src="/logo.svg" alt="Leashly" width={130} height={32} priority />
          </a>
        </div>
        {children}
      </div>
    </div>
  );
}
