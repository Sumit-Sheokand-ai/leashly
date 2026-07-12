"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

// Route-level boundary: renders INSIDE the root layout, so no <html>/<body>
// here (that lives in global-error.tsx). Catches errors from pages/components.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Leashly Error]", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="inline-flex p-4 rounded-xl bg-[#ff4444]/10 border border-[#ff4444]/20 mb-6">
          <AlertTriangle size={32} className="text-[#ff4444]" />
        </div>
        <h1 className="font-mono text-xl font-bold text-white mb-2">Something went wrong</h1>
        <p className="text-[#666666] text-sm mb-2">
          An unexpected error occurred on this page. It has been logged.
        </p>
        {error.digest && (
          <p className="font-mono text-xs text-[#444444] mb-6">Error ID: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="flex items-center gap-2 mx-auto bg-[#00ff88] hover:bg-[#00cc6e] text-black font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
        >
          <RefreshCw size={14} />
          Try again
        </button>
      </div>
    </div>
  );
}
