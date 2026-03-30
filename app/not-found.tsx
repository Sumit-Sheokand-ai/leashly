import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
      <div className="text-center">
        <p className="font-mono text-[#00ff88] text-sm mb-2">404</p>
        <h1 className="font-mono text-3xl font-bold text-white mb-3">Page not found</h1>
        <p className="text-[#666666] text-sm mb-8">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="bg-[#00ff88] hover:bg-[#00cc6e] text-black font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
