"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
      <div className="p-3 rounded-xl bg-[#ff4444]/10 border border-[#ff4444]/20">
        <AlertTriangle size={24} className="text-[#ff4444]" />
      </div>
      <div>
        <p className="font-mono text-sm text-white mb-1">Something went wrong</p>
        <p className="text-xs text-[#666666]">{error.message || "An unexpected error occurred"}</p>
      </div>
      <button
        onClick={reset}
        className="flex items-center gap-2 text-xs border border-[#1f1f1f] hover:border-[#00ff88] text-[#f0f0f0] px-4 py-2 rounded-lg transition-colors"
      >
        <RefreshCw size={12} /> Retry
      </button>
    </div>
  );
}
