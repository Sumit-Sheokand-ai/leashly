export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="inline-block">
            <span className="font-mono text-2xl font-bold">
              <span className="text-[#00ff88]">Gate</span>
              <span className="text-white">AI</span>
            </span>
          </a>
        </div>
        {children}
      </div>
    </div>
  );
}
