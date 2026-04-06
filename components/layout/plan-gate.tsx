"use client";
// components/layout/plan-gate.tsx
// Shows an upgrade prompt when a free user hits a plan limit

import Link from "next/link";
import { Lock, Zap } from "lucide-react";

interface PlanGateProps {
  feature: string;
  description: string;
  current: number;
  limit: number;
  showUpgrade?: boolean;
}

export function PlanBanner({ feature, description, current, limit, showUpgrade = true }: PlanGateProps) {
  const pct = Math.round((current / limit) * 100);
  const atLimit = current >= limit;

  return (
    <div className={`rounded-2xl border px-4 py-3 flex items-center justify-between gap-4 ${
      atLimit
        ? "bg-[#ffaa44]/5 border-[#ffaa44]/20"
        : "bg-[var(--surface-1)] border-[var(--border-mid)]"
    }`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
          atLimit ? "bg-[#ffaa44]/15" : "bg-[var(--surface-3)]"
        }`}>
          <Lock size={13} className={atLimit ? "text-[#ffaa44]" : "text-[var(--text-ghost)]"} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white">
            {feature}: <span className={atLimit ? "text-[#ffaa44]" : "text-[var(--text-dim)]"}>
              {current} / {limit}
            </span>
          </p>
          <p className="text-xs text-[var(--text-ghost)] truncate">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {/* Progress bar */}
        <div className="w-24 bg-[var(--surface-3)] rounded-full h-1.5 hidden sm:block">
          <div className="h-1.5 rounded-full transition-all" style={{
            width: `${Math.min(pct, 100)}%`,
            background: atLimit ? "#ffaa44" : "#00ff88",
          }} />
        </div>
        {showUpgrade && atLimit && (
          <Link href="/dashboard/billing"
            className="flex items-center gap-1.5 text-xs font-semibold bg-[#ffaa44]/15 hover:bg-[#ffaa44]/25 text-[#ffaa44] border border-[#ffaa44]/20 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap">
            <Zap size={11} /> Upgrade
          </Link>
        )}
      </div>
    </div>
  );
}

export function ProGate({ feature, children }: { feature: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--border-mid)] bg-[var(--surface-1)] p-8 text-center space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-[#ffaa44]/10 border border-[#ffaa44]/20 flex items-center justify-center mx-auto">
        <Lock size={20} className="text-[#ffaa44]" />
      </div>
      <div>
        <h3 className="font-mono font-bold text-white text-base mb-1">{feature} is a Pro feature</h3>
        <p className="text-sm text-[var(--text-dim)] max-w-sm mx-auto">
          Upgrade to Pro to unlock {feature.toLowerCase()} and all other premium features.
        </p>
      </div>
      {children}
      <Link href="/dashboard/billing"
        className="inline-flex items-center gap-2 bg-[#00ff88] hover:bg-[#00cc6e] text-black text-sm font-semibold px-6 py-2.5 rounded-xl transition-all">
        <Zap size={14} /> Upgrade to Pro — $9 CAD/mo
      </Link>
      <p className="text-xs text-[var(--text-ghost)]">Cancel anytime · Instant access</p>
    </div>
  );
}
