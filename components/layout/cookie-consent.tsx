"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("leashly_cookie_consent");
    if (!consent) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem("leashly_cookie_consent", "accepted");
    setVisible(false);
  }

  function decline() {
    localStorage.setItem("leashly_cookie_consent", "declined");
    // Disable GA
    (window as Window & { "ga-disable-G-DMXRLQSK33"?: boolean })["ga-disable-G-DMXRLQSK33"] = true;
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-xl animate-fade-up">
      <div className="bg-[var(--surface-2)] border border-[var(--border-mid)] rounded-2xl px-5 py-4 shadow-card flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-sm text-[var(--text-dim)] flex-1 leading-relaxed">
          We use cookies for authentication and anonymous analytics.{" "}
          <Link href="/privacy" className="text-[var(--green)] hover:underline underline-offset-2">
            Privacy Policy
          </Link>
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={decline}
            className="text-xs text-[var(--text-ghost)] hover:text-[var(--text-dim)] px-3 py-1.5 rounded-xl border border-[var(--border-mid)] hover:border-[var(--border-hi)] transition-all"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="text-xs font-semibold bg-[var(--green)] hover:bg-[var(--green-dim)] text-black px-4 py-1.5 rounded-xl transition-all"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
