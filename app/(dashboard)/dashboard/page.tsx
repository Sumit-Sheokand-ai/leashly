"use client";

import { useEffect, useState } from "react";
import { RequestsChart } from "@/components/charts/requests-chart";
import { CostChart } from "@/components/charts/cost-chart";
import { DollarSign, Activity, ShieldAlert, Shield, ExternalLink, RefreshCw, TrendingUp } from "lucide-react";
import Link from "next/link";
import { OnboardingChecklist } from "@/components/layout/onboarding-checklist";

interface Stats {
  totalSpendToday: number; requestsToday: number; flaggedToday: number; activeRules: number;
  requestsPerHour: Array<{ hour: string; count: number }>;
  costPerModel: Array<{ model: string; cost: number }>;
}

interface LogRow {
  id: string; timestamp: string; provider: string; model: string;
  promptTokens: number; completionTokens: number; totalCost: number;
  flagged: boolean; statusCode: number;
}

interface OnboardingState { hasKey: boolean; hasRule: boolean; hasRequests: boolean; }

const PROVIDER_COLORS: Record<string, string> = {
  openai: "#7c3aed", anthropic: "#ea580c", gemini: "#2563eb", custom: "#666666",
};

function ProviderBadge({ provider }: { provider: string }) {
  const color = PROVIDER_COLORS[provider] ?? "#666666";
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-mono font-medium"
      style={{ background: `${color}20`, color }}>{provider}</span>
  );
}

function StatCard({ icon: Icon, label, value, href, color = "#00ff88" }: {
  icon: React.ElementType; label: string; value: string; href?: string; color?: string;
}) {
  const inner = (
    <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-xl p-5 transition-all hover:border-[#222222]">
      <div className="mb-3">
        <div className="p-2 rounded-lg w-fit" style={{ background: `${color}14` }}>
          <Icon size={15} style={{ color }} />
        </div>
      </div>
      <div className="font-mono text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-[#555555]">{label}</div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function DashboardPage() {
  const [stats, setStats]         = useState<Stats | null>(null);
  const [logs, setLogs]           = useState<LogRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [hasData, setHasData]     = useState(false);
  const [onboarding, setOnboarding] = useState<OnboardingState>({ hasKey: false, hasRule: false, hasRequests: false });

  async function loadData() {
    setLoading(true);
    try {
      const [sRes, lRes, kRes, rRes] = await Promise.all([
        fetch("/api/stats"),
        fetch("/api/logs?page=1"),
        fetch("/api/keys"),
        fetch("/api/rules"),
      ]);

      if (sRes.ok) setStats(await sRes.json());

      if (lRes.ok) {
        const l = await lRes.json();
        setLogs(l.logs ?? []);
        const has = (l.total ?? 0) > 0;
        setHasData(has);
        setOnboarding(o => ({ ...o, hasRequests: has }));
      }

      if (kRes.ok) {
        const keys = await kRes.json();
        setOnboarding(o => ({ ...o, hasKey: Array.isArray(keys) && keys.length > 0 }));
      }

      if (rRes.ok) {
        const rules = await rRes.json();
        setOnboarding(o => ({ ...o, hasRule: Array.isArray(rules) && rules.length > 0 }));
      }
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-[#00ff88]" size={22} />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Onboarding checklist */}
      <OnboardingChecklist {...onboarding} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-mono text-lg font-bold text-white">Overview</h2>
          <p className="text-sm text-[#555555] mt-0.5">Last 24 hours</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/analytics"
            className="flex items-center gap-1.5 text-xs text-[#555555] hover:text-[#888888] border border-[#1a1a1a] hover:border-[#222222] px-3 py-1.5 rounded-lg transition-all">
            <TrendingUp size={12} /> Analytics
          </Link>
          <button onClick={loadData}
            className="text-xs border border-[#1a1a1a] text-[#555555] hover:text-[#888888] px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5">
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard icon={DollarSign} label="Spend today" value={`$${(stats?.totalSpendToday ?? 0).toFixed(4)}`} href="/dashboard/analytics" color="#00ff88" />
        <StatCard icon={Activity}   label="Requests today" value={String(stats?.requestsToday ?? 0)} href="/dashboard/logs" color="#00aaff" />
        <StatCard icon={ShieldAlert} label="Flagged today" value={String(stats?.flaggedToday ?? 0)} href="/dashboard/logs?flagged=true" color="#ff4444" />
        <StatCard icon={Shield}     label="Active rules" value={String(stats?.activeRules ?? 0)} href="/dashboard/rules" color="#ffaa00" />
      </div>

      {/* Charts */}
      {hasData && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-xl p-5">
            <h3 className="font-mono text-xs font-semibold text-[#888888] uppercase tracking-wider mb-4">Requests / hour</h3>
            <RequestsChart data={stats?.requestsPerHour ?? []} />
          </div>
          <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-xl p-5">
            <h3 className="font-mono text-xs font-semibold text-[#888888] uppercase tracking-wider mb-4">Cost by model</h3>
            <CostChart data={stats?.costPerModel ?? []} />
          </div>
        </div>
      )}

      {/* Recent requests */}
      <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#111111]">
          <h3 className="font-mono text-xs font-semibold text-[#888888] uppercase tracking-wider">Recent requests</h3>
          <Link href="/dashboard/logs"
            className="text-xs text-[#444444] hover:text-[#00ff88] flex items-center gap-1 transition-colors">
            View all <ExternalLink size={11} />
          </Link>
        </div>
        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-6">
            <Activity size={28} className="text-[#222222]" />
            <div>
              <p className="text-[#666666] text-sm font-medium">No requests yet</p>
              <p className="text-[#333333] text-xs mt-1 max-w-xs">Add an API key and point your app at the Leashly proxy to start seeing usage here</p>
            </div>
            <Link href="/dashboard/keys"
              className="mt-2 bg-[#00ff88] hover:bg-[#00dd77] text-black text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
              Add API Key →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#111111]">
                  {["Time", "Provider", "Model", "Tokens", "Cost", "Status"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] text-[#333333] font-mono font-normal tracking-wider uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0d0d0d]">
                {logs.slice(0, 8).map(log => (
                  <tr key={log.id} className="hover:bg-[#0d0d0d] transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-[#555555] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-5 py-3"><ProviderBadge provider={log.provider} /></td>
                    <td className="px-5 py-3 font-mono text-xs text-[#cccccc] max-w-[140px] truncate">{log.model}</td>
                    <td className="px-5 py-3 font-mono text-xs text-[#555555]">
                      {(log.promptTokens + log.completionTokens).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-[#cccccc]">${log.totalCost.toFixed(6)}</td>
                    <td className="px-5 py-3">
                      {log.flagged
                        ? <span className="bg-[#ff4444]/12 text-[#ff5555] text-xs px-2 py-0.5 rounded-full font-mono">flagged</span>
                        : <span className="bg-[#00ff88]/8 text-[#00dd77] text-xs px-2 py-0.5 rounded-full font-mono">ok</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
