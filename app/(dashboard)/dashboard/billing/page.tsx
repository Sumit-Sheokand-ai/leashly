"use client";

import { useCallback, useState } from "react";
import { CreditCard, TrendingDown, Zap, RefreshCw, CheckCircle } from "lucide-react";
import { useDashboardData } from "@/lib/use-dashboard-data";

interface BillingData {
  billingModel: string; currentPlan: string;
  monthlySavings: number; usageBasedCost: number; flatCost: number;
  subscriptionEndsAt: string | null; cancelAtPeriodEnd: boolean; hasSubscription: boolean;
}

export default function BillingPage() {
  const fetcher = useCallback(async (): Promise<BillingData> => {
    const res = await fetch("/api/billing");
    if (!res.ok) throw new Error("Failed");
    return res.json();
  }, []);

  const { data, loading, refresh } = useDashboardData<BillingData>("dashboard:billing", fetcher);

  const [switching, setSwitching]   = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [msg, setMsg]               = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Instant API call — no debounce
  async function switchModel(model: string) {
    if (data?.billingModel === model) return;
    setSwitching(true);
    setMsg(null);
    try {
      const res = await fetch("/api/billing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingModel: model }),
      });
      if (res.ok) {
        setMsg({ text: `Switched to ${model === "flat" ? "Flat Plan" : "Pay As You Save"}.`, type: "success" });
        refresh(); // instant refresh
      } else {
        setMsg({ text: "Failed to switch plan.", type: "error" });
      }
    } catch {
      setMsg({ text: "Network error.", type: "error" });
    }
    setSwitching(false);
  }

  async function cancelSubscription() {
    setCancelling(true);
    setMsg(null);
    try {
      const res = await fetch("/api/billing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const d = await res.json();
      setMsg({ text: d.message ?? "Subscription cancelled.", type: res.ok ? "success" : "error" });
      refresh();
    } catch {
      setMsg({ text: "Network error.", type: "error" });
    }
    setCancelling(false);
  }

  async function reactivate() {
    setMsg(null);
    try {
      const res = await fetch("/api/billing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reactivate" }),
      });
      const d = await res.json();
      setMsg({ text: d.message ?? "Reactivated.", type: res.ok ? "success" : "error" });
      refresh();
    } catch {
      setMsg({ text: "Network error.", type: "error" });
    }
  }

  if (loading && !data) return (
    <div className="flex items-center justify-center h-48">
      <RefreshCw className="animate-spin text-[#00ff88]" size={20} />
    </div>
  );

  const isUsageBased = data?.billingModel === "usage_based";
  const betterPlan   = data ? (data.usageBasedCost < data.flatCost ? "usage_based" : "flat") : null;
  const isPro        = data?.currentPlan === "pro" || data?.currentPlan === "usage_based";

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h2 className="font-mono text-lg font-bold text-white flex items-center gap-2">
          <CreditCard size={18} className="text-[#888888]" /> Billing
        </h2>
        <p className="text-sm text-[#555555] mt-0.5">Choose how you pay for Leashly.</p>
      </div>

      {/* Status message */}
      {msg && (
        <div className={`rounded-2xl border px-4 py-3 flex items-center gap-2 text-sm ${
          msg.type === "success"
            ? "bg-[#00ff88]/8 border-[#00ff88]/20 text-[#00ff88]"
            : "bg-[#ff4444]/8 border-[#ff4444]/20 text-[#ff4444]"
        }`}>
          {msg.type === "success" && <CheckCircle size={14} />}
          {msg.text}
        </div>
      )}

      {/* Cancelling notice */}
      {data?.cancelAtPeriodEnd && data.subscriptionEndsAt && (
        <div className="rounded-2xl border border-[#ffaa44]/20 bg-[#ffaa44]/5 px-4 py-3 flex items-center justify-between gap-4">
          <p className="text-sm text-[#ffaa44]">
            Subscription cancels on {new Date(data.subscriptionEndsAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.
          </p>
          <button onClick={reactivate}
            className="text-xs font-semibold text-[#00ff88] border border-[#00ff88]/25 hover:bg-[#00ff88]/8 px-3 py-1.5 rounded-xl transition-all shrink-0">
            Reactivate
          </button>
        </div>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Flat */}
        <button onClick={() => switchModel("flat")} disabled={switching}
          className={`rounded-2xl border p-5 space-y-3 text-left transition-all disabled:opacity-60 ${
            !isUsageBased
              ? "border-white/20 bg-[#111111]"
              : "border-[#1a1a1a] bg-[#0e0e0e] hover:border-[#2a2a2a]"
          }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard size={15} className="text-[#888888]" />
              <span className="font-semibold text-white text-sm">Flat Plan</span>
            </div>
            {!isUsageBased && (
              <span className="text-[10px] bg-white/10 text-white px-2 py-0.5 rounded-full font-mono">Current</span>
            )}
          </div>
          <div><span className="font-mono text-3xl font-bold text-white">$9</span><span className="text-[#555555] text-sm"> CAD/mo</span></div>
          <p className="text-xs text-[#555555]">Fixed monthly cost. Predictable billing regardless of usage.</p>
          {betterPlan === "flat" && <p className="text-xs text-[#00ff88]">✓ Better for your usage</p>}
        </button>

        {/* Usage-based */}
        <button onClick={() => switchModel("usage_based")} disabled={switching}
          className={`rounded-2xl border p-5 space-y-3 text-left transition-all disabled:opacity-60 ${
            isUsageBased
              ? "border-[#00ff88]/30 bg-[#00ff88]/5"
              : "border-[#1a1a1a] bg-[#0e0e0e] hover:border-[#2a2a2a]"
          }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown size={15} className="text-[#00ff88]" />
              <span className="font-semibold text-white text-sm">Pay As You Save</span>
            </div>
            {isUsageBased && (
              <span className="text-[10px] bg-[#00ff88]/20 text-[#00ff88] px-2 py-0.5 rounded-full font-mono">Current</span>
            )}
          </div>
          <div><span className="font-mono text-3xl font-bold text-white">10%</span><span className="text-[#555555] text-sm"> of savings</span></div>
          <p className="text-xs text-[#555555]">No monthly fee. Leashly takes 10% of what it saves you — you always come out ahead.</p>
          {betterPlan === "usage_based" && <p className="text-xs text-[#00ff88]">✓ Better for your usage</p>}
        </button>
      </div>

      {/* This month calculator */}
      {data && (
        <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-2xl p-5 space-y-4">
          <p className="text-sm font-semibold text-white flex items-center gap-2">
            <Zap size={14} className="text-[#ffaa44]" /> This month&apos;s estimate
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-[#444444] mb-1">Savings generated</p>
              <p className="text-white font-mono font-medium">${data.monthlySavings.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-[#444444] mb-1">Under flat plan</p>
              <p className="text-white font-mono font-medium">$9.00 CAD</p>
            </div>
            <div>
              <p className="text-xs text-[#444444] mb-1">Under usage-based</p>
              <p className={`font-mono font-medium ${data.usageBasedCost < 9 ? "text-[#00ff88]" : "text-white"}`}>
                ${data.usageBasedCost.toFixed(2)}
                {data.usageBasedCost < 9 && (
                  <span className="text-xs ml-1 text-[#00ff88]">(save ${(9 - data.usageBasedCost).toFixed(2)})</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#444444] mb-1">Recommended</p>
              <p className="text-[#00ff88] font-medium text-sm">
                {betterPlan === "usage_based" ? "Pay As You Save" : "Flat Plan"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cancel subscription — Pro only */}
      {isPro && !data?.cancelAtPeriodEnd && (
        <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-white">Cancel subscription</p>
            <p className="text-xs text-[#444444] mt-0.5">Access continues until end of billing period. No immediate charge.</p>
          </div>
          <button onClick={cancelSubscription} disabled={cancelling}
            className="text-xs text-[#888888] hover:text-[#ff6666] border border-[#222222] hover:border-[#ff4444]/30 px-3 py-1.5 rounded-xl transition-all disabled:opacity-50 shrink-0">
            {cancelling ? "Cancelling…" : "Cancel plan"}
          </button>
        </div>
      )}
    </div>
  );
}
