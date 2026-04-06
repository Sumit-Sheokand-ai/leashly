"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CreditCard, RefreshCw, CheckCircle, AlertTriangle, Zap, ExternalLink } from "lucide-react";
import { useDashboardData } from "@/lib/use-dashboard-data";

interface BillingData {
  currentPlan: string;
  subscriptionEndsAt: string | null;
  cancelAtPeriodEnd: boolean;
  hasSubscription: boolean;
}

const STRIPE_PRO_LINK = "https://buy.stripe.com/3cI5kFfIBf0z3lLbh59Ve0a";

export default function BillingPage() {
  const searchParams = useSearchParams();
  const fetcher = useCallback(async (): Promise<BillingData> => {
    const res = await fetch("/api/billing");
    if (!res.ok) throw new Error("Failed");
    return res.json();
  }, []);

  const { data, loading, refresh } = useDashboardData<BillingData>("dashboard:billing", fetcher);

  const [cancelling, setCancelling]               = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (searchParams.get("success") === "1") {
      setMsg({ text: "Payment successful! Your Pro plan is now active.", type: "success" });
      refresh();
    }
    if (searchParams.get("cancelled") === "1") {
      setMsg({ text: "Payment cancelled.", type: "error" });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function cancelSubscription() {
    setCancelling(true);
    try {
      const res = await fetch("/api/billing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const d = await res.json();
      setMsg({ text: d.message ?? "Cancelled.", type: res.ok ? "success" : "error" });
      setShowCancelConfirm(false);
      refresh();
    } catch { setMsg({ text: "Network error.", type: "error" }); }
    setCancelling(false);
  }

  async function reactivate() {
    try {
      const res = await fetch("/api/billing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reactivate" }),
      });
      const d = await res.json();
      setMsg({ text: d.message ?? "Reactivated.", type: res.ok ? "success" : "error" });
      refresh();
    } catch { setMsg({ text: "Network error.", type: "error" }); }
  }

  if (loading && !data) return (
    <div className="flex items-center justify-center h-48">
      <RefreshCw className="animate-spin text-[#00ff88]" size={20} />
    </div>
  );

  const isPro = data?.currentPlan === "pro";
  const isFree = !isPro;

  return (
    <div className="max-w-xl space-y-5">
      <div>
        <h2 className="font-mono text-lg font-bold text-white flex items-center gap-2">
          <CreditCard size={18} className="text-[#888888]" /> Billing
        </h2>
        <p className="text-sm text-[#555555] mt-0.5">
          {isPro ? "You're on the Pro plan." : "Upgrade to Pro to unlock all features."}
        </p>
      </div>

      {/* Status message */}
      {msg && (
        <div className={`rounded-2xl border px-4 py-3 flex items-center gap-2 text-sm ${
          msg.type === "success"
            ? "bg-[#00ff88]/8 border-[#00ff88]/20 text-[#00ff88]"
            : "bg-[#ff4444]/8 border-[#ff4444]/20 text-[#ff4444]"
        }`}>
          {msg.type === "success" ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
          {msg.text}
          <button onClick={() => setMsg(null)} className="ml-auto opacity-50 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Cancelling notice */}
      {data?.cancelAtPeriodEnd && data.subscriptionEndsAt && (
        <div className="rounded-2xl border border-[#ffaa44]/20 bg-[#ffaa44]/5 px-4 py-3 flex items-center justify-between gap-4">
          <p className="text-sm text-[#ffaa44]">
            Pro access ends {new Date(data.subscriptionEndsAt).toLocaleDateString("en-US", {
              month: "long", day: "numeric", year: "numeric"
            })}.
          </p>
          <button onClick={reactivate}
            className="text-xs font-semibold text-[#00ff88] border border-[#00ff88]/25 hover:bg-[#00ff88]/8 px-3 py-1.5 rounded-xl transition-all shrink-0">
            Reactivate
          </button>
        </div>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-2 gap-4">

        {/* Free */}
        <div className={`rounded-2xl border p-5 space-y-4 ${
          isFree ? "border-white/15 bg-[#111111]" : "border-[#1a1a1a] bg-[#0e0e0e] opacity-50"
        }`}>
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-white">Free</span>
            {isFree && <span className="text-[10px] bg-white/10 text-white px-2 py-0.5 rounded-full font-mono">Current</span>}
          </div>
          <div>
            <span className="font-mono text-3xl font-bold text-white">$0</span>
            <span className="text-[#555555] text-sm"> /mo</span>
          </div>
          <ul className="space-y-2">
            {["10,000 requests/mo", "2 API keys", "2 rules & 2 alerts", "7-day log retention"].map(f => (
              <li key={f} className="flex items-start gap-2 text-xs text-[#555555]">
                <span className="text-[#333333] shrink-0 mt-0.5">✓</span>{f}
              </li>
            ))}
          </ul>
        </div>

        {/* Pro */}
        <div className={`rounded-2xl border p-5 space-y-4 relative ${
          isPro ? "border-[#00ff88]/30 bg-[#00ff88]/5" : "border-[#1a1a1a] bg-[#0e0e0e]"
        }`} style={isPro ? { boxShadow: "0 0 40px rgba(0,255,136,0.06)" } : {}}>
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
            <span className="text-[9px] bg-[#00ff88] text-black font-bold px-2.5 py-0.5 rounded-full">RECOMMENDED</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-white">Pro</span>
            {isPro && <span className="text-[10px] bg-[#00ff88]/20 text-[#00ff88] px-2 py-0.5 rounded-full font-mono">Current</span>}
          </div>
          <div>
            <span className="font-mono text-3xl font-bold text-white">$9</span>
            <span className="text-[#555555] text-sm"> CAD/mo</span>
          </div>
          <ul className="space-y-2">
            {["Unlimited requests", "30 API keys & rules", "Semantic cache", "90-day log retention", "Email alerts", "Workspace (10 members)"].map(f => (
              <li key={f} className="flex items-start gap-2 text-xs text-[#888888]">
                <span className="text-[#00ff88] shrink-0 mt-0.5">✓</span>{f}
              </li>
            ))}
          </ul>

          {/* Upgrade button — free users only */}
          {isFree && (
            <a href={STRIPE_PRO_LINK} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 w-full bg-[#00ff88] hover:bg-[#00dd77] text-black text-sm font-bold py-2.5 rounded-xl transition-all">
              <Zap size={13} /> Upgrade to Pro <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>

      {/* Cancel subscription — Pro only, not already cancelling */}
      {isPro && !data?.cancelAtPeriodEnd && (
        <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-2xl p-5">
          {!showCancelConfirm ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white">Cancel subscription</p>
                <p className="text-xs text-[#444444] mt-0.5">
                  You&apos;ll keep Pro access until the end of your billing period.
                </p>
              </div>
              <button onClick={() => setShowCancelConfirm(true)}
                className="text-xs text-[#888888] hover:text-[#ff6666] border border-[#222222] hover:border-[#ff4444]/30 px-3 py-1.5 rounded-xl transition-all shrink-0">
                Cancel plan
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="text-[#ff6666] mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-[#ff6666] font-medium">Cancel Leashly Pro?</p>
                  <p className="text-xs text-[#888888] mt-1 leading-relaxed">
                    You&apos;ll keep Pro access until your billing period ends, then move to the free plan (2 keys, 2 rules, no workspace).
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={cancelSubscription} disabled={cancelling}
                  className="text-xs text-white bg-[#ff4444] hover:bg-[#dd3333] px-4 py-2 rounded-xl transition-all disabled:opacity-50">
                  {cancelling ? "Cancelling…" : "Yes, cancel"}
                </button>
                <button onClick={() => setShowCancelConfirm(false)}
                  className="text-xs text-[#888888] hover:text-white border border-[#222222] px-4 py-2 rounded-xl transition-all">
                  Keep Pro
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
